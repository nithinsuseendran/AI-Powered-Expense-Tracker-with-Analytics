const express = require('express');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { name, icon, color, budget } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

        const existing = await Category.findOne({ user: req.user._id, name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) return res.status(400).json({ success: false, message: 'Category already exists.' });

        const category = await Category.create({
            user: req.user._id,
            name: name.trim(),
            icon: icon || '📦',
            color: color || '#6366f1',
            budget: budget || 0,
            isDefault: false
        });

        res.status(201).json({ success: true, message: 'Category created!', category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route PUT /api/categories/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, icon, color, budget } = req.body;
        const category = await Category.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { name, icon, color, budget },
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
        res.json({ success: true, message: 'Category updated!', category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
        if (category.isDefault) return res.status(400).json({ success: false, message: 'Cannot delete default categories.' });

        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
