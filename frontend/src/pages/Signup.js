import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, Check } from 'lucide-react';

const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
};

const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const navigate = useNavigate();

    const pwdStrength = passwordStrength(form.password);
    const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    const validate = () => {
        const newErrors = {};
        if (!form.name || form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email address';
        if (!form.password || form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (form.password !== form.confirm) newErrors.confirm = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await authAPI.signup({ name: form.name, email: form.email, password: form.password });
            login(res.data.token, res.data.user);
            toast.success(`Account created! Welcome, ${res.data.user.name}! 🎉`);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Signup failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background */}
            <div style={{
                position: 'absolute', top: -200, right: -200, width: 600, height: 600,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{ width: '100%', maxWidth: 480 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: 'var(--shadow-button)'
                    }}>
                        <Sparkles size={26} color="white" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Create your account</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>
                        Start tracking expenses with AI assistance
                    </p>
                </div>

                <div className="card" style={{ padding: 36 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                            />
                            {errors.name && <div className="form-error">{errors.name}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
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
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    style={{ paddingRight: 44 }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Password strength */}
                            {form.password && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} style={{
                                                flex: 1, height: 3, borderRadius: 100,
                                                background: i <= pwdStrength ? strengthColors[pwdStrength] : 'var(--bg-input)',
                                                transition: 'background 0.3s ease'
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 11, color: strengthColors[pwdStrength] }}>
                                        {strengthLabels[pwdStrength]}
                                    </div>
                                </div>
                            )}
                            {errors.password && <div className="form-error">{errors.password}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirm"
                                className="form-input"
                                placeholder="Repeat password"
                                value={form.confirm}
                                onChange={handleChange}
                            />
                            {errors.confirm && <div className="form-error">{errors.confirm}</div>}
                        </div>

                        {/* Features list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
                            {['Free to use, no credit card required', 'AI-powered natural language tracking', '8 default categories pre-configured'].map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Check size={10} color="#10b981" />
                                    </div>
                                    {f}
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Creating account...</> : '🎉 Create Account'}
                        </button>
                    </form>

                    <div className="divider" />

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--accent-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
