import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GettingStarted from './pages/GettingStarted';
import UserDashboard from './pages/UserDashboard';
import CenterDashboard from './pages/CenterDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public route — the only page without auth */}
      <Route path="/" element={<GettingStarted />} />

      {/* Protected routes — wrong role = redirect to / */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRole="user">
          <UserDashboard />
        </ProtectedRoute>
      } />

      <Route path="/center-dashboard" element={
        <ProtectedRoute allowedRole="recycling_center">
          <CenterDashboard />
        </ProtectedRoute>
      } />

      <Route path="/driver-dashboard" element={
        <ProtectedRoute allowedRole="driver">
          <DriverDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Unknown URLs → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;