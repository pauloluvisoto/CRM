import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import TeamSettings from './pages/TeamSettings';
import Pipeline from './pages/Pipeline';
import Finance from './pages/Finance';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import PendingApproval from './pages/PendingApproval';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Notifications from './pages/Notifications';
import ErrorBoundary from './components/ErrorBoundary';

import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isPending, loading } = useAuth();

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Carregando...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isPending) {
    return <Navigate to="/pending" replace />;
  }

  return children;
};

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pending" element={<PendingApproval />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/pipeline" replace />} />
          <Route path="pipeline/:id?" element={
            <ErrorBoundary>
              <Pipeline />
            </ErrorBoundary>
          } />
          <Route path="clients" element={<Navigate to="clients/onboarding" replace />} />
          <Route path="clients/onboarding" element={<Clients mode="onboarding" />} />
          <Route path="clients/maintenance" element={<Clients mode="maintenance" />} />
          <Route path="clients/:id" element={
            <ErrorBoundary>
              <ClientDetails />
            </ErrorBoundary>
          } />
          <Route path="contacts" element={<Contacts />} />
          <Route path="messages" element={<Messages />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="team" element={<TeamSettings />} />
          <Route path="finance/*" element={<Finance />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
