import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, categoryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const PAYMENT_METHODS = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'credit_card', label: '💳 Credit Card' },
    { value: 'debit_card', label: '🏦 Debit Card' },
    { value: 'bank_transfer', label: '🏛️ Bank Transfer' },
    { value: 'digital_wallet', label: '📱 Digital Wallet' },
    { value: 'other', label: '📦 Other' },
];

const ExpenseModal = ({ expense, onClose, onSaved }) => {
    const isEdit = !!expense;
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        notes: ''
    });
    const [errors, setErrors] = useState({});

    const loadCategories = useCallback(async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(res.data.categories);
            if (!isEdit && res.data.categories.length > 0) {
                setForm(prev => ({ ...prev, category: res.data.categories[0].name }));
            }
        } catch (err) {
            console.error(err);
        }
    }, [isEdit]);

    useEffect(() => {
        loadCategories();
        if (expense) {
            setForm({
                amount: expense.amount,
                category: expense.category,
                description: expense.description || '',
                date: format(new Date(expense.date), 'yyyy-MM-dd'),
                paymentMethod: expense.paymentMethod || 'cash',
                notes: expense.notes || ''
            });
        }
    }, [expense, loadCategories]);

    const validate = () => {
        const newErrors = {};
        if (!form.amount || parseFloat(form.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!form.category) newErrors.category = 'Category is required';
        if (!form.date) newErrors.date = 'Date is required';
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
            if (isEdit) {
                await expenseAPI.update(expense._id, form);
                toast.success('Expense updated! ✅');
            } else {
                await expenseAPI.create(form);
                toast.success('Expense added! ✅');
            }
            onSaved();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? '✏️ Edit Expense' : '➕ Add Expense'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Amount + Category Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Amount ($)</label>
                            <input
                                type="number"
                                name="amount"
                                className="form-input"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={handleChange}
                                step="0.01"
                                min="0.01"
                            />
                            {errors.amount && <div className="form-error">{errors.amount}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                name="category"
                                className="form-select"
                                value={form.category}
                                onChange={handleChange}
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.name}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <div className="form-error">{errors.category}</div>}
                        </div>
                    </div>

                    {/* Date + Payment Method Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                name="date"
                                className="form-input"
                                value={form.date}
                                onChange={handleChange}
                                style={{ colorScheme: 'dark' }}
                            />
                            {errors.date && <div className="form-error">{errors.date}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select
                                name="paymentMethod"
                                className="form-select"
                                value={form.paymentMethod}
                                onChange={handleChange}
                            >
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                            type="text"
                            name="description"
                            className="form-input"
                            placeholder="What was this for?"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            name="notes"
                            className="form-textarea"
                            placeholder="Any additional notes..."
                            value={form.notes}
                            onChange={handleChange}
                            rows={2}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : isEdit ? '✅ Save Changes' : '➕ Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
