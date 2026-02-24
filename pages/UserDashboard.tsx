import React, { useState } from 'react';
import Header from '../components/Header';
import Chatbot from '../components/Chatbot';
import PickupScheduler from '../components/PickupScheduler';
import Wallet from '../components/Wallet';
import { EWasteItem } from '../types';

export type View = 'chatbot' | 'pickup' | 'wallet';

const UserDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('chatbot');
  const [identifiedItem, setIdentifiedItem] = useState<EWasteItem | null>(null);
  const [pickupOption, setPickupOption] = useState<'manual' | 'pickup' | null>(null);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-green-100 min-h-screen text-gray-800 font-sans antialiased">
      <div className="container mx-auto px-4 py-8">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main className="mt-8">
          <div className={currentView === 'chatbot' ? 'block' : 'hidden'}>
            <Chatbot
              setIdentifiedItem={setIdentifiedItem}
              setCurrentView={setCurrentView}
              setPickupOption={setPickupOption}
            />
          </div>
          <div className={currentView === 'pickup' ? 'block' : 'hidden'}>
            <PickupScheduler identifiedItem={identifiedItem} initialOption={pickupOption} setCurrentView={setCurrentView} />
          </div>
          {currentView === 'wallet' && <Wallet />}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;