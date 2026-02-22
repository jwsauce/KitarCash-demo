import React, { useState } from 'react';
import { EWasteItem } from '../types';
import { mockRecyclingCenters } from '../services/mockData';
import MapComponent from './MapComponent';
import { savePickupRequest, countNearbyRequests, runPoolingAlgorithm } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

interface PickupSchedulerProps {
  identifiedItem: EWasteItem | null;
}

const PickupScheduler: React.FC<PickupSchedulerProps> = ({ identifiedItem }) => {
  const { user } = useAuth();
  const [option, setOption] = useState<'manual' | 'pickup' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poolStatus, setPoolStatus] = useState<'idle' | 'waiting' | 'pooled'>('idle');
  const [error, setError] = useState<string | null>(null);

  console.log("Current poolStatus:", poolStatus);

  const handleSchedulePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.target as HTMLFormElement;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("Got location:", position.coords);
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          await savePickupRequest({
            userId: user?.id || 'anonymous',
            address: (form.address as any).value,
            item: (form.item as any).value,
            quantity: Number((form.quantity as any).value),
            addOn: (form.addOn as any).value || '',
            lat,
            lng,
            status: 'waiting',
            createdAt: new Date().toISOString(),
          });

          const nearbyCount = await countNearbyRequests(lat, lng);
          console.log("Nearby count:", nearbyCount);

          if (nearbyCount >= 5) {
            const pooledIds = await runPoolingAlgorithm(lat, lng);
            console.log("Pooled request IDs:", pooledIds);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left side: Map and options */}
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Find a Drop-off or Schedule a Pickup</h2>

        {/* Google Map */}
        <div className="w-full mb-6">
          <MapComponent centers={mockRecyclingCenters} height="250px" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setOption('manual')} className={`p-4 rounded-lg text-left transition-all duration-300 ${option === 'manual' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
            <h3 className="font-bold">Send Manually</h3>
            <p className="text-sm">Find the nearest recycling center to drop off your items.</p>
          </button>
          <button onClick={() => setOption('pickup')} className={`p-4 rounded-lg text-left transition-all duration-300 ${option === 'pickup' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
            <h3 className="font-bold">Schedule Pickup</h3>
            <p className="text-sm">Join a community pool for a free or discounted pickup.</p>
          </button>
        </div>
      </div>

      {/* Right side: Details based on selection */}
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
                <div key={center.id} className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-semibold">{center.name} - {center.distance}km away</h4>
                  <p className="text-sm text-gray-600">{center.address}</p>
                  <p className="text-xs mt-1">Hours: {center.operatingHours} | Contact: {center.contact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {option === 'pickup' && (
          <div>
            <h3 className="text-xl font-bold text-green-700 mb-4">Schedule a Community Pickup</h3>

            {/* Waiting state */}
            {poolStatus === 'waiting' && (
              <div className="text-center p-6 bg-yellow-50 border border-yellow-300 rounded-lg">
                <div className="text-5xl mb-4">⏳</div>
                <h4 className="text-xl font-bold text-yellow-800">Request Submitted!</h4>
                <p className="text-gray-600 mt-2">We're looking for nearby recyclers in your area.</p>
                <p className="text-sm text-gray-500 mt-1">You'll be notified once a pickup pool is formed.</p>
              </div>
            )}

            {/* Pooled state */}
            {poolStatus === 'pooled' && (
              <div className="text-center p-6 bg-green-50 border border-green-300 rounded-lg">
                <div className="text-5xl mb-4 animate-bounce">🎉</div>
                <h4 className="text-2xl font-bold text-green-800">Community Goal Reached!</h4>
                <p className="text-gray-800 mt-2">FREE Pickup Activated</p>
                <p className="text-sm text-gray-500 mt-2">A driver will be assigned shortly.</p>
              </div>
            )}

            {/* Form */}
            {poolStatus === 'idle' && (
              <form onSubmit={handleSchedulePickup} className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-600">Address</label>
                  <input type="text" id="address" name="address" required
                    className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="123, Jalan Hijau, Kuala Lumpur" />
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