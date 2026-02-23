import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-green-100 min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-white/70 rounded-2xl shadow-lg max-w-md">
        <div className="text-6xl mb-4">⚙️</div>
        <h1 className="text-2xl font-bold text-green-700">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">Admin tools coming soon.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;