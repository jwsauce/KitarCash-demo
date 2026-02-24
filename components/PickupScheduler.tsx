import React, { useState, useEffect } from 'react';
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import { EWasteItem } from '../types';
import { mockRecyclingCenters } from '../services/mockData';
import MapComponent from './MapComponent';
import {
  savePickupRequest,
  countNearbyRequests,
  runPoolingAlgorithm,
  fetchUserEmails,
  cancelPickupRequest,
} from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { sendPickupConfirmation } from '../services/emailService';

interface PickupSchedulerProps {
  identifiedItem: EWasteItem | null;
  initialOption?: 'manual' | 'pickup' | null;
  setCurrentView: (view: 'chatbot' | 'pickup' | 'wallet') => void;
}

const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const STATUS_STEPS = [
  { key: 'waiting',   label: 'Submitted',      icon: '📋' },
  { key: 'pooled',    label: 'Pool Confirmed',  icon: '🤝' },
  { key: 'assigned',  label: 'Driver Assigned', icon: '🚗' },
  { key: 'completed', label: 'Completed',       icon: '✅' },
];

const getStepIndex = (status: string) =>
  STATUS_STEPS.findIndex(s => s.key === status);

interface StatusTrackerProps {
  status: string;
  requestId: string | null;
  onCancel: () => void;
  isCancelling: boolean;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ status, requestId, onCancel, isCancelling }) => {
  const currentStep = getStepIndex(status);
  const canCancel = status === 'waiting' || status === 'pooled';

  return (
    <div className="space-y-6">
      {/* Step Progress Bar */}
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 z-0 transition-all duration-700"
          style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
        />

        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStep;
          return (
            <div key={step.key} className="flex flex-col items-center z-10 w-1/4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.icon}
              </div>
              <p className={`text-xs mt-2 font-medium text-center ${isCompleted ? 'text-green-700' : 'text-gray-400'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-xl text-center ${
        status === 'waiting'   ? 'bg-yellow-50 border border-yellow-200' :
        status === 'pooled'    ? 'bg-blue-50 border border-blue-200' :
        status === 'assigned'  ? 'bg-purple-50 border border-purple-200' :
        status === 'completed' ? 'bg-green-50 border border-green-200' :
                                 'bg-gray-50 border border-gray-200'
      }`}>
        {status === 'waiting' && (
          <>
            <p className="font-bold text-yellow-800">⏳ Looking for nearby recyclers...</p>
            <p className="text-sm text-gray-500 mt-1">You'll be notified once a pool is formed.</p>
          </>
        )}
        {status === 'pooled' && (
          <>
            <p className="font-bold text-blue-800">🎉 Pool Confirmed! FREE Pickup Activated.</p>
            <p className="text-sm text-gray-500 mt-1">A driver will be assigned shortly.</p>
          </>
        )}
        {status === 'assigned' && (
          <>
            <p className="font-bold text-purple-800">🚗 Driver is on the way!</p>
            <p className="text-sm text-gray-500 mt-1">Please be available at your pickup address.</p>
          </>
        )}
        {status === 'completed' && (
          <>
            <p className="font-bold text-green-800">✅ Pickup Completed!</p>
            <p className="text-sm text-gray-500 mt-1">Thank you for recycling with KitarCash.</p>
          </>
        )}
      </div>

      {/* Cancel Button */}
      {canCancel && requestId && (
        <div className="text-center">
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Pickup Request'}
          </button>
          <p className="text-xs text-gray-400 mt-1">You can only cancel before a driver is assigned.</p>
        </div>
      )}
    </div>
  );
};

const PickupScheduler: React.FC<PickupSchedulerProps> = ({ identifiedItem, initialOption = null, setCurrentView }) => {
  const { user } = useAuth();
  const [option, setOption] = useState<'manual' | 'pickup' | null>(initialOption);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poolStatus, setPoolStatus] = useState<'idle' | 'waiting' | 'pooled' | 'assigned' | 'completed' | 'cancelled'>('idle');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }, []);

  // Real-time listener — updates status tracker when driver acts
  useEffect(() => {
    if (!currentRequestId) return;

    const unsubscribe = onSnapshot(doc(db, "pickupRequests", currentRequestId), (snap) => {
      if (snap.exists()) {
        const status = snap.data().status;
        if (['waiting', 'pooled', 'assigned', 'completed', 'cancelled'].includes(status)) {
          setPoolStatus(status);
        }
      }
    });

    return () => unsubscribe();
  }, [currentRequestId]);

  const handleDirectToCentre = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleSchedulePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.target as HTMLFormElement;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          const requestId = await savePickupRequest({
            userId: user?.id || 'anonymous',
            address: (form.address as any).value,
            contactNumber: (form.contactNumber as any).value,
            item: (form.item as any).value,
            quantity: Number((form.quantity as any).value),
            addOn: (form.addOn as any).value || '',
            lat,
            lng,
            status: 'waiting',
            createdAt: new Date().toISOString(),
          });

          setCurrentRequestId(requestId);

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

        } catch (err) {
          setError('Failed to submit request. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError('Please allow location access to schedule a pickup.');
        setIsSubmitting(false);
      }
    );
  };

  const handleCancelPickup = async () => {
    if (!currentRequestId) return;
    setIsCancelling(true);
    try {
      await cancelPickupRequest(currentRequestId);
      setCurrentRequestId(null);
      setShowCancelConfirm(false);
    } catch (err) {
      setError('Failed to cancel request. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

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
      setOption('manual');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Find a Drop-off or Schedule a Pickup</h2>

        <div className="w-full mb-6">
          <MapComponent centers={mockRecyclingCenters} height="250px" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleSendManually}
            className={`p-4 rounded-lg text-left transition-all duration-300 ${option === 'manual' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            <h3 className="font-bold">Send Manually</h3>
            <p className="text-sm">Find the nearest recycling center to drop off your items.</p>
          </button>
          <button
            onClick={() => setOption('pickup')}
            className={`p-4 rounded-lg text-left transition-all duration-300 ${option === 'pickup' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            <h3 className="font-bold">Schedule Pickup</h3>
            <p className="text-sm">Join a community pool for a free or discounted pickup.</p>
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6">
        {!option && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select an option to continue.</p>
          </div>
        )}

        {option === 'manual' && (
          <div>
            <h3 className="text-xl font-bold text-green-700 mb-4">Nearby Recycling Centers</h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {mockRecyclingCenters.map(center => (
                <div key={center.id} className="bg-gray-100 p-4 rounded-lg border border-transparent hover:border-green-500 transition-all">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-gray-800">{center.name}</h4>
                    <span className="text-xs font-bold text-green-600">
                      {userLocation
                        ? getDistanceKm(userLocation.lat, userLocation.lng, center.lat, center.lng).toFixed(1)
                        : center.distance}km
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{center.address}</p>
                  <p className="text-xs mt-1">Hours: {center.operatingHours} | Contact: {center.contact}</p>
                  <button
                    onClick={() => handleDirectToCentre(center.lat, center.lng)}
                    className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                  >
                    Select & Navigate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {option === 'pickup' && (
          <div>
            <h3 className="text-xl font-bold text-green-700 mb-4">Schedule a Community Pickup</h3>

            {/* Status Tracker — shown after submission */}
            {(poolStatus === 'waiting' || poolStatus === 'pooled' || poolStatus === 'assigned' || poolStatus === 'completed') && (
              <>
                {showCancelConfirm && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="font-semibold text-red-800 text-sm">Are you sure you want to cancel?</p>
                    <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleCancelPickup}
                        disabled={isCancelling}
                        className="flex-1 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300"
                      >
                        Keep Request
                      </button>
                    </div>
                  </div>
                )}

                <StatusTracker
                  status={poolStatus}
                  requestId={currentRequestId}
                  onCancel={() => setShowCancelConfirm(true)}
                  isCancelling={isCancelling}
                />
              </>
            )}

            {/* Cancelled State */}
            {poolStatus === 'cancelled' && (
              <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="text-5xl">❌</div>
                <h4 className="text-xl font-bold text-gray-700">Request Cancelled</h4>
                <p className="text-sm text-gray-500">Your pickup request has been cancelled.</p>
                <button
                  onClick={() => setPoolStatus('idle')}
                  className="mt-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit New Request
                </button>
              </div>
            )}

            {/* Form — shown when idle */}
            {poolStatus === 'idle' && (
              <form onSubmit={handleSchedulePickup} className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-600">Address</label>
                  <input type="text" id="address" name="address" required
                    className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="123, Jalan Hijau, Kuala Lumpur" />
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-600">Contact Number</label>
                  <input type="tel" id="contactNumber" name="contactNumber" required
                    className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 012-3456789" />
                </div>
                <div>
                  <label htmlFor="item" className="block text-sm font-medium text-gray-600">Item</label>
                  <input type="text" id="item" name="item" defaultValue={identifiedItem?.itemName || ''} required
                    className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-600">Quantity</label>
                  <input type="number" id="quantity" name="quantity" defaultValue={1} min="1" required
                    className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="addOn" className="block text-sm font-medium text-gray-600">Add On (optional)</label>
                  <input type="text" id="addOn" name="addOn"
                    className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. fragile, needs special handling" />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
                  {isSubmitting ? 'Submitting...' : 'Join Pickup Pool'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupScheduler;