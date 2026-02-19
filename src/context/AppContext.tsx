import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { DefectEvent } from '../data/defectStream';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export type Environment = 'Automotive' | 'Electronics' | 'Textile' | 'Pharma';

export interface Alert {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    source: string;
    timestamp: Date;
    acknowledged: boolean;
    dismissed?: boolean;
}

interface AppContextType {
    environment: Environment;
    setEnvironment: (env: Environment) => void;
    productType: string;
    setProductType: (pt: string) => void;
    inspectionsPaused: boolean;
    toggleInspections: () => void;
    alerts: Alert[];
    addAlert: (alert: Omit<Alert, 'id' | 'acknowledged'>) => void;
    acknowledgeAlert: (id: string) => void;
    dismissAlert: (id: string) => void;
    recentDefects: DefectEvent[];
    addDefect: (d: DefectEvent) => void;
    totalInspections: number;
    incrementInspections: (n: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const PRODUCTS_BY_ENV: Record<Environment, string[]> = {
    Automotive: ['Engine Block', 'Cylinder Head', 'Brake Disc', 'Transmission Housing', 'Control Arm'],
    Electronics: ['PCB Assembly', 'Display Panel', 'Battery Cell', 'Connector Module', 'Heat Sink'],
    Textile: ['Fabric Roll', 'Woven Panel', 'Yarn Bundle', 'Dye Lot', 'Stitched Seam'],
    Pharma: ['Tablet Blister', 'Capsule Strip', 'Vial Pack', 'Ampoule Set', 'Syringe Unit'],
};

export { PRODUCTS_BY_ENV };

type RawAlert = { id: string; severity: string; message: string; source: string; timestamp: string; acknowledged: boolean };

function toAlert(raw: RawAlert): Alert {
    return {
        ...raw,
        severity: raw.severity as Alert['severity'],
        timestamp: new Date(raw.timestamp),
    };
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [environment, setEnvironmentState] = useState<Environment>('Automotive');
    const [productType, setProductType] = useState<string>('Engine Block');
    const [inspectionsPaused, setInspectionsPaused] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [recentDefects, setRecentDefects] = useState<DefectEvent[]>([]);
    const [totalInspections, setTotalInspections] = useState(9332);

    // Load initial alerts from backend
    useEffect(() => {
        api.getAlerts().then((data) => {
            setAlerts((data as RawAlert[]).map(toAlert));
        }).catch(() => {
            // Fallback seed alerts if backend is unavailable
            setAlerts([
                { id: 'a1', severity: 'warning', message: 'Line B defect rate exceeded 4%', source: 'Line B', timestamp: new Date(Date.now() - 120000), acknowledged: false },
                { id: 'a2', severity: 'critical', message: 'Temperature sensor spike on Camera 3', source: 'Sensor', timestamp: new Date(Date.now() - 60000), acknowledged: false },
                { id: 'a3', severity: 'info', message: 'Line C scheduled maintenance in 2 hours', source: 'System', timestamp: new Date(Date.now() - 300000), acknowledged: false },
            ]);
        });
    }, []);

    // Subscribe to real-time alert events from backend
    useEffect(() => {
        const socket = getSocket();
        const handler = (raw: RawAlert) => {
            setAlerts(prev => [toAlert(raw), ...prev.slice(0, 49)]);
        };
        socket.on('alert:new', handler);
        return () => { socket.off('alert:new', handler); };
    }, []);

    const setEnvironment = useCallback((env: Environment) => {
        setEnvironmentState(env);
        setProductType(PRODUCTS_BY_ENV[env][0]);
    }, []);

    const toggleInspections = useCallback(() => setInspectionsPaused(p => !p), []);

    const addAlert = useCallback((alert: Omit<Alert, 'id' | 'acknowledged'>) => {
        const newAlert: Alert = {
            ...alert,
            id: Math.random().toString(36).substring(2, 9),
            acknowledged: false,
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
    }, []);

    const acknowledgeAlert = useCallback(async (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
        await api.acknowledgeAlert(id).catch(() => {/* ignore if backend unavail */ });
    }, []);

    const dismissAlert = useCallback(async (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
        await api.dismissAlert(id).catch(() => {/* ignore if backend unavail */ });
    }, []);

    const addDefect = useCallback((d: DefectEvent) => {
        setRecentDefects(prev => [d, ...prev.slice(0, 49)]);
        if (d.severity === 'critical') {
            addAlert({ severity: 'critical', message: `Critical ${d.type} detected on ${d.line}`, source: d.line, timestamp: new Date() });
        }
    }, [addAlert]);

    const incrementInspections = useCallback((n: number) => {
        setTotalInspections(prev => prev + n);
    }, []);

    return (
        <AppContext.Provider value={{
            environment, setEnvironment,
            productType, setProductType,
            inspectionsPaused, toggleInspections,
            alerts, addAlert, acknowledgeAlert, dismissAlert,
            recentDefects, addDefect,
            totalInspections, incrementInspections,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

export { PRODUCTS_BY_ENV as PRODUCT_OPTIONS };
