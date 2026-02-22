import React from'react';
import { View } from '../App';
import { ChatIcon, MapIcon, WalletIcon } from './IconComponents';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const { logout, user } = useAuth();
 

  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'chatbot', label: 'Identify', icon: <ChatIcon className="w-6 h-6" /> },
    { view: 'pickup', label: 'Pickup', icon: <MapIcon className="w-6 h-6" /> },
    { view: 'wallet', label: 'Wallet', icon: <WalletIcon className="w-6 h-6" /> },
  ];

  return (
    <header className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold text-green-700">KitarCash</h1>
        <p className="text-green-600">Recycle Smart. Earn Green.</p>
      </div>
      <div className="flex items-center space-x-4">
        <nav className="bg-white/60 backdrop-blur-md p-2 rounded-full shadow-lg border border-white">
          <ul className="flex items-center space-x-2">
            {navItems.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => setCurrentView(item.view)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    currentView === item.view
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors shadow-md"
        >
          Logout
        </button>
      </div>
    </header>
  );
};
export default Header;