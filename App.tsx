
import React, { useState } from 'react';
import Header from './components/Header';
import Chatbot from './components/Chatbot';
import PickupScheduler from './components/PickupScheduler';
import Wallet from './components/Wallet';
import { EWasteItem } from './types';
import { useAuth } from './context/AuthContext';
import GettingStarted from './pages/GettingStarted';

export type View = 'chatbot' | 'pickup' | 'wallet';

/**
 * MainApp component holds the core application logic accessible only to authenticated users.
 */
const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('chatbot');
  const [identifiedItem, setIdentifiedItem] = useState<EWasteItem | null>(null);
  const [pickupOption, setPickupOption] = useState<'manual' | 'pickup' | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="mt-8">
        {/* Render Chatbot always but hide it when not active to preserve its local state */}
        <div className={currentView === 'chatbot' ? 'block' : 'hidden'}>
          <Chatbot setIdentifiedItem={setIdentifiedItem} setCurrentView={setCurrentView} setPickupOption={setPickupOption} />
        </div>
        {currentView === 'pickup' && <PickupScheduler identifiedItem={identifiedItem} initialOption={pickupOption} />}
        {currentView === 'wallet' && <Wallet />}
      </main>
    </div>
  )
}

/**
 * The root App component now handles routing based on authentication state.
 */
const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Display a loading screen while the authentication state is being verified.
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-green-100 min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-green-600">Loading KitarCash...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-green-100 min-h-screen text-gray-800 font-sans antialiased">
      {user ? <MainApp /> : <GettingStarted />}
    </div>
  );
};

export default App;
