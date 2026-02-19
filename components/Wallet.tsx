
import React, { useState } from 'react';
import { mockTransactions, mockActiveRequest } from '../services/mockData';
import { Transaction, TransactionStatus } from '../types';
import { CheckCircleIcon, QrCodeIcon } from './IconComponents';

const Wallet: React.FC = () => {
    const [showQr, setShowQr] = useState(false);
    const walletBalance = mockTransactions.reduce((acc, t) => acc + t.amount, 0);

    const statusSteps = Object.values(TransactionStatus);
    const currentStatusIndex = statusSteps.indexOf(mockActiveRequest.status);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Balance and QR */}
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 text-center">
                    <h2 className="text-lg font-medium text-green-700">Wallet Balance</h2>
                    <p className="text-5xl font-bold text-green-600 mt-2">RM{walletBalance.toFixed(2)}</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-green-700 mb-4">Your QR Code</h3>
                    {showQr ? (
                         <div className="flex flex-col items-center">
                             <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=KitarCash-TXN-12345" alt="Mock QR Code" className="rounded-lg bg-white p-2" />
                             <p className="text-xs text-gray-500 mt-2">Show this at the collection point.</p>
                             <button onClick={() => setShowQr(false)} className="mt-4 text-sm text-green-600 hover:underline">Hide QR</button>
                         </div>
                    ) : (
                         <button onClick={() => setShowQr(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2">
                            <QrCodeIcon className="w-6 h-6" />
                            <span>Generate for Current Request</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Middle Column: Active Request Tracker */}
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-green-700 mb-4">Active Request Tracker</h3>
                <p className="text-md font-semibold">{mockActiveRequest.item}</p>
                <div className="relative mt-6 pl-4 border-l-2 border-gray-300">
                    {statusSteps.map((status, index) => (
                        <div key={status} className="mb-8 relative">
                            <div className={`absolute -left-[23px] top-1 w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <CheckCircleIcon className="w-5 h-5 text-white" isFilled={index <= currentStatusIndex} />
                            </div>
                            <p className={`font-semibold ${index <= currentStatusIndex ? 'text-green-600' : 'text-gray-500'}`}>{status}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Transaction History */}
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-green-700 mb-4">Transaction History</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {mockTransactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                            <div>
                                <p className="font-semibold">{tx.item}</p>
                                <p className="text-xs text-gray-500">{tx.date}</p>
                            </div>
                            <p className="font-bold text-green-600">+ RM{tx.amount.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wallet;
