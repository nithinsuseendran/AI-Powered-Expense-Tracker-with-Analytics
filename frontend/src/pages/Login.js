import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

const features = [
    { icon: '🤖', title: 'AI-Powered', desc: 'Natural language expense tracking' },
    { icon: '📊', title: 'Smart Analytics', desc: 'Deep insights & spending trends' },
    { icon: '🎯', title: 'Budget Goals', desc: 'Stay on top of your finances' },
];

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email address';
        if (!form.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await authAPI.login(form);
            login(res.data.token, res.data.user);
            toast.success(`Welcome back, ${res.data.user.name}! 👋`);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            toast.error(msg);
            if (msg.includes('password') || msg.includes('Invalid')) {
                setErrors({ password: msg });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-primary)'
        }}>
            {/* Left - Feature Showcase */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)',
                borderRight: '1px solid var(--border-primary)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background decoration */}
                <div style={{
                    position: 'absolute', top: -100, right: -100, width: 400, height: 400,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)'
                }} />
                <div style={{
                    position: 'absolute', bottom: -100, left: -100, width: 300, height: 300,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-button)'
                        }}>
                            <Sparkles size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SpendAI</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI Expense Tracker</div>
                        </div>
                    </div>

                    <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
                        Take control of<br />
                        <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            your finances
                        </span>
                    </h1>
                    <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, lineHeight: 1.7 }}>
                        Track expenses, set budgets, and get AI-powered insights — all through natural conversation.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {features.map((f, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                padding: '16px 20px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: 14,
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ fontSize: 28 }}>{f.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
                        {[['10K+', 'Users'], ['$2M+', 'Tracked'], ['99.9%', 'Uptime']].map(([val, label]) => (
                            <div key={label}>
                                <div style={{ fontSize: 22, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right - Login Form */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
            }}>
                <div style={{ width: '100%', maxWidth: 420 }}>
                    <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
                        Welcome back! 👋
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 15 }}>
                        Sign in to continue tracking your expenses
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                            {errors.email && <div className="form-error">{errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <div className="form-error">{errors.password}</div>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : '🚀 Sign In'}
                        </button>
                    </form>

                    <div className="divider" />

                    {/* Demo Hint */}
                    <div style={{
                        background: 'rgba(6,182,212,0.05)',
                        border: '1px solid rgba(6,182,212,0.15)',
                        borderRadius: 12,
                        padding: '14px 18px',
                        marginBottom: 24,
                        fontSize: 13,
                        color: 'var(--text-secondary)'
                    }}>
                        💡 <strong style={{ color: 'var(--accent-secondary)' }}>New here?</strong> Create an account to get started with AI-powered expense tracking.
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--accent-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
