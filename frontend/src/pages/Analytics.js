import React, { useState, useEffect, useCallback } from 'react';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
    LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { analyticsAPI } from '../services/api';
import { BarChart2, PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16', '#a78bfa', '#67e8f9'];

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#a0a0b8', font: { family: 'Inter', size: 12 }, padding: 16 } },
        tooltip: {
            backgroundColor: '#16161f', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
            titleColor: '#f0f0ff', bodyColor: '#a0a0b8', padding: 12, cornerRadius: 10,
            callbacks: { label: (ctx) => ` $${ctx.parsed.y !== undefined ? ctx.parsed.y.toFixed(2) : ctx.parsed.toFixed(2)}` }
        }
    },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 }, callback: v => `$${v}` } }
    }
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Analytics = () => {
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [byCategory, setByCategory] = useState([]);
    const [daily, setDaily] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [trendMonths, setTrendMonths] = useState(6);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const [sumRes, trendRes, catRes, dailyRes] = await Promise.all([
                analyticsAPI.getSummary(),
                analyticsAPI.getTrends(trendMonths),
                analyticsAPI.getByCategory({ period }),
                analyticsAPI.getDaily(30)
            ]);
            setSummary(sumRes.data.summary);
            setTrends(trendRes.data.trends);
            setByCategory(catRes.data.byCategory);
            setDaily(dailyRes.data.daily);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [period, trendMonths]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const barData = {
        labels: trends.map(t => `${monthNames[t._id.month - 1]} ${t._id.year}`),
        datasets: [{
            label: 'Spending',
            data: trends.map(t => t.total),
            backgroundColor: trends.map((_, i) => i === trends.length - 1 ? '#7c3aed' : 'rgba(124,58,237,0.3)'),
            borderColor: '#7c3aed',
            borderWidth: 1,
            borderRadius: 6,
        }]
    };

    const doughnutData = {
        labels: byCategory.map(c => c._id),
        datasets: [{
            data: byCategory.map(c => c.total),
            backgroundColor: COLORS,
            borderColor: 'transparent',
            spacing: 2
        }]
    };

    const lineData = {
        labels: daily.map(d => d._id.slice(5)),
        datasets: [{
            label: 'Daily Spending',
            data: daily.map(d => d.total),
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6,182,212,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
        }]
    };

    const totalSpent = byCategory.reduce((s, c) => s + c.total, 0);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Deep insights into your spending patterns</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['month', 'year'].map(p => (
                        <button
                            key={p}
                            className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p === 'month' ? 'This Month' : 'This Year'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="page-content">
                {/* Summary Cards */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'This Month', value: `$${(summary?.thisMonth || 0).toFixed(2)}`, sub: `${summary?.thisMonthCount || 0} transactions` },
                        { label: 'Last Month', value: `$${(summary?.lastMonth || 0).toFixed(2)}`, sub: 'Previous period' },
                        { label: 'Monthly Change', value: `${summary?.monthChange >= 0 ? '+' : ''}${summary?.monthChange || 0}%`, isChange: true },
                        { label: 'Top Category', value: byCategory[0]?._id || '—', sub: byCategory[0] ? `$${byCategory[0].total.toFixed(2)}` : '' },
                    ].map((s, i) => (
                        <div key={i} className="card">
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                {s.label}
                            </div>
                            <div style={{
                                fontSize: 24, fontWeight: 800,
                                color: s.isChange
                                    ? (parseFloat(s.value) > 0 ? 'var(--accent-red)' : 'var(--accent-green)')
                                    : 'var(--text-primary)',
                                marginBottom: 4
                            }}>
                                {s.isChange && <span style={{ marginRight: 4 }}>{parseFloat(s.value) > 0 ? '📈' : '📉'}</span>}
                                {s.value}
                            </div>
                            {s.sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>}
                        </div>
                    ))}
                </div>

                {/* Monthly Trend Bar Chart */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart2 size={18} style={{ color: 'var(--accent-primary)' }} />
                            Monthly Spending Trend
                        </h2>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[3, 6, 12].map(m => (
                                <button
                                    key={m}
                                    className={`btn btn-sm ${trendMonths === m ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setTrendMonths(m)}
                                >
                                    {m}M
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 260 }}>
                        {loading ? <div style={{ height: '100%' }} className="skeleton" /> :
                            trends.length > 0
                                ? <Bar data={barData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                                : <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No trend data</div></div>
                        }
                    </div>
                </div>

                {/* Two Charts Row */}
                <div className="charts-grid" style={{ marginBottom: 24 }}>
                    {/* Category Doughnut */}
                    <div className="card">
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PieChart size={18} style={{ color: 'var(--accent-secondary)' }} />
                            Category Breakdown
                        </h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                            {period === 'month' ? 'This month' : 'This year'} • Total: ${totalSpent.toFixed(2)}
                        </p>
                        <div style={{ height: 240 }}>
                            {!loading && byCategory.length > 0
                                ? <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '65%', plugins: { ...chartOptions.plugins, legend: { position: 'right', labels: { color: '#a0a0b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 10 } } }, scales: undefined }} />
                                : <div className="empty-state"><div className="empty-state-icon">🍩</div><div className="empty-state-title">No data</div></div>
                            }
                        </div>
                    </div>

                    {/* Daily Trend */}
                    <div className="card">
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Daily Spending (30 days)</h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Day-by-day breakdown</p>
                        <div style={{ height: 240 }}>
                            {!loading && daily.length > 0
                                ? <Line data={lineData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                                : <div className="empty-state"><div className="empty-state-icon">📈</div><div className="empty-state-title">No daily data</div></div>
                            }
                        </div>
                    </div>
                </div>

                {/* Category Table */}
                <div className="card">
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Category Details</h2>
                    {byCategory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {byCategory.map((cat, i) => (
                                <div key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: `${COLORS[i % COLORS.length]}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, flexShrink: 0
                                    }}>
                                        {['🍔', '🚗', '🎬', '📄', '🛍️', '🏥', '📚', '📦'][i] || '💳'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{cat._id}</span>
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.count} txns • avg ${cat.avgAmount.toFixed(2)}</span>
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>${cat.total.toFixed(2)}</span>
                                                <span style={{ fontSize: 12, color: COLORS[i % COLORS.length], fontWeight: 600 }}>{cat.percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${cat.percentage}%`, background: COLORS[i % COLORS.length] }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <div className="empty-state-title">No category data</div>
                            <div className="empty-state-desc">Add some expenses to see your breakdown</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
