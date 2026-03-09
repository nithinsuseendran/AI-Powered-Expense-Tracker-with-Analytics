import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Shield, X } from 'lucide-react';

const PRESET_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16', '#a78bfa', '#f87171'];
const PRESET_ICONS = ['🍔', '🚗', '🎬', '📄', '🛍️', '🏥', '📚', '📦', '✈️', '🏋️', '💄', '🎮', '🐶', '🏠', '⚡', '📱', '☕', '🎵'];

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form, setForm] = useState({ name: '', icon: '📦', color: '#7c3aed', budget: '' });
    const [submitting, setSubmitting] = useState(false);

    const loadCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(res.data.categories);
        } catch (err) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCategories(); }, []);

    const openEdit = (cat) => {
        setEditingCategory(cat);
        setForm({ name: cat.name, icon: cat.icon, color: cat.color, budget: cat.budget || '' });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingCategory(null);
        setForm({ name: '', icon: '📦', color: '#7c3aed', budget: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Category name is required'); return; }
        setSubmitting(true);
        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory._id, form);
                toast.success('Category updated!');
            } else {
                await categoryAPI.create(form);
                toast.success('Category created! 🏷️');
            }
            closeForm();
            loadCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await categoryAPI.delete(id);
            toast.success('Category deleted');
            loadCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete category');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Categories</h1>
                    <p className="page-subtitle">Organize your expenses with custom categories</p>
                </div>
                <button className="btn btn-primary" onClick={() => { closeForm(); setShowForm(true); }}>
                    <Plus size={16} /> Add Category
                </button>
            </div>

            <div className="page-content">
                {/* Form */}
                {showForm && (
                    <div className="card" style={{ marginBottom: 24, animation: 'slideUp 0.3s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                                {editingCategory ? '✏️ Edit Category' : '➕ New Category'}
                            </h2>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={closeForm}><X size={16} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Category Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Gym, Travel..."
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Monthly Budget ($, optional)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={form.budget}
                                        onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                                        min="0" step="1"
                                    />
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Icon</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {PRESET_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, icon }))}
                                            style={{
                                                width: 40, height: 40, borderRadius: 10, fontSize: 20,
                                                background: form.icon === icon ? 'rgba(124,58,237,0.2)' : 'var(--bg-input)',
                                                border: form.icon === icon ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.icon}
                                        onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                        placeholder="Custom emoji"
                                        style={{ width: 100 }}
                                        maxLength={4}
                                    />
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="form-group" style={{ marginBottom: 20 }}>
                                <label className="form-label">Color</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, color }))}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%', background: color,
                                                border: form.color === color ? '3px solid white' : '3px solid transparent',
                                                cursor: 'pointer', outline: form.color === color ? `3px solid ${color}` : 'none',
                                                outlineOffset: 2, transition: 'all 0.15s ease', flexShrink: 0
                                            }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={form.color}
                                        onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                                        style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                background: 'var(--bg-input)', borderRadius: 10, marginBottom: 16,
                                border: '1px solid var(--border-primary)'
                            }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: `${form.color}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                                }}>
                                    {form.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{form.name || 'Category Name'}</div>
                                    <div style={{ fontSize: 12, color: form.color, fontWeight: 600 }}>Preview</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : editingCategory ? '✅ Save Changes' : '➕ Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 100 }} className="skeleton" />)}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {categories.map(cat => (
                            <div key={cat._id} className="card" style={{ padding: 20, transition: 'all 0.2s ease' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = cat.color + '50'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: `${cat.color}20`, border: `1px solid ${cat.color}30`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                                    }}>
                                        {cat.icon}
                                    </div>
                                    {cat.isDefault && (
                                        <div title="Default category">
                                            <Shield size={14} color="var(--text-muted)" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cat.name}</div>
                                {cat.budget > 0 && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Budget: ${cat.budget}/month</div>
                                )}
                                {!cat.isDefault && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)} style={{ flex: 1 }}>
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(cat._id)}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;
