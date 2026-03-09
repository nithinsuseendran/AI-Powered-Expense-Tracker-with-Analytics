import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import ExpenseModal from '../components/expenses/ExpenseModal';

const PAYMENT_LABELS = {
    cash: '💵 Cash', credit_card: '💳 Credit', debit_card: '🏦 Debit',
    bank_transfer: '🏛️ Bank', digital_wallet: '📱 Wallet', other: '📦 Other'
};

const getCategoryEmoji = (cat) => {
    const map = { 'Food': '🍔', 'Transport': '🚗', 'Entertainment': '🎬', 'Bills': '📄', 'Shopping': '🛍️', 'Healthcare': '🏥', 'Education': '📚', 'Other': '📦' };
    return map[cat] || '💳';
};

const Transactions = () => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filters, setFilters] = useState({
        search: '', category: '', startDate: '', endDate: '',
        minAmount: '', maxAmount: '', paymentMethod: '',
        sortBy: 'date', sortOrder: 'desc', page: 1
    });

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
            const res = await expenseAPI.getAll({ ...params, limit: 15 });
            setExpenses(res.data.expenses);
            setPagination(res.data.pagination);
        } catch (err) {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadExpenses();
        window.addEventListener('expense-changed', loadExpenses);
        return () => window.removeEventListener('expense-changed', loadExpenses);
    }, [loadExpenses]);

    useEffect(() => {
        categoryAPI.getAll().then(res => setCategories(res.data.categories));
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
            page: 1
        }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await expenseAPI.delete(id);
            toast.success('Expense deleted');
            loadExpenses();
        } catch {
            toast.error('Failed to delete expense');
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length || !window.confirm(`Delete ${selectedIds.length} expense(s)?`)) return;
        try {
            await expenseAPI.bulkDelete(selectedIds);
            toast.success(`${selectedIds.length} expense(s) deleted`);
            setSelectedIds([]);
            loadExpenses();
        } catch {
            toast.error('Failed to delete expenses');
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => prev.length === expenses.length ? [] : expenses.map(e => e._id));
    };

    const SortBtn = ({ field, label }) => (
        <button
            onClick={() => handleSort(field)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: filters.sortBy === field ? 'var(--accent-primary-light)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
            {label}
            <ArrowUpDown size={10} style={{ opacity: filters.sortBy === field ? 1 : 0.4 }} />
        </button>
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transactions</h1>
                    <p className="page-subtitle">{pagination.total} total expenses</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {selectedIds.length > 0 && (
                        <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                            <Trash2 size={14} /> Delete ({selectedIds.length})
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => { setSelectedExpense(null); setShowModal(true); }}>
                        <Plus size={16} /> Add Expense
                    </button>
                </div>
            </div>

            <div className="page-content">
                {/* Filters */}
                <div className="card" style={{ marginBottom: 20, padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                        <div className="search-wrapper">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search expenses..."
                                value={filters.search}
                                onChange={e => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <select
                            className="form-select"
                            value={filters.category}
                            onChange={e => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.startDate}
                            onChange={e => handleFilterChange('startDate', e.target.value)}
                            style={{ colorScheme: 'dark', fontSize: 13 }}
                            placeholder="From date"
                        />
                        <input
                            type="date"
                            className="form-input"
                            value={filters.endDate}
                            onChange={e => handleFilterChange('endDate', e.target.value)}
                            style={{ colorScheme: 'dark', fontSize: 13 }}
                            placeholder="To date"
                        />
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setFilters({ search: '', category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', paymentMethod: '', sortBy: 'date', sortOrder: 'desc', page: 1 })}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === expenses.length && expenses.length > 0}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                        />
                                    </th>
                                    <th><SortBtn field="date" label="Date" /></th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th><SortBtn field="amount" label="Amount" /></th>
                                    <th>Payment</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(7)].map((_, j) => (
                                                <td key={j}><div style={{ height: 18 }} className="skeleton" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : expenses.length > 0 ? expenses.map((expense) => (
                                    <tr key={expense._id} style={{ opacity: selectedIds.includes(expense._id) ? 0.8 : 1 }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(expense._id)}
                                                onChange={() => toggleSelect(expense._id)}
                                                style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                            />
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                            {format(new Date(expense.date), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 18 }}>{getCategoryEmoji(expense.category)}</span>
                                                <span className="badge badge-purple" style={{ fontSize: 11 }}>{expense.category}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>
                                            <div className="truncate">{expense.description || '—'}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: 15 }}>
                                                -${expense.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {PAYMENT_LABELS[expense.paymentMethod] || expense.paymentMethod}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => { setSelectedExpense(expense); setShowModal(true); }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-icon btn-sm"
                                                    onClick={() => handleDelete(expense._id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="empty-state">
                                                <div className="empty-state-icon">💸</div>
                                                <div className="empty-state-title">No expenses found</div>
                                                <div className="empty-state-desc">Try adjusting your filters or add a new expense</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-primary)' }}>
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    onClick={() => handleFilterChange('page', filters.page - 1)}
                                    disabled={filters.page <= 1}
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button
                                            key={p}
                                            className={`page-btn ${filters.page === p ? 'active' : ''}`}
                                            onClick={() => handleFilterChange('page', p)}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    className="page-btn"
                                    onClick={() => handleFilterChange('page', filters.page + 1)}
                                    disabled={filters.page >= pagination.totalPages}
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                Showing {expenses.length} of {pagination.total} expenses
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <ExpenseModal
                    expense={selectedExpense}
                    onClose={() => { setShowModal(false); setSelectedExpense(null); }}
                    onSaved={() => { setShowModal(false); setSelectedExpense(null); loadExpenses(); }}
                />
            )}
        </div>
    );
};

export default Transactions;
