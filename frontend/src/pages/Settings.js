import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, DollarSign, Shield, LogOut, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: user?.name || '',
        currency: user?.currency || 'USD',
        monthlyBudget: user?.monthlyBudget || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            const res = await authAPI.updateProfile(form);
            updateUser(res.data.user);
            toast.success('Profile updated! ✅');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const CURRENCIES = [
        { value: 'USD', label: '🇺🇸 USD - US Dollar' },
        { value: 'EUR', label: '🇪🇺 EUR - Euro' },
        { value: 'GBP', label: '🇬🇧 GBP - British Pound' },
        { value: 'INR', label: '🇮🇳 INR - Indian Rupee' },
        { value: 'CAD', label: '🇨🇦 CAD - Canadian Dollar' },
        { value: 'AUD', label: '🇦🇺 AUD - Australian Dollar' },
        { value: 'JPY', label: '🇯🇵 JPY - Japanese Yen' },
        { value: 'CNY', label: '🇨🇳 CNY - Chinese Yuan' },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and preferences</p>
                </div>
            </div>

            <div className="page-content" style={{ maxWidth: 720 }}>
                {/* Profile Section */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User size={20} color="var(--accent-primary-light)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Profile & Preferences</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Update your personal information</p>
                        </div>
                    </div>

                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28, fontWeight: 700, boxShadow: 'var(--shadow-button)'
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{user?.email}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={user?.email}
                                    disabled
                                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                />
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Currency</label>
                                    <select
                                        className="form-select"
                                        value={form.currency}
                                        onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                                    >
                                        {CURRENCIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Default Monthly Budget ($)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.monthlyBudget}
                                        onChange={e => setForm(p => ({ ...p, monthlyBudget: e.target.value }))}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                                {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* API Key Info */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Shield size={20} color="var(--accent-secondary)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>AI Configuration</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>OpenAI API setup instructions</p>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)',
                        borderRadius: 12, padding: 20
                    }}>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            The AI chatbot requires an OpenAI API key to function. To configure it:
                        </p>
                        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                'Get your API key from platform.openai.com',
                                'Open backend/.env file',
                                'Set OPENAI_API_KEY=your_key_here',
                                'Restart the backend server'
                            ].map((step, i) => (
                                <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{step}</li>
                            ))}
                        </ol>
                        <div style={{
                            marginTop: 16, padding: '10px 14px',
                            background: 'var(--bg-input)', borderRadius: 8,
                            fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-secondary)'
                        }}>
                            OPENAI_API_KEY=sk-...
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                            💡 Without an API key, you can still manually manage expenses. The AI chat will show an error message.
                        </p>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>⚠️ Danger Zone</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Signing out will remove your session from this device.
                    </p>
                    <button className="btn btn-danger" onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
