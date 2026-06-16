import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';
import VisitorDashboard from './pages/VisitorDashboard';
import CreateVisitRequest from './pages/CreateVisitRequest';
import HostDashboard from './pages/HostDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OTPVerification />} />

          {/* Visitor Panel Routes */}
          <Route path="/visitor" element={
            <ProtectedRoute allowedRoles={['VISITOR']}>
              <DashboardLayout>
                <VisitorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/visitor/request" element={
            <ProtectedRoute allowedRoles={['VISITOR']}>
              <DashboardLayout>
                <CreateVisitRequest />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/visitor/appointments" element={
            <ProtectedRoute allowedRoles={['VISITOR']}>
              <DashboardLayout>
                <VisitorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/visitor/passes" element={
            <ProtectedRoute allowedRoles={['VISITOR']}>
              <DashboardLayout>
                <VisitorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Employee/Host Panel Routes */}
          <Route path="/host" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout>
                <HostDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/host/requests" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout>
                <HostDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/host/history" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout>
                <HostDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Security Panel Routes */}
          <Route path="/security" element={
            <ProtectedRoute allowedRoles={['SECURITY']}>
              <DashboardLayout>
                <SecurityDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/security/scan" element={
            <ProtectedRoute allowedRoles={['SECURITY']}>
              <DashboardLayout>
                <SecurityDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/security/logs" element={
            <ProtectedRoute allowedRoles={['SECURITY']}>
              <DashboardLayout>
                <SecurityDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Panel Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/visitors" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Fallback Catchall */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
