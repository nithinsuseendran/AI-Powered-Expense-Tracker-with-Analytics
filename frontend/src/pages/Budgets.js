import React, { useState, useEffect } from 'react';
import { budgetAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle } from 'lucide-react';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        type: 'monthly', category: '', amount: '', alertThreshold: 80,
        month: new Date().getMonth() + 1, year: new Date().getFullYear()
    });

    const loadData = async () => {
        try {
            const [budgetsRes, catsRes] = await Promise.all([
                budgetAPI.getAll(),
                categoryAPI.getAll()
            ]);
            setBudgets(budgetsRes.data.budgets);
            setCategories(catsRes.data.categories);
        } catch (err) {
            toast.error('Failed to load budgets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (form.type === 'category' && !form.category) {
            toast.error('Please select a category');
            return;
        }
        setSubmitting(true);
        try {
            await budgetAPI.create(form);
            toast.success('Budget saved! 🎯');
            setShowForm(false);
            setForm({ type: 'monthly', category: '', amount: '', alertThreshold: 80, month: new Date().getMonth() + 1, year: new Date().getFullYear() });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save budget');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this budget?')) return;
        try {
            await budgetAPI.delete(id);
            toast.success('Budget deleted');
            loadData();
        } catch {
            toast.error('Failed to delete budget');
        }
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Budgets</h1>
                    <p className="page-subtitle">Set and track your spending limits</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} /> {showForm ? 'Cancel' : 'Add Budget'}
                </button>
            </div>

            <div className="page-content">
                {/* Add Budget Form */}
                {showForm && (
                    <div className="card" style={{ marginBottom: 24, animation: 'slideUp 0.3s ease' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create New Budget</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Budget Type</label>
                                    <select
                                        className="form-select"
                                        value={form.type}
                                        onChange={e => setForm(prev => ({ ...prev, type: e.target.value, category: '' }))}
                                    >
                                        <option value="monthly">Monthly Total</option>
                                        <option value="category">By Category</option>
                                    </select>
                                </div>

                                {form.type === 'category' && (
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-select"
                                            value={form.category}
                                            onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat.name}>{cat.icon} {cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Budget Amount ($)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter amount"
                                        value={form.amount}
                                        onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                                        min="1" step="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Month</label>
                                    <select
                                        className="form-select"
                                        value={form.month}
                                        onChange={e => setForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                    >
                                        {monthNames.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Alert at (%)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.alertThreshold}
                                        onChange={e => setForm(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) }))}
                                        min="1" max="100"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '🎯 Save Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Budget Cards */}
                {loading ? (
                    <div className="stats-grid">
                        {[1, 2, 3].map(i => <div key={i} style={{ height: 180 }} className="skeleton" />)}
                    </div>
                ) : budgets.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {budgets.map((budget) => {
                            const pct = budget.percentage;
                            const barColor = budget.isExceeded ? 'var(--accent-red)'
                                : budget.isAlert ? 'var(--accent-orange)'
                                    : 'var(--accent-primary)';

                            return (
                                <div key={budget._id} className="card" style={{
                                    borderColor: budget.isExceeded ? 'rgba(239,68,68,0.2)' : budget.isAlert ? 'rgba(245,158,11,0.2)' : 'var(--border-primary)'
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: budget.isExceeded ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                                            }}>
                                                {budget.type === 'monthly' ? '📅' : '🏷️'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 15 }}>
                                                    {budget.type === 'monthly' ? 'Monthly Budget' : budget.category}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {monthNames[(budget.month || new Date().getMonth() + 1) - 1]} {budget.year || new Date().getFullYear()}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {budget.isExceeded ? (
                                                <AlertTriangle size={16} color="var(--accent-red)" />
                                            ) : budget.isAlert ? (
                                                <AlertTriangle size={16} color="var(--accent-orange)" />
                                            ) : (
                                                <CheckCircle size={16} color="var(--accent-green)" />
                                            )}
                                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(budget._id)}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Spent</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
                                        </div>
                                        <div className="progress-bar" style={{ height: 10 }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min(pct, 100)}%`,
                                                borderRadius: 100,
                                                background: budget.isExceeded
                                                    ? 'linear-gradient(90deg, #ef4444, #ff6b6b)'
                                                    : budget.isAlert
                                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                        : 'var(--gradient-primary)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Amount info */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                                        {[
                                            { label: 'Budget', value: `$${budget.amount.toFixed(0)}`, color: 'var(--text-primary)' },
                                            { label: 'Spent', value: `$${budget.spent.toFixed(0)}`, color: barColor },
                                            { label: 'Remaining', value: `$${budget.remaining.toFixed(0)}`, color: budget.isExceeded ? 'var(--accent-red)' : 'var(--accent-green)' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '8px 0', background: 'var(--bg-input)', borderRadius: 8 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {budget.isExceeded && (
                                        <div style={{
                                            marginTop: 12, padding: '8px 12px',
                                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                            borderRadius: 8, fontSize: 12, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <AlertTriangle size={12} /> Budget exceeded by ${(budget.spent - budget.amount).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: '80px 20px' }}>
                        <div className="empty-state-icon"><Target size={48} style={{ opacity: 0.4 }} /></div>
                        <div className="empty-state-title">No budgets set yet</div>
                        <div className="empty-state-desc">Create a budget to start tracking your spending limits and get alerts when you're close to your limit.</div>
                        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowForm(true)}>
                            <Plus size={16} /> Create Your First Budget
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Budgets;
