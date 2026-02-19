import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Camera, BarChart2, Activity,
    Settings, FileText, Cpu, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/live-monitor', icon: Camera, label: 'Live Monitor' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/sensors', icon: Activity, label: 'Sensors & Alerts' },
    { to: '/configuration', icon: Settings, label: 'Configuration' },
    { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar() {
    const { environment, productType } = useApp();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon logo-glow">
                    <Cpu size={22} className="logo-cpu" />
                </div>
                <div className="sidebar-logo-text">
                    <span className="sidebar-logo-title">QC AI</span>
                    <span className="sidebar-logo-sub">Quality Intelligence</span>
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Navigation */}
            <nav className="sidebar-nav">
                <p className="sidebar-group-label">MONITORING</p>
                {NAV_ITEMS.slice(0, 4).map(({ to, icon: Icon, label }, i) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `nav-item animate-slide-in${isActive ? ' active' : ''}`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <Icon size={16} className="nav-icon" />
                        <span>{label}</span>
                        <ChevronRight size={12} className="nav-chevron" />
                    </NavLink>
                ))}

                <p className="sidebar-group-label" style={{ marginTop: 16 }}>MANAGEMENT</p>
                {NAV_ITEMS.slice(4).map(({ to, icon: Icon, label }, i) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item animate-slide-in${isActive ? ' active' : ''}`}
                        style={{ animationDelay: `${(i + 4) * 0.05}s` }}
                    >
                        <Icon size={16} className="nav-icon" />
                        <span>{label}</span>
                        <ChevronRight size={12} className="nav-chevron" />
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-spacer" />

            {/* Bottom info */}
            <div className="sidebar-bottom">
                <div className="sidebar-env-badge">
                    <span className="sidebar-env-dot" />
                    <div>
                        <p className="sidebar-env-name">{environment}</p>
                        <p className="sidebar-env-product">{productType}</p>
                    </div>
                </div>
                <div className="sidebar-status">
                    <span className="status-dot live" />
                    <span className="sidebar-status-text">System Live</span>
                </div>
                <div className="sidebar-user">
                    <div className="sidebar-avatar">QA</div>
                    <div>
                        <p className="sidebar-user-name">QA Engineer</p>
                        <p className="sidebar-user-role">Administrator</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
