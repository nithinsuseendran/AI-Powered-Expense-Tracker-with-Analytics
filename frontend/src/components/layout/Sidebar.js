import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, ArrowLeftRight, Tag, Target,
    BarChart3, Settings, LogOut, Sparkles
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/budgets', icon: Target, label: 'Budgets' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={18} color="white" />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">SpendAI</div>
                        <div className="sidebar-subtitle">AI Expense Tracker</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Menu</div>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={18} className="nav-item-icon" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                    <div className="user-name truncate">{user?.name || 'User'}</div>
                    <div className="user-email truncate">{user?.email}</div>
                </div>
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={handleLogout}
                    title="Logout"
                    style={{ flexShrink: 0 }}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
