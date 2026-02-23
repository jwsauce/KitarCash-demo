import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

// Initialize the Admin SDK once
admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION: setUserRole
//
// This is an ADMIN TOOL. You call this manually (via the Firebase Emulator or
// a one-time script) to assign roles to your test accounts.
//
// Usage: Call this function with { uid: "...", role: "recycling_center", centerId: "center_xyz" }
// ─────────────────────────────────────────────────────────────────────────────
export const setUserRole = onCall(async (request) => {
  // For the demo: only allow this if the caller is already an admin
  // For initial setup: temporarily remove this check, call it once, then put it back
  // if (request.auth?.token.role !== 'admin') {
  //   throw new HttpsError('permission-denied', 'Only admins can set roles.');
  // }

  const { uid, role, centerId } = request.data;

  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'uid and role are required.');
  }

  const validRoles = ['user', 'recycling_center', 'driver', 'admin'];
  if (!validRoles.includes(role)) {
    throw new HttpsError('invalid-argument', `Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Set the custom claim on the user's Firebase Auth token
  const claims: Record<string, string> = { role };
  if (role === 'recycling_center' && centerId) {
    claims.centerId = centerId;
  }

  await admin.auth().setCustomUserClaims(uid, claims);

  // Also write the role to the users Firestore doc so you can display it in the UI
  await db.collection('users').doc(uid).set(
    { role, centerId: centerId || null },
    { merge: true }
  );

  return { success: true, message: `Role '${role}' set for user ${uid}` };
});


// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION: createTransaction 
// ─────────────────────────────────────────────────────────────────────────────
export const createTransaction = onCall(async (request) => {
  // 1. Verify the user is logged in
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to create a transaction.');
  }

  // 2. Verify they have the 'user' role
  if (request.auth.token.role !== 'user') {
    throw new HttpsError('permission-denied', 'Only regular users can create transactions.');
  }

  // 3. Extract and validate input from the client
  const { itemName, itemCategory, estimatedValueMin, estimatedValueMax } = request.data;

  if (!itemName || !itemCategory) {
    throw new HttpsError('invalid-argument', 'itemName and itemCategory are required.');
  }

  // 4. Generate a unique transaction ID
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 5. Write the transaction to Firestore
  // Only the server (Admin SDK) can write here — your Firestore rules block client writes
  await db.collection('transactions').doc(txnId).set({
    txnId,
    userId: request.auth.uid,
    itemName,
    itemCategory,
    estimatedValueMin: estimatedValueMin || 0,
    estimatedValueMax: estimatedValueMax || 0,
    status: 'qr_generated',   // This is the only valid starting status
    finalReward: null,          // Only verifyAndCredit can set this
    finalWeightKg: null,
    valuationMethod: null,
    centerId: null,
    verifiedBy: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    verifiedAt: null,
    paidAt: null,
    // Reserved for future pickup expansion — not used in MVP
    _pickup: {
      driverId: null,
      poolGroupId: null,
      pickupScheduledAt: null,
      otpCode: null,
      pickupStatus: null,
    },
  });

  // 6. Return the txnId to the client so it can generate the QR
  return { txnId };
});


// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION: verifyAndCredit
// ─────────────────────────────────────────────────────────────────────────────
export const verifyAndCredit = onCall(async (request) => {
  // 1. Verify the caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in.');
  }

  // 2. Verify the caller has the recycling_center role (from JWT token — not Firestore)
  if (request.auth.token.role !== 'recycling_center') {
    throw new HttpsError('permission-denied', 'Only recycling center staff can verify transactions.');
  }

  // 3. Get centerId from the caller's token (not from the request body — prevents spoofing)
  const callerCenterId = request.auth.token.centerId as string;
  if (!callerCenterId) {
    throw new HttpsError('failed-precondition', 'Your account is not linked to a recycling center.');
  }

  // 4. Extract and validate form inputs from the client
  const { transactionId, confirmedDeviceType, finalReward, valuationMethod, finalWeightKg } = request.data;

  if (!transactionId || typeof transactionId !== 'string') {
    throw new HttpsError('invalid-argument', 'transactionId is required.');
  }
  if (!confirmedDeviceType || typeof confirmedDeviceType !== 'string') {
    throw new HttpsError('invalid-argument', 'confirmedDeviceType is required.');
  }
  if (typeof finalReward !== 'number' || finalReward <= 0) {
    throw new HttpsError('invalid-argument', 'finalReward must be a positive number.');
  }
  if (valuationMethod !== 'device_based' && valuationMethod !== 'weight_based') {
    throw new HttpsError('invalid-argument', 'valuationMethod must be "device_based" or "weight_based".');
  }

  // 5. Run everything inside a Firestore transaction
  //    This guarantees atomicity — both writes succeed together or both fail together.
  //    It also prevents double-credit from simultaneous scans.
  const txnRef = db.collection('transactions').doc(transactionId);

  await db.runTransaction(async (firestoreTransaction) => {
    // 5a. Read the transaction document (inside the transaction — this creates a lock)
    const txnSnap = await firestoreTransaction.get(txnRef);

    if (!txnSnap.exists) {
      throw new HttpsError('not-found', 'Transaction not found. This QR may be invalid.');
    }

    const txnData = txnSnap.data()!;

    // 5b. Check the status — this is the double-spend prevention check
    if (txnData.status !== 'qr_generated') {
      throw new HttpsError(
        'failed-precondition',
        `This transaction cannot be processed. Current status: ${txnData.status}`
      );
    }

    // 5c. Get the user's wallet document reference
    const userRef = db.collection('users').doc(txnData.userId);
    const userSnap = await firestoreTransaction.get(userRef);

    if (!userSnap.exists) {
      // Create the wallet field if the document exists but is missing walletBalance
      firestoreTransaction.set(userRef, { walletBalance: finalReward }, { merge: true });
    } else {
      const currentBalance = userSnap.data()!.walletBalance || 0;
      firestoreTransaction.update(userRef, {
        walletBalance: currentBalance + finalReward,
      });
    }

    const currentBalance = userSnap.data()!.walletBalance || 0;

    // 5d. Perform both writes atomically
    // Write 1: Update the transaction record
    firestoreTransaction.update(txnRef, {
      status: 'paid',
      finalReward,
      confirmedDeviceType,
      valuationMethod,
      finalWeightKg: finalWeightKg || null,
      centerId: callerCenterId,
      verifiedBy: request.auth!.uid,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Write 2: Increment user's wallet balance
    firestoreTransaction.update(userRef, {
      walletBalance: currentBalance + finalReward,
    });

    // Both writes are committed together. If either fails, both are rolled back.
  });

  return { success: true };
});