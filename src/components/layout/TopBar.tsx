import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Play, Pause, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './TopBar.css';

const ROUTE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/live-monitor': 'Live CV Monitor',
    '/analytics': 'Defect Analytics',
    '/sensors': 'Sensors & Alerts',
    '/configuration': 'Configuration',
    '/reports': 'Reports',
};

function useClock() {
    const [time, setTime] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TopBar() {
    const { pathname } = useLocation();
    const { alerts, inspectionsPaused, toggleInspections } = useApp();
    const [searchVal, setSearchVal] = useState('');
    const time = useClock();
    const unreadCount = alerts.filter(a => !a.acknowledged).length;
    const title = ROUTE_TITLES[pathname] ?? 'QC AI';

    return (
        <header className="topbar">
            {/* Left: Title */}
            <div className="topbar-left">
                <h1 className="topbar-title">{title}</h1>
                <div className="topbar-breadcrumb">
                    <span>QC AI</span>
                    <span className="topbar-breadcrumb-sep">/</span>
                    <span className="topbar-breadcrumb-active">{title}</span>
                </div>
            </div>

            {/* Center: Search */}
            <div className="topbar-search">
                <Search size={14} className="topbar-search-icon" />
                <input
                    className="topbar-search-input"
                    placeholder="Search defects, lines, products..."
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                />
            </div>

            {/* Right: Actions */}
            <div className="topbar-right">
                {/* Clock */}
                <div className="topbar-clock">
                    <Clock size={13} />
                    <span className="topbar-clock-time">{time}</span>
                </div>

                {/* Pause/Resume */}
                <button
                    className={`btn btn-sm topbar-inspect-toggle ${inspectionsPaused ? 'paused' : ''}`}
                    onClick={toggleInspections}
                    title={inspectionsPaused ? 'Resume Inspections' : 'Pause Inspections'}
                >
                    {inspectionsPaused
                        ? <><Play size={13} /> Resume</>
                        : <><Pause size={13} /> Pause</>
                    }
                </button>

                {/* Notification bell */}
                <div className="topbar-notif">
                    <button className="btn btn-icon btn-ghost topbar-bell">
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
