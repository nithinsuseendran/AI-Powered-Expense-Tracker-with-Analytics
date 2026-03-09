const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route GET /api/budgets
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const budgets = await Budget.find({ user: req.user._id });

        // Compute spending for each budget
        const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
            const month = budget.month || (now.getMonth() + 1);
            const year = budget.year || now.getFullYear();

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const matchFilter = {
                user: req.user._id,
                date: { $gte: startDate, $lte: endDate }
            };
            if (budget.type === 'category' && budget.category) {
                matchFilter.category = budget.category;
            }

            const result = await Expense.aggregate([
                { $match: matchFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const spent = result[0]?.total || 0;
            const percentage = Math.round((spent / budget.amount) * 100);
            const isAlert = percentage >= budget.alertThreshold;

            return {
                ...budget.toObject(),
                spent,
                remaining: Math.max(0, budget.amount - spent),
                percentage: Math.min(percentage, 100),
                isAlert,
                isExceeded: spent > budget.amount
            };
        }));

        res.json({ success: true, budgets: budgetsWithProgress });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route POST /api/budgets
router.post('/', async (req, res) => {
    try {
        const { type, category, amount, month, year, alertThreshold } = req.body;
        if (!type || !amount) {
            return res.status(400).json({ success: false, message: 'Type and amount are required.' });
        }

        const now = new Date();
        const budgetMonth = month || (now.getMonth() + 1);
        const budgetYear = year || now.getFullYear();

        // Upsert budget
        const budget = await Budget.findOneAndUpdate(
            {
                user: req.user._id,
                type,
                category: category || null,
                month: budgetMonth,
                year: budgetYear
            },
            {
                amount: parseFloat(amount),
                alertThreshold: alertThreshold || 80,
                month: budgetMonth,
                year: budgetYear
            },
            { upsert: true, new: true }
        );

        res.status(201).json({ success: true, message: 'Budget saved!', budget });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!budget) return res.status(404).json({ success: false, message: 'Budget not found.' });
        res.json({ success: true, message: 'Budget deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
