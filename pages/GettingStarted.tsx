
import React from 'react';
import { CameraIcon, TruckIcon, CashIcon } from '../components/IconComponents';
import AuthCard from '../components/auth/AuthCard';

const GettingStarted: React.FC = () => {
  const features = [
    { icon: <CameraIcon className="w-8 h-8 text-green-500" />, text: 'AI Snap & Identify' },
    { icon: <TruckIcon className="w-8 h-8 text-green-500" />, text: 'Smart Community Pickup' },
    { icon: <CashIcon className="w-8 h-8 text-green-500" />, text: 'Earn Cash from Recycling' },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Section: Brand + Description */}
        <div className="text-center lg:text-left p-8">
          <h1 className="text-5xl md:text-6xl font-bold text-green-800">
            Welcome to KitarCash 🌱
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
            Recycle your e-waste and earn cash back! KitarCash uses AI to identify your electronic waste, guide you through safe disposal, and connect you to nearby recycling centers — while rewarding you for making sustainable choices.
          </p>
          <ul className="mt-8 space-y-4 flex flex-col items-center lg:items-start">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">{feature.icon}</div>
                <span className="font-semibold text-gray-700">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right Section: Authentication Card */}
        <div className="flex justify-center items-center">
            <AuthCard />
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
