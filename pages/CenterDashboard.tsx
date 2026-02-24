import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface TransactionData {
  txnId: string;
  userId: string;
  itemName: string;
  itemCategory: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  status: string;
  finalReward: number | null;
  centerId: string | null;
}

type ValuationMethod = 'device_based' | 'weight_based';

const CenterDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Transaction state
  const [txnId, setTxnId] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);

  // Verification form state
  const [confirmedDeviceType, setConfirmedDeviceType] = useState('');
  const [finalWeightKg, setFinalWeightKg] = useState('');
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>('device_based');
  const [finalReward, setFinalReward] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Listen to transaction in real-time when txnId is set
  useEffect(() => {
    if (!txnId) return;
    setTxnLoading(true);
    setTxnError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'transactions', txnId),
      (snap) => {
        if (snap.exists()) {
          setTransaction({ txnId: snap.id, ...snap.data() } as TransactionData);
          // Pre-fill device type from Gemini's guess
          setConfirmedDeviceType(snap.data().itemName || '');
        } else {
          setTxnError('Transaction not found. This QR may be invalid.');
          setTransaction(null);
        }
        setTxnLoading(false);
      },
      (err) => {
        setTxnError('Failed to load transaction.');
        setTxnLoading(false);
      }
    );

    return () => unsubscribe();
  }, [txnId]);

  // Start QR scanner
  const startScanner = async () => {
    setScanError(null);
    setIsScanning(true);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR successfully scanned — decodedText is the txnId
          setTxnId(decodedText);
          stopScanner();
        },
        () => {} // Ignore per-frame errors
      );
    } catch (err: any) {
      setScanError('Camera access denied or not available. Please enter the transaction ID manually.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle manual txnId entry (fallback for no camera)
  const handleManualEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const id = (form.elements.namedItem('manualTxnId') as HTMLInputElement).value.trim();
    if (id) setTxnId(id);
  };

  // Submit verification to Cloud Function
  const handleConfirm = async () => {
    if (!txnId || !transaction) return;

    const reward = parseFloat(finalReward);
    if (!confirmedDeviceType.trim()) {
      setSubmitError('Please confirm the device type.');
      return;
    }
    if (isNaN(reward) || reward <= 0) {
      setSubmitError('Please enter a valid reward amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const functions = getFunctions();
      const verifyAndCredit = httpsCallable(functions, 'verifyAndCredit');
      await verifyAndCredit({
        transactionId: txnId,
        confirmedDeviceType: confirmedDeviceType.trim(),
        finalReward: reward,
        valuationMethod,
        finalWeightKg: finalWeightKg ? parseFloat(finalWeightKg) : null,
      });
      setSubmitSuccess(true);
    } catch (err: any) {
      // The Cloud Function throws HttpsError with descriptive messages
      setSubmitError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyPaid = transaction?.status === 'paid';
  const canVerify = transaction?.status === 'qr_generated';

  return (
    <div className="bg-gradient-to-br from-gray-50 to-green-100 min-h-screen text-gray-800 font-sans antialiased">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-700">♻️ Center Dashboard</h1>
            <p className="text-gray-500 text-sm">{user?.displayName} — Recycling Center Staff</p>
          </div>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors">
            Logout
          </button>
        </div>

        {/* SECTION 1: QR Scanner */}
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">1️⃣ Scan Customer QR Code</h2>

          {!txnId && (
            <>
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

              {!isScanning ? (
                <button
                  onClick={startScanner}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  📷 Start Camera Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  ✕ Stop Scanner
                </button>
              )}

              {scanError && <p className="text-red-500 text-sm mt-2">{scanError}</p>}

              {/* Manual fallback */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Or enter transaction ID manually:</p>
                <form onSubmit={handleManualEntry} className="flex gap-2">
                  <input
                    name="manualTxnId"
                    placeholder="txn_1234567890_abc123"
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                    Load
                  </button>
                </form>
              </div>
            </>
          )}

          {txnId && (
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-700">Transaction loaded</p>
                <p className="text-xs font-mono text-gray-500">{txnId}</p>
              </div>
              <button
                onClick={() => { setTxnId(null); setTransaction(null); setSubmitSuccess(false); setSubmitError(null); }}
                className="text-sm text-red-500 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: Transaction Details */}
        {txnLoading && (
          <div className="bg-white/70 rounded-2xl shadow-lg p-6 mb-6 text-center text-gray-500">
            Loading transaction...
          </div>
        )}

        {txnError && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-6 mb-6">
            <p className="text-red-600 font-medium">❌ {txnError}</p>
          </div>
        )}

        {transaction && !txnLoading && (
          <>
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-green-700 mb-4">2️⃣ Transaction Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Item Name (AI identified)</p>
                  <p className="font-semibold">{transaction.itemName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-semibold capitalize">{transaction.itemCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">AI Estimated Value</p>
                  <p className="font-semibold text-gray-400">
                    RM{transaction.estimatedValueMin}–RM{transaction.estimatedValueMax}
                    <span className="text-xs ml-1">(informational only)</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`font-semibold ${isAlreadyPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isAlreadyPaid ? '✅ Already Paid' : '⏳ Awaiting Verification'}
                  </p>
                </div>
                {isAlreadyPaid && transaction.finalReward && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Final Reward Credited</p>
                    <p className="text-2xl font-bold text-green-600">RM{transaction.finalReward.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: Verification Form — only if status is qr_generated */}
            {canVerify && !submitSuccess && (
              <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-green-700 mb-4">3️⃣ Item Verification</h2>
                <div className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmed Device Type / Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={confirmedDeviceType}
                      onChange={e => setConfirmedDeviceType(e.target.value)}
                      placeholder="e.g. iPhone 13 Pro, Samsung Galaxy S21"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Update this based on your physical inspection. The AI's guess may be wrong.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valuation Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={valuationMethod}
                      onChange={e => setValuationMethod(e.target.value as ValuationMethod)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="device_based">Device-based (resale / refurbish value)</option>
                      <option value="weight_based">Weight-based (scrap metal fallback)</option>
                    </select>
                  </div>

                  {valuationMethod === 'weight_based' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={finalWeightKg}
                        onChange={e => setFinalWeightKg(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Reward (RM) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={finalReward}
                      onChange={e => setFinalReward(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This amount will be credited to the customer's wallet immediately.
                    </p>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                      <p className="text-red-600 text-sm">❌ {submitError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg transition-colors text-lg"
                  >
                    {isSubmitting ? 'Processing...' : '✅ Confirm & Credit Wallet'}
                  </button>
                </div>
              </div>
            )}

            {/* Success state */}
            {submitSuccess && (
              <div className="bg-green-50 border border-green-300 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-800">Wallet Credited!</h3>
                <p className="text-gray-600 mt-2">
                  RM{parseFloat(finalReward).toFixed(2)} has been added to the customer's wallet.
                </p>
                <button
                  onClick={() => { setTxnId(null); setTransaction(null); setSubmitSuccess(false); setFinalReward(''); setConfirmedDeviceType(''); }}
                  className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Scan Next QR
                </button>
              </div>
            )}

            {/* Already paid warning */}
            {isAlreadyPaid && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-6 text-center">
                <p className="text-yellow-800 font-medium">
                  ⚠️ This QR code has already been processed. No further action is needed.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CenterDashboard;