import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, expenseAPI, budgetAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
    LinearScale, PointElement, LineElement, BarElement, Filler
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Target, Calendar, Plus } from 'lucide-react';
import ExpenseModal from '../components/expenses/ExpenseModal';
import { format } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const CATEGORY_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#a0a0b8', font: { family: 'Inter', size: 12 }, padding: 16 }
        },
        tooltip: {
            backgroundColor: '#16161f',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            titleColor: '#f0f0ff',
            bodyColor: '#a0a0b8',
            padding: 12,
            cornerRadius: 10,
        }
    },
    scales: {
        x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } }
        },
        y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
                color: '#6b7280',
                font: { family: 'Inter', size: 11 },
                callback: (v) => `$${v.toLocaleString()}`
            }
        }
    }
};

const StatCard = ({ icon, label, value, change, changeLabel, color }) => (
    <div className="stat-card card-glow">
        <div className="stat-card-icon" style={{ background: `${color}20` }}>
            {icon}
        </div>
        <div style={{ marginTop: 8 }}>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
            {change !== undefined && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
                    fontSize: 12, color: parseFloat(change) >= 0 ? '#ef4444' : '#10b981'
                }}>
                    {parseFloat(change) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{Math.abs(change)}% {changeLabel}</span>
                </div>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [summaryRes, trendsRes, catRes, expensesRes, budgetsRes] = await Promise.all([
                analyticsAPI.getSummary(),
                analyticsAPI.getTrends(6),
                analyticsAPI.getByCategory(),
                expenseAPI.getAll({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
                budgetAPI.getAll()
            ]);
            setSummary(summaryRes.data.summary);
            setTrends(trendsRes.data.trends);
            setCategoryData(catRes.data.byCategory);
            setRecentExpenses(expensesRes.data.expenses);
            setBudgets(budgetsRes.data.budgets);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        // Listen for chat-triggered expense changes
        window.addEventListener('expense-changed', loadData);
        return () => window.removeEventListener('expense-changed', loadData);
    }, [loadData]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const lineChartData = {
        labels: trends.map(t => `${monthNames[t._id.month - 1]} ${t._id.year}`),
        datasets: [{
            label: 'Monthly Spending',
            data: trends.map(t => t.total),
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#7c3aed',
            pointRadius: 5,
            pointHoverRadius: 7,
        }]
    };

    const doughnutData = {
        labels: categoryData.map(c => c._id),
        datasets: [{
            data: categoryData.map(c => c.total),
            backgroundColor: CATEGORY_COLORS,
            borderColor: 'transparent',
            borderWidth: 0,
            spacing: 2,
        }]
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <div style={{ width: 200, height: 32 }} className="skeleton" />
                        <div style={{ width: 150, height: 16, marginTop: 8 }} className="skeleton" />
                    </div>
                </div>
                <div className="page-content">
                    <div className="stats-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ height: 120 }} className="skeleton" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const topBudget = budgets.find(b => b.type === 'monthly');

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                        <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {user?.name?.split(' ')[0]}
                        </span>! 👋
                    </h1>
                    <p className="page-subtitle">Here's your financial overview for today</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                    <Plus size={16} /> Add Expense
                </button>
            </div>

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        icon={<DollarSign size={22} color="#7c3aed" />}
                        label="This Month"
                        value={`$${(summary?.thisMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        change={summary?.monthChange}
                        changeLabel="vs last month"
                        color="#7c3aed"
                    />
                    <StatCard
                        icon={<ShoppingBag size={22} color="#06b6d4" />}
                        label="Total Transactions"
                        value={summary?.thisMonthCount || 0}
                        color="#06b6d4"
                    />
                    <StatCard
                        icon={<Calendar size={22} color="#10b981" />}
                        label="Avg. Per Day"
                        value={`$${((summary?.thisMonth || 0) / new Date().getDate()).toFixed(2)}`}
                        color="#10b981"
                    />
                    <StatCard
                        icon={<Target size={22} color="#f59e0b" />}
                        label="Budget Remaining"
                        value={topBudget
                            ? `$${Math.max(0, topBudget.amount - topBudget.spent).toFixed(2)}`
                            : 'No budget set'
                        }
                        color="#f59e0b"
                    />
                </div>

                {/* Charts Row */}
                <div className="charts-grid" style={{ marginBottom: 24 }}>
                    {/* Line Chart */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Spending Trends</h2>
                            <span className="badge badge-purple">Last 6 months</span>
                        </div>
                        <div style={{ height: 240 }}>
                            {trends.length > 0
                                ? <Line data={lineChartData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
                                : <div className="empty-state"><div className="empty-state-icon">📈</div><div className="empty-state-title">No trend data yet</div></div>
                            }
                        </div>
                    </div>

                    {/* Doughnut Chart */}
                    <div className="card">
                        <div style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Category Breakdown</h2>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>This month</p>
                        </div>
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {categoryData.length > 0
                                ? <Doughnut data={doughnutData} options={{
                                    ...chartDefaults,
                                    cutout: '65%',
                                    plugins: {
                                        ...chartDefaults.plugins,
                                        legend: { position: 'right', labels: { color: '#a0a0b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 } }
                                    },
                                    scales: undefined
                                }} />
                                : <div className="empty-state"><div className="empty-state-icon">🍩</div><div className="empty-state-title">No data yet</div></div>
                            }
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="charts-grid-3">
                    {/* Recent Expenses */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Transactions</h2>
                            <a href="/transactions" style={{ fontSize: 13, color: 'var(--accent-primary-light)', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
                        </div>
                        {recentExpenses.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {recentExpenses.map((expense) => (
                                    <div key={expense._id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: 'var(--bg-input)',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-primary)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="category-icon" style={{ background: 'rgba(124,58,237,0.1)' }}>
                                                {getCategoryEmoji(expense.category)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{expense.description || expense.category}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    {expense.category} • {format(new Date(expense.date), 'MMM d')}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-red)' }}>
                                            -${expense.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">💸</div>
                                <div className="empty-state-title">No expenses yet</div>
                                <div className="empty-state-desc">Add your first expense above or use the AI chat!</div>
                            </div>
                        )}
                    </div>

                    {/* Budget Progress */}
                    <div className="card">
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Budget Status</h2>
                        {budgets.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {budgets.slice(0, 4).map((budget) => (
                                    <div key={budget._id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                {budget.type === 'category' ? budget.category : 'Monthly Total'}
                                            </div>
                                            <div style={{ fontSize: 12, color: budget.isExceeded ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                                ${budget.spent.toFixed(0)} / ${budget.amount.toFixed(0)}
                                            </div>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${budget.isExceeded ? 'danger' : budget.isAlert ? 'warning' : ''}`}
                                                style={{ width: `${budget.percentage}%` }}
                                            />
                                        </div>
                                        {budget.isAlert && (
                                            <div style={{ fontSize: 11, color: budget.isExceeded ? 'var(--accent-red)' : 'var(--accent-orange)', marginTop: 4 }}>
                                                {budget.isExceeded ? '⚠️ Budget exceeded!' : `⚡ ${budget.percentage}% used`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">🎯</div>
                                <div className="empty-state-title">No budgets set</div>
                                <a href="/budgets" style={{ fontSize: 13, color: 'var(--accent-primary-light)', textDecoration: 'none' }}>Set a budget →</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showExpenseModal && (
                <ExpenseModal
                    onClose={() => setShowExpenseModal(false)}
                    onSaved={() => { setShowExpenseModal(false); loadData(); }}
                />
            )}
        </div>
    );
};

const getCategoryEmoji = (category) => {
    const map = {
        'Food': '🍔', 'Transport': '🚗', 'Entertainment': '🎬',
        'Bills': '📄', 'Shopping': '🛍️', 'Healthcare': '🏥',
        'Education': '📚', 'Other': '📦'
    };
    return map[category] || '💳';
};

export default Dashboard;
