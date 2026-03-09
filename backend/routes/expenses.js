const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route GET /api/expenses
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            paymentMethod,
            sortBy = 'date',
            sortOrder = 'desc',
            search
        } = req.query;

        const filter = { user: req.user._id };

        if (category) filter.category = category;
        if (paymentMethod) filter.paymentMethod = paymentMethod;
        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
        }
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }
        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Expense.countDocuments(filter);
        const expenses = await Expense.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            expenses,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route GET /api/expenses/:id
router.get('/:id', async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }
        res.json({ success: true, expense });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route POST /api/expenses
router.post('/', [
    body('amount').isNumeric().withMessage('Amount must be a number').custom(v => v > 0).withMessage('Amount must be positive'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Please provide a valid date')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { amount, category, description, date, paymentMethod, tags, notes } = req.body;

        const expense = await Expense.create({
            user: req.user._id,
            amount: parseFloat(amount),
            category,
            description: description || '',
            date: new Date(date),
            paymentMethod: paymentMethod || 'cash',
            tags: tags || [],
            notes: notes || ''
        });

        res.status(201).json({ success: true, message: 'Expense added successfully!', expense });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }

        const { amount, category, description, date, paymentMethod, tags, notes } = req.body;

        if (amount !== undefined) expense.amount = parseFloat(amount);
        if (category !== undefined) expense.category = category;
        if (description !== undefined) expense.description = description;
        if (date !== undefined) expense.date = new Date(date);
        if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
        if (tags !== undefined) expense.tags = tags;
        if (notes !== undefined) expense.notes = notes;

        await expense.save();

        res.json({ success: true, message: 'Expense updated successfully!', expense });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }
        res.json({ success: true, message: 'Expense deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route DELETE /api/expenses/bulk/delete
router.post('/bulk/delete', async (req, res) => {
    try {
        const { ids } = req.body;
        await Expense.deleteMany({ _id: { $in: ids }, user: req.user._id });
        res.json({ success: true, message: `${ids.length} expense(s) deleted.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
