
import React, { useState, useEffect } from 'react';
import { EWasteItem, RecyclingCenter } from '../types';
import { mockRecyclingCenters } from '../services/mockData';

interface PickupSchedulerProps {
  identifiedItem: EWasteItem | null;
}

// Mock function to check pooling status
const checkCommunityPooling = async (location: string): Promise<boolean> => {
    console.log("Checking community pooling for:", location);
    // In a real app, this would query a backend service.
    // Here, we'll just simulate a successful pooling after a delay.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true); // Assume goal is always reached for demo
        }, 2000);
    });
};

const PickupScheduler: React.FC<PickupSchedulerProps> = ({ identifiedItem }) => {
  const [option, setOption] = useState<'manual' | 'pickup' | null>(null);
  const [isPooling, setIsPooling] = useState(false);
  const [poolActivated, setPoolActivated] = useState(false);

  const handleSchedulePickup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPooling(true);
    // A mock location, in a real app this would come from the form/user location
    checkCommunityPooling("My Neighborhood").then(activated => {
        if (activated) {
            setPoolActivated(true);
        }
        setIsPooling(false);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left side: Map and options */}
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Find a Drop-off or Schedule a Pickup</h2>
        {/* Map Placeholder */}
        <div className="w-full h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center text-gray-500">
          <p>Google Maps API Placeholder</p>
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
        {!option && <div className="flex items-center justify-center h-full"><p className="text-gray-500">Please select an option to continue.</p></div>}
        
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
            {poolActivated ? (
                 <div className="text-center p-6 bg-green-50 border border-green-300 rounded-lg animate-fade-in">
                    <div className="text-5xl mb-4 animate-bounce">🎉</div>
                    <h4 className="text-2xl font-bold text-green-800">Community Goal Reached!</h4>
                    <p className="text-gray-800 mt-2">FREE Pickup Activated</p>
                    <div className="mt-4 text-left bg-green-100/50 p-4 rounded-md">
                        <p><span className="font-semibold">Pickup Date:</span> July 28, 2024</p>
                        <p><span className="font-semibold">Location:</span> Your registered address</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSchedulePickup} className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-600">Address</label>
                        <input type="text" id="address" required className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="123, Jalan Hijau, Kuala Lumpur"/>
                    </div>
                    <div>
                        <label htmlFor="item" className="block text-sm font-medium text-gray-600">Item</label>
                        <input type="text" id="item" defaultValue={identifiedItem?.itemName || ''} required className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                     <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-600">Quantity</label>
                        <input type="number" id="quantity" defaultValue={1} min="1" required className="w-full mt-1 bg-white text-gray-800 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <button type="submit" disabled={isPooling} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
                        {isPooling ? 'Finding nearby recyclers...' : 'Join Pickup Pool'}
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
