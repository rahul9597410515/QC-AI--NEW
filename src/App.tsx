import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LiveMonitor from './pages/LiveMonitor';
import DefectAnalytics from './pages/DefectAnalytics';
import SensorAlerts from './pages/SensorAlerts';
import Configuration from './pages/Configuration';
import Reports from './pages/Reports';
import './styles/animations.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live-monitor" element={<LiveMonitor />} />
            <Route path="/analytics" element={<DefectAnalytics />} />
            <Route path="/sensors" element={<SensorAlerts />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
