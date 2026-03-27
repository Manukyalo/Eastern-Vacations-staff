import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DriverProvider } from './context/DriverContext';
import { LocationProvider } from './context/LocationContext';

// Pages
import Landing from './pages/Landing';
import DriverLogin from './pages/driver/DriverLogin';
import DriverRegister from './pages/driver/DriverRegister';
import DriverPendingApproval from './pages/driver/DriverPendingApproval';
import DriverDashboard from './pages/driver/DriverDashboard';
import SafariLogin from './pages/safari/SafariLogin';
import SafariRegister from './pages/safari/SafariRegister';
import SafariFaceScan from './pages/safari/SafariFaceScan';
import SafariDashboard from './pages/safari/SafariDashboard';
import SafariPendingApproval from './pages/safari/SafariPendingApproval';
import SOSSystem from './pages/safari/SOSSystem';
import ParkFees from './pages/safari/ParkFees';

// Operational Pages
import DriverTripDetail from './pages/driver/DriverTripDetail';
import SafariTripDetail from './pages/safari/SafariTripDetail';
import InspectionChecklist from './pages/shared/InspectionChecklist';
import DriverTrips from './pages/driver/DriverTrips';
import SafariTrips from './pages/safari/SafariTrips';
import PorterManagement from './pages/driver/PorterManagement';
import ExpenseLog from './pages/shared/ExpenseLog';
import Chat from './pages/shared/Chat';
import Profile from './pages/shared/Profile';
import LiveMap from './pages/shared/LiveMap';

// Components
import BottomNav from './components/ui/BottomNav';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, role, isApproved, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-primary-dark">
    <div className="skeleton w-32 h-1 rounded-full" />
  </div>;
  if (!currentUser) return <Navigate to="/" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />;
  if (!isApproved && window.location.pathname.indexOf('pending') === -1) {
    return <Navigate to={role === 'safari_driver' ? '/safari/pending' : '/driver/pending'} />;
  }

  return children;
};

const AppContent = () => {
  const { currentUser, isApproved } = useAuth();

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary pb-24">
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Driver Routes */}
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route path="/driver/pending" element={
          <ProtectedRoute allowedRole="driver">
            <DriverPendingApproval />
          </ProtectedRoute>
        } />
        <Route path="/driver/dashboard" element={
          <ProtectedRoute allowedRole="driver">
            <DriverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/driver/trips" element={
          <ProtectedRoute allowedRole="driver">
            <DriverTrips />
          </ProtectedRoute>
        } />
        <Route path="/driver/trip/:id" element={
          <ProtectedRoute allowedRole="driver">
            <DriverTripDetail />
          </ProtectedRoute>
        } />
        <Route path="/driver/inspection/:id" element={
          <ProtectedRoute allowedRole="driver">
            <InspectionChecklist role="driver" />
          </ProtectedRoute>
        } />
        <Route path="/driver/expense/:id" element={
          <ProtectedRoute allowedRole="driver">
            <ExpenseLog role="driver" />
          </ProtectedRoute>
        } />
        <Route path="/driver/porters" element={
          <ProtectedRoute allowedRole="driver">
            <PorterManagement />
          </ProtectedRoute>
        } />
        <Route path="/driver/messages" element={
          <ProtectedRoute allowedRole="driver">
            <Chat role="driver" />
          </ProtectedRoute>
        } />
        <Route path="/driver/profile" element={
          <ProtectedRoute allowedRole="driver">
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/driver/map" element={
          <ProtectedRoute allowedRole="driver">
            <LiveMap />
          </ProtectedRoute>
        } />

        {/* Safari Routes */}
        <Route path="/safari/login" element={<SafariLogin />} />
        <Route path="/safari/register" element={<SafariRegister />} />
        <Route path="/safari/face-scan" element={<SafariFaceScan />} />
        <Route path="/safari/pending" element={
          <ProtectedRoute allowedRole="safari_driver">
            <SafariPendingApproval />
          </ProtectedRoute>
        } />
        <Route path="/safari/dashboard" element={
          <ProtectedRoute allowedRole="safari_driver">
            <SafariDashboard />
          </ProtectedRoute>
        } />
        <Route path="/safari/trips" element={
          <ProtectedRoute allowedRole="safari_driver">
            <SafariTrips />
          </ProtectedRoute>
        } />
        <Route path="/safari/trip/:id" element={
          <ProtectedRoute allowedRole="safari_driver">
            <SafariTripDetail />
          </ProtectedRoute>
        } />
        <Route path="/safari/inspection/:id" element={
          <ProtectedRoute allowedRole="safari_driver">
            <InspectionChecklist role="safari_driver" />
          </ProtectedRoute>
        } />
        <Route path="/safari/expense/:id" element={
          <ProtectedRoute allowedRole="safari_driver">
            <ExpenseLog role="safari_driver" />
          </ProtectedRoute>
        } />
        <Route path="/safari/fees/:id" element={
          <ProtectedRoute allowedRole="safari_driver">
            <ParkFees />
          </ProtectedRoute>
        } />
        <Route path="/safari/sos" element={
          <ProtectedRoute allowedRole="safari_driver">
            <SOSSystem />
          </ProtectedRoute>
        } />
        <Route path="/safari/messages" element={
          <ProtectedRoute allowedRole="safari_driver">
            <Chat role="safari_driver" />
          </ProtectedRoute>
        } />
        <Route path="/safari/profile" element={
          <ProtectedRoute allowedRole="safari_driver">
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/safari/map" element={
          <ProtectedRoute allowedRole="safari_driver">
            <LiveMap />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {currentUser && isApproved && <BottomNav />}
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1A2E20',
          color: '#F0EDE8',
          border: '1px solid rgba(201, 168, 76, 0.2)'
        }
      }} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <DriverProvider>
        <LocationProvider>
          <div style={{color: 'white', padding: '50px'}}>
            <h1>SYSTEM LIVE - PROVIDERS LOADED</h1>
            <p>If you see this, providers are fine. Testing Router next...</p>
          </div>
          {/* <Router>
            <AppContent />
          </Router> */}
        </LocationProvider>
      </DriverProvider>
    </AuthProvider>
  );
}

export default App;
