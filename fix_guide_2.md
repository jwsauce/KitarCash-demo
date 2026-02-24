# KitarCash — Tier 1 + Tier 2 Fix Guide

Follow each fix in order. Each section tells you **which file**, **what to find**, **what to replace it with**, and **why**.

---

# 🔴 TIER 1 — Must-Fix

---

## Fix #9 — Driver can't accept "pooled" tasks

**File:** Your **deployed** [firestore.rules](file:///c:/Users/User/Desktop/KitarCash-demo/firestore.rules) (the one with the `isDriver()` helper — update it in Firebase Console or re-deploy)

**What's wrong:** The Firestore update rule only allows drivers to update requests when `status == 'waiting'`. But after pooling triggers, the status becomes `'pooled'`, and the driver gets a permission error.

**Find this line** in your pickup requests update rules:
```
(isDriver() && resource.data.status == 'waiting') ||
```

**Replace with:**
```
(isDriver() && (resource.data.status == 'waiting' || resource.data.status == 'pooled')) ||
```

**Why:** Drivers need to accept tasks that have been pooled. This one-line change allows them to update requests with either `waiting` or `pooled` status.

---

## Fix #10 — Phone number not showing for driver

**File:** [DriverDashboard.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/pages/DriverDashboard.tsx)

**What's wrong:** Line 35 reads `userData.phone` from the **user's profile document**. But the phone number is saved as `contactNumber` on the **pickup request** itself — the user document doesn't have a `phone` field.

**Find this code** (line 35):
```typescript
            userPhone: userData.phone || "No Phone Provided"
```

**Replace with:**
```typescript
            userPhone: data.contactNumber || userData.phone || "No Phone Provided"
```

**Why:** `data` is the pickup request data which contains the `contactNumber` the user typed in the form. We check it first, then fall back to the user profile's phone.

---

## Fix #7 — Driver sees un-pooled requests

**File:** [DriverDashboard.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/pages/DriverDashboard.tsx)

**What's wrong:** The Firestore query includes `'waiting'` status. This means drivers see requests from users who haven't been pooled yet — they can accept before pooling happens, skipping the pooling process entirely.

**Find this code** (line 16):
```typescript
      where("status", "in", ["waiting", "pooled", "assigned"])
```

**Replace with:**
```typescript
      where("status", "in", ["pooled", "assigned"])
```

**Why:** Now drivers only see requests that have been confirmed by the pooling algorithm (`pooled`) or already assigned to them (`assigned`). `waiting` requests are hidden until pooling triggers.

---

## Fix #11 — Pooling algorithm doesn't trigger

**File:** [firestoreService.ts](file:///c:/Users/User/Desktop/KitarCash-demo/services/firestoreService.ts)

**What's wrong:** The pooling algorithm checks `totalQuantity < 5` across all nearby `waiting` requests. But after [savePickupRequest](file:///c:/Users/User/Desktop/KitarCash-demo/services/firestoreService.ts#6-10), Firestore might not immediately return the just-saved document in a query due to query timing. Also, a single user with quantity ≥ 5 should still trigger pooling.

**Find this code** (lines 19–24):
```typescript
export const countNearbyRequests = async (lat: number, lng: number): Promise<number> => {
  const all = await fetchPickupRequests();
  return all
    .filter((r) => r.status === 'waiting' && getDistanceKm(lat, lng, r.lat, r.lng) <= 2)
    .reduce((sum, r) => sum + (r.quantity || 1), 0);
};
```

**Replace with:**
```typescript
export const countNearbyRequests = async (lat: number, lng: number, includeQuantity: number = 0): Promise<number> => {
  const all = await fetchPickupRequests();
  const nearbyTotal = all
    .filter((r) => r.status === 'waiting' && getDistanceKm(lat, lng, r.lat, r.lng) <= 2)
    .reduce((sum, r) => sum + (r.quantity || 1), 0);
  // includeQuantity ensures the just-submitted request is counted
  // even if Firestore hasn't synced the query yet
  return Math.max(nearbyTotal, nearbyTotal + includeQuantity);
};
```

Wait — actually, let's simplify this. The real fix is in **PickupScheduler.tsx** where we call this function:

**File:** [PickupScheduler.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/components/PickupScheduler.tsx)

**Find this code** (lines 201–226):
```typescript
          const nearbyCount = await countNearbyRequests(lat, lng);

          if (nearbyCount >= 5) {
            const { pooledIds, userIds } = await runPoolingAlgorithm(lat, lng);

            if (pooledIds.length >= 1) {
              const pooledUsers = await fetchUserEmails(userIds);

              await Promise.all(
                pooledUsers.map((pooledUser) =>
                  sendPickupConfirmation(
                    pooledUser.email,
                    pooledUser.fullName,
                    (form.item as any).value,
                    (form.address as any).value,
                    new Date().toISOString(),
                    'To be assigned'
                  )
                )
              );
            }

            setPoolStatus('pooled');
          } else {
            setPoolStatus('waiting');
          }
```

**Replace with:**
```typescript
          // Small delay to ensure Firestore has synced the just-saved request
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const nearbyCount = await countNearbyRequests(lat, lng);

          if (nearbyCount >= 5) {
            const { pooledIds, userIds } = await runPoolingAlgorithm(lat, lng);

            if (pooledIds.length >= 1) {
              const pooledUsers = await fetchUserEmails(userIds);

              await Promise.all(
                pooledUsers.map((pooledUser) =>
                  sendPickupConfirmation(
                    pooledUser.email,
                    pooledUser.fullName,
                    (form.item as any).value,
                    (form.address as any).value,
                    new Date().toISOString(),
                    'To be assigned'
                  )
                )
              );
            }

            setPoolStatus('pooled');
          } else {
            setPoolStatus('waiting');
          }
```

**Why:** The 1-second delay ensures Firestore has indexed the just-saved document before we query for nearby requests. Without it, the count may miss the new request.

> **Demo tip:** To easily test pooling, schedule a pickup with **quantity = 5 or more**. Since the request is from a single location, the Haversine distance to itself is 0 (within the 2km threshold), so [countNearbyRequests](file:///c:/Users/User/Desktop/KitarCash-demo/services/firestoreService.ts#19-25) will include it in the count.

---

## Fix #1 — Confirmation modal for "Send Manually" on Pickup page

**File:** [PickupScheduler.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/components/PickupScheduler.tsx)

This fix has **3 parts**: add state, add modal logic, add modal UI.

### Part 1: Add imports and state

**Find this code** (line 1):
```typescript
import React, { useState, useEffect } from 'react';
```

**Replace with:**
```typescript
import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
```

**Then find this code** (line 133):
```typescript
  const [error, setError] = useState<string | null>(null);
```

**Replace with:**
```typescript
  const [error, setError] = useState<string | null>(null);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
```

### Part 2: Update the "Send Manually" handler

**Find this code** (lines 258–279):
```typescript
  const handleSendManually = async () => {
    if (!identifiedItem) {
      setOption('manual');
      return;
    }

    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'createTransaction');
      await fn({
        itemName: identifiedItem.itemName,
        itemCategory: identifiedItem.category,
        estimatedValueMin: identifiedItem.estimatedValue.min,
        estimatedValueMax: identifiedItem.estimatedValue.max,
      });
      setCurrentView('wallet');
    } catch (err: any) {
      console.error('Failed to create transaction:', err);
      setError('Failed to create transaction. Showing nearby recycling centers instead.');
      setOption('manual');
    }
  };
```

**Replace with:**
```typescript
  const handleSendManually = () => {
    if (!identifiedItem) {
      // No item identified — just show recycling centers list
      setOption('manual');
      return;
    }
    // Show confirmation modal before creating transaction
    setShowManualConfirm(true);
  };

  const handleConfirmManualSend = async () => {
    setShowManualConfirm(false);
    if (!identifiedItem) return;

    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'createTransaction');
      await fn({
        itemName: identifiedItem.itemName,
        itemCategory: identifiedItem.category,
        estimatedValueMin: identifiedItem.estimatedValue.min,
        estimatedValueMax: identifiedItem.estimatedValue.max,
      });
      setCurrentView('wallet');
    } catch (err: any) {
      console.error('Failed to create transaction:', err);
      setError('Failed to create transaction. Showing nearby recycling centers instead.');
      setOption('manual');
    }
  };

  const handleCancelManualSend = () => {
    setShowManualConfirm(false);
    setOption('manual'); // Show recycling centers list
  };
```

### Part 3: Add the modal to the JSX

**Find this code** (line 282–283):
```typescript
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
```

**Replace with:**
```typescript
  return (
    <>
    <ConfirmationModal
      isOpen={showManualConfirm}
      title="Confirm Manual Drop-off"
      message="This will generate a QR code for manual drop-off at a recycling center. You'll be redirected to your wallet page."
      confirmLabel="Generate QR"
      cancelLabel="Show Centers Instead"
      onConfirm={handleConfirmManualSend}
      onCancel={handleCancelManualSend}
    />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
```

**Then find the very last closing** of the return (line 440–441):
```typescript
    </div>
  );
```

**Replace with:**
```typescript
    </div>
    </>
  );
```

**Why:** Now when the user clicks "Send Manually":
- **If no item identified:** Goes straight to recycling centers list (same as before)
- **If item identified:** Shows a confirmation modal first
  - **Confirm** → Creates transaction, redirects to wallet
  - **Cancel** → Shows the recycling centers list instead

---

## Fix #6 — Pickup status lost when navigating away + Pickup History

This is the biggest fix. It has **2 parts**: persist active pickup on mount, and add a history section.

### Part 1: Change [UserDashboard.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/pages/UserDashboard.tsx) to not unmount PickupScheduler

**File:** [UserDashboard.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/pages/UserDashboard.tsx)

**Find this code** (lines 27–29):
```typescript
          {currentView === 'pickup' && (
            <PickupScheduler identifiedItem={identifiedItem} initialOption={pickupOption} setCurrentView={setCurrentView} />
          )}
```

**Replace with:**
```typescript
          <div className={currentView === 'pickup' ? 'block' : 'hidden'}>
            <PickupScheduler identifiedItem={identifiedItem} initialOption={pickupOption} setCurrentView={setCurrentView} />
          </div>
```

**Why:** Instead of unmounting PickupScheduler (which destroys all state), we just **hide** it with CSS — same pattern already used for the Chatbot on line 20. This preserves the component's state (including the active request and status tracker) when switching tabs.

### Part 2: Load active request on mount

**File:** [PickupScheduler.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/components/PickupScheduler.tsx)

Add an import at the top. **Find** (line 2):
```typescript
import { onSnapshot, doc } from "firebase/firestore";
```

**Replace with:**
```typescript
import { onSnapshot, doc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
```

**Then, add a new `useEffect` right after the geolocation `useEffect`. Find** (lines 150–151):
```typescript
  }, []);


```

**Replace with:**
```typescript
  }, []);

  // Load active pickup request on mount (restores state after tab switch)
  useEffect(() => {
    if (!user || currentRequestId) return; // skip if already tracking a request

    const loadActiveRequest = async () => {
      try {
        const q = query(
          collection(db, "pickupRequests"),
          where("userId", "==", user.id),
          where("status", "in", ["waiting", "pooled", "assigned"]),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const active = snap.docs[0];
          setCurrentRequestId(active.id);
          setPoolStatus(active.data().status);
          setOption('pickup');
        }
      } catch (err) {
        console.error("Failed to load active pickup:", err);
      }
    };

    loadActiveRequest();
  }, [user]);

```

### Part 3: Add pickup history section

Still in **[PickupScheduler.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/components/PickupScheduler.tsx)**, add state for history. **Find** (line 134):
```typescript
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
```

**Replace with:**
```typescript
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupHistory, setPickupHistory] = useState<any[]>([]);
```

**Then add a `useEffect` to load history. Paste this right after the "Load active pickup request" `useEffect` you just added (after the `loadActiveRequest();` block):**

```typescript
  // Load pickup history
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "pickupRequests"),
      where("userId", "==", user.id),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPickupHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [user]);
```

**Now add the history UI.** Find the closing `</div>` of the right panel (last part of the JSX). **Find** (around line 437–441):
```typescript
          </div>
        )}
      </div>
    </div>
    </>
```

**Replace with:**
```typescript
          </div>
        )}

        {/* Pickup History */}
        {pickupHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-green-700 mb-3">📦 Pickup History</h3>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
              {pickupHistory.map((req) => (
                <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{req.item}</p>
                    <p className="text-xs text-gray-500">{req.address}</p>
                    <p className="text-xs text-gray-400">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    req.status === 'completed' ? 'bg-green-100 text-green-700' :
                    req.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    req.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                    req.status === 'pooled' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
```

**Why:**
- **Part 1** prevents state loss by keeping the component mounted (hidden instead of removed)
- **Part 2** loads any active pickup request on first render, restoring the status tracker
- **Part 3** shows a scrollable history of past pickup requests with color-coded status badges

---

# 🟡 TIER 2 — Should-Fix

---

## Fix #3 — Cancel "awaiting verification" transactions

This needs **3 changes**: a new Cloud Function, a Firestore rules update, and a cancel button in the Wallet UI.

### Part 1: Add Cloud Function

**File:** [functions/src/index.ts](file:///c:/Users/User/Desktop/KitarCash-demo/functions/src/index.ts)

**Find this code** (the `verifyAndCredit` section, line 128):
```typescript
// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION: verifyAndCredit
// ─────────────────────────────────────────────────────────────────────────────
```

**Paste this new function ABOVE it** (before line 128):
```typescript
// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION: cancelTransaction
// ─────────────────────────────────────────────────────────────────────────────
export const cancelTransaction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.');
  }

  const { transactionId } = request.data;
  if (!transactionId) {
    throw new HttpsError('invalid-argument', 'transactionId is required.');
  }

  const txnRef = db.collection('transactions').doc(transactionId);
  const txnSnap = await txnRef.get();

  if (!txnSnap.exists) {
    throw new HttpsError('not-found', 'Transaction not found.');
  }

  const txnData = txnSnap.data()!;

  // Only the owner can cancel
  if (txnData.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You can only cancel your own transactions.');
  }

  // Only qr_generated (awaiting verification) can be cancelled
  if (txnData.status !== 'qr_generated') {
    throw new HttpsError('failed-precondition', 'Only awaiting-verification transactions can be cancelled.');
  }

  await txnRef.delete();

  return { success: true };
});

```

### Part 2: Add cancel button in Wallet UI

**File:** [Wallet.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/components/Wallet.tsx)

**Find this code** (lines 187–194):
```typescript
                    {tx.status === 'qr_generated' && (
                      <button
                        onClick={() => setActiveQrTxnId(tx.txnId)}
                        className="text-xs text-green-600 hover:underline mt-1"
                      >
                        Show QR →
                      </button>
                    )}
```

**Replace with:**
```typescript
                    {tx.status === 'qr_generated' && (
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={() => setActiveQrTxnId(tx.txnId)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Show QR →
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Cancel this transaction? The QR code will no longer work.')) return;
                            try {
                              const functions = getFunctions();
                              const cancelTxn = httpsCallable(functions, 'cancelTransaction');
                              await cancelTxn({ transactionId: tx.txnId });
                              if (activeQrTxnId === tx.txnId) setActiveQrTxnId(null);
                            } catch (err: any) {
                              alert(err.message || 'Failed to cancel transaction.');
                            }
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Cancel ✕
                        </button>
                      </div>
                    )}
```

**Why:** Users can now cancel transactions that haven't been verified yet. The Cloud Function validates ownership and status. Once paid, the cancel button doesn't appear. After deployment, the transaction is fully deleted from Firestore, and the real-time listener automatically removes it from the UI.

> **Deploy required:** `firebase deploy --only functions` after adding the Cloud Function.

---

## Fix #4 — Show full transaction details for user

**File:** [Wallet.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/components/Wallet.tsx)

### Part 1: Update the Transaction interface

**Find this code** (lines 10–20):
```typescript
interface Transaction {
  txnId: string;
  itemName: string;
  itemCategory: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  status: string;
  finalReward: number | null;
  createdAt: any;
  paidAt: any;
}
```

**Replace with:**
```typescript
interface Transaction {
  txnId: string;
  itemName: string;
  itemCategory: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  status: string;
  finalReward: number | null;
  centerId: string | null;
  confirmedDeviceType: string | null;
  valuationMethod: string | null;
  finalWeightKg: number | null;
  createdAt: any;
  paidAt: any;
  verifiedAt: any;
}
```

### Part 2: Update the transaction card UI

**Find this code** (lines 178–203):
```typescript
            {transactions.map((tx) => (
              <div key={tx.txnId} className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{tx.itemName}</p>
                    <p className="text-xs text-gray-500 capitalize">{tx.itemCategory}</p>
                    <p className={`text-sm font-medium mt-1 ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </p>
                    {tx.status === 'qr_generated' && (
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={() => setActiveQrTxnId(tx.txnId)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Show QR →
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Cancel this transaction? The QR code will no longer work.')) return;
                            try {
                              const functions = getFunctions();
                              const cancelTxn = httpsCallable(functions, 'cancelTransaction');
                              await cancelTxn({ transactionId: tx.txnId });
                              if (activeQrTxnId === tx.txnId) setActiveQrTxnId(null);
                            } catch (err: any) {
                              alert(err.message || 'Failed to cancel transaction.');
                            }
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Cancel ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {tx.finalReward != null ? (
                    <p className="font-bold text-green-600 text-lg">+ RM{tx.finalReward.toFixed(2)}</p>
                  ) : (
                    <p className="text-sm text-gray-400">RM{tx.estimatedValueMin}–{tx.estimatedValueMax} est.</p>
                  )}
                </div>
              </div>
            ))}
```

**Replace with:**
```typescript
            {transactions.map((tx) => (
              <div key={tx.txnId} className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{tx.itemName}</p>
                    <p className="text-xs text-gray-500 capitalize">{tx.itemCategory}</p>
                    <p className={`text-sm font-medium mt-1 ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </p>
                    {tx.status === 'qr_generated' && (
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={() => setActiveQrTxnId(tx.txnId)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Show QR →
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Cancel this transaction? The QR code will no longer work.')) return;
                            try {
                              const functions = getFunctions();
                              const cancelTxn = httpsCallable(functions, 'cancelTransaction');
                              await cancelTxn({ transactionId: tx.txnId });
                              if (activeQrTxnId === tx.txnId) setActiveQrTxnId(null);
                            } catch (err: any) {
                              alert(err.message || 'Failed to cancel transaction.');
                            }
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Cancel ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {tx.finalReward != null ? (
                    <p className="font-bold text-green-600 text-lg">+ RM{tx.finalReward.toFixed(2)}</p>
                  ) : (
                    <p className="text-sm text-gray-400">RM{tx.estimatedValueMin}–{tx.estimatedValueMax} est.</p>
                  )}
                </div>

                {/* Expanded details for paid transactions */}
                {tx.status === 'paid' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-600">Transaction ID:</span>
                      <p className="font-mono text-[10px] break-all">{tx.txnId}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Center:</span>
                      <p>{tx.centerId || 'N/A'}</p>
                    </div>
                    {tx.confirmedDeviceType && (
                      <div>
                        <span className="font-semibold text-gray-600">Verified As:</span>
                        <p>{tx.confirmedDeviceType}</p>
                      </div>
                    )}
                    {tx.finalWeightKg && (
                      <div>
                        <span className="font-semibold text-gray-600">Weight:</span>
                        <p>{tx.finalWeightKg} kg</p>
                      </div>
                    )}
                    {tx.valuationMethod && (
                      <div>
                        <span className="font-semibold text-gray-600">Valuation:</span>
                        <p className="capitalize">{tx.valuationMethod.replace('_', ' ')}</p>
                      </div>
                    )}
                    {tx.paidAt && (
                      <div>
                        <span className="font-semibold text-gray-600">Paid At:</span>
                        <p>{tx.paidAt.toDate ? tx.paidAt.toDate().toLocaleString() : 'N/A'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
```

**Why:** Paid transactions now expand to show: Transaction ID, Center ID, Verified Device Type, Weight, Valuation Method, and Payment Timestamp. This gives users full visibility into their completed transactions.

---

## Fix #5 — Transaction history for Center Dashboard

**File:** [CenterDashboard.tsx](file:///c:/Users/User/Desktop/KitarCash-demo/pages/CenterDashboard.tsx)

### Part 1: Add imports and state

**Find this code** (line 2):
```typescript
import { doc, onSnapshot } from 'firebase/firestore';
```

**Replace with:**
```typescript
import { doc, onSnapshot, collection, query, where, orderBy, limit as fbLimit, getDocs } from 'firebase/firestore';
```

**Then find** (line 45):
```typescript
  const [submitSuccess, setSubmitSuccess] = useState(false);
```

**Replace with:**
```typescript
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
```

### Part 2: Add history fetch useEffect

**Paste this new useEffect right after the existing `useEffect` for real-time txn listening (after line 73, after the `}, [txnId]);`):**

```typescript
  // Load recent verifications for this center
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('status', '==', 'paid'),
          orderBy('paidAt', 'desc'),
          fbLimit(20)
        );
        const snap = await getDocs(q);
        setRecentVerifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to load verification history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [submitSuccess]); // re-fetch when a new verification is submitted
```

### Part 3: Add history UI

Find the **very last `</div>` before the component's closing** (the end of the component's return JSX). It will be near the bottom of the file. Look for the last `</div>` in the return.

**Paste this block right before the final closing `</div>` of the main container** (before the `</div>` on the line above `);` at the end):

```typescript
      {/* Recent Verifications History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-green-800 mb-4">📋 Recent Verifications</h2>
        {historyLoading ? (
          <p className="text-gray-400 text-center py-4">Loading history...</p>
        ) : recentVerifications.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No verifications yet.</p>
        ) : (
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {recentVerifications.map((v) => (
              <div key={v.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{v.confirmedDeviceType || v.itemName}</p>
                    <p className="text-xs text-gray-500 capitalize">{v.itemCategory}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-1">{v.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">RM{(v.finalReward || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">
                      {v.paidAt?.toDate ? v.paidAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
```

**Why:** The center dashboard now shows a scrollable list of recent verifications with device type, category, reward amount, and date. It refreshes automatically after each new verification.

---

## Deploy Checklist

After applying all fixes:

```bash
firebase deploy --only functions,firestore:rules
```

| Fix | Needs Deploy? |
|-----|--------------|
| #9 (Firestore rules) | ✅ Yes — `firestore:rules` |
| #10 (phone number) | ❌ No — frontend only |
| #7 (driver query) | ❌ No — frontend only |
| #11 (pooling delay) | ❌ No — frontend only |
| #1 (confirmation modal) | ❌ No — frontend only |
| #6 (pickup persistence) | ❌ No — frontend only |
| #3 (cancel transaction) | ✅ Yes — `functions` |
| #4 (transaction details) | ❌ No — frontend only |
| #5 (center history) | ❌ No — frontend only |
