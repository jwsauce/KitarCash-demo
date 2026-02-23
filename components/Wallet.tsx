import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, QrCodeIcon } from './IconComponents';
import ConfirmationModal from './ConfirmationModal';

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

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeQrTxnId, setActiveQrTxnId] = useState<string | null>(null);
  const [isCreatingTxn, setIsCreatingTxn] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Listen to wallet balance in real-time
  useEffect(() => {
    if (!user) return;
    console.log('Listening to wallet for UID:', user.id);
    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      console.log('User doc data:', snap.data());
      if (snap.exists()) {
        setWalletBalance(snap.data().walletBalance || 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Listen to transaction history in real-time
  useEffect(() => {
    if (!user) return;
    const txnQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(txnQuery, (snap) => {
      const txns = snap.docs.map(d => ({ txnId: d.id, ...d.data() } as Transaction));
      setTransactions(txns);
      // Auto-show QR for the most recent unverified transaction
      const pending = txns.find(t => t.status === 'qr_generated');
      if (pending && !activeQrTxnId) {
        setActiveQrTxnId(pending.txnId);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleGenerateQR = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmGenerateQR = async () => {
    setShowConfirmModal(false);
    setIsCreatingTxn(true);
    setTxnError(null);
    try {
      const functions = getFunctions();
      const createTransaction = httpsCallable(functions, 'createTransaction');
      const result = await createTransaction({
        itemName: 'Test Item',
        itemCategory: 'other',
        estimatedValueMin: 0,
        estimatedValueMax: 0,
      });
      const { txnId } = result.data as { txnId: string };
      setActiveQrTxnId(txnId);
    } catch (err: any) {
      setTxnError(err.message || 'Failed to create transaction.');
    } finally {
      setIsCreatingTxn(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'paid') return 'text-green-600';
    if (status === 'qr_generated') return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'paid') return '✅ Paid';
    if (status === 'qr_generated') return '⏳ Awaiting Verification';
    return status;
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Manual Drop-off"
        message="Are you sure you want to generate a QR code for manual drop-off? This will create a recycling transaction."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirmGenerateQR}
        onCancel={() => setShowConfirmModal(false)}
      />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Left: Balance + QR */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 text-center">
          <h2 className="text-lg font-medium text-green-700">Wallet Balance</h2>
          <p className="text-5xl font-bold text-green-600 mt-2">
            RM{walletBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Updated in real-time</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-green-700 mb-4">Drop-off QR Code</h3>
          {activeQrTxnId ? (
            <div className="flex flex-col items-center">
              <QRCodeSVG
                value={activeQrTxnId}
                size={200}
                bgColor="#ffffff"
                fgColor="#15803d"
                className="rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                Show this at the recycling center.
              </p>
              <p className="text-xs font-mono text-gray-400 mt-1 break-all text-center">
                {activeQrTxnId}
              </p>
              <button
                onClick={() => setActiveQrTxnId(null)}
                className="mt-4 text-sm text-green-600 hover:underline"
              >
                Hide QR
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                After identifying an item with the AI, tap "Send Manually" to generate your QR.
              </p>
              <button
                onClick={handleGenerateQR}
                disabled={isCreatingTxn}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <QrCodeIcon className="w-6 h-6" />
                <span>{isCreatingTxn ? 'Generating...' : 'Generate Test QR'}</span>
              </button>
              {txnError && <p className="text-red-500 text-sm mt-2">{txnError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Right: Transaction History */}
      <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-green-700 mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No transactions yet. Identify an item and send it manually to get started!
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                      <button
                        onClick={() => setActiveQrTxnId(tx.txnId)}
                        className="text-xs text-green-600 hover:underline mt-1"
                      >
                        Show QR →
                      </button>
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
          </div>
        )}
      </div>

    </div>
    </>
  );
};

export default Wallet;