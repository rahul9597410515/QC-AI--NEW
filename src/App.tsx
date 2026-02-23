import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMonitor from './pages/LiveMonitor';
import DefectAnalytics from './pages/DefectAnalytics';
import SensorAlerts from './pages/SensorAlerts';
import Configuration from './pages/Configuration';
import Reports from './pages/Reports';
import './styles/animations.css';

// Guard — redirects to /login if not authenticated
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected — wrapped in Layout */}
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live-monitor" element={<LiveMonitor />} />
              <Route path="/analytics" element={<DefectAnalytics />} />
              <Route path="/sensors" element={<SensorAlerts />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
