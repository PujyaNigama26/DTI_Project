import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ExpiryTracking from './pages/ExpiryTracking';
import Discounts from './pages/Discounts';
import Sales from './pages/Sales';
import Alerts from './pages/Alerts';
import WasteAnalysis from './pages/WasteAnalysis';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // or a simple loading spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/expiry" element={<ExpiryTracking />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/waste" element={<WasteAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 p-3 text-center text-xs text-slate-500 z-10 hidden md:block">
          ExpirySmart v1.0 | Smart Inventory & Expiry Management System
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
