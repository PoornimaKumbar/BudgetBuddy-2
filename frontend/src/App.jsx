import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastNotification from './components/ToastNotification';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Reports from './pages/Reports';
import Accounts from './pages/Accounts';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserAccounts from './pages/AdminUserAccounts';
import PremiumDashboard from './pages/PremiumDashboard';
import Pricing from './pages/Pricing';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 pt-0">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}



function AppContent() {
  const { toast, hideToast } = useAuth();

  return (
    <>
      <ToastNotification toast={toast} onClose={hideToast} />
      <Routes>
        {/* Public / Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login" element={<Login />} />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Routes accessible to all authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Accessible to all authenticated users */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Premium & Admin Only Routes */}
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['premium', 'admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/premium" 
            element={
              <ProtectedRoute allowedRoles={['premium', 'admin']}>
                <PremiumDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin Only Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/:userId/accounts" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserAccounts />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
