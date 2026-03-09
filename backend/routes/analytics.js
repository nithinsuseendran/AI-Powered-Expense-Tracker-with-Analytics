const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route GET /api/analytics/summary
router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const [totalAll, totalThisMonth, totalLastMonth, categoryBreakdown] = await Promise.all([
            Expense.aggregate([
                { $match: { user: req.user._id } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Expense.aggregate([
                { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Expense.aggregate([
                { $match: { user: req.user._id, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Expense.aggregate([
                { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ])
        ]);

        const thisMonthTotal = totalThisMonth[0]?.total || 0;
        const lastMonthTotal = totalLastMonth[0]?.total || 0;
        const monthChange = lastMonthTotal > 0
            ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            summary: {
                totalAll: totalAll[0]?.total || 0,
                totalCount: totalAll[0]?.count || 0,
                thisMonth: thisMonthTotal,
                thisMonthCount: totalThisMonth[0]?.count || 0,
                lastMonth: lastMonthTotal,
                monthChange: parseFloat(monthChange),
                categoryBreakdown
            }
        });
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route GET /api/analytics/trends
router.get('/trends', async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);

        const trends = await Expense.aggregate([
            { $match: { user: req.user._id, date: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({ success: true, trends });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route GET /api/analytics/by-category
router.get('/by-category', async (req, res) => {
    try {
        const { startDate, endDate, period = 'month' } = req.query;
        const now = new Date();

        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(new Date(endDate).setHours(23, 59, 59));
        } else if (period === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else if (period === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        }

        const byCategory = await Expense.aggregate([
            { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const totalSpent = byCategory.reduce((acc, cat) => acc + cat.total, 0);
        const result = byCategory.map(cat => ({
            ...cat,
            percentage: totalSpent > 0 ? ((cat.total / totalSpent) * 100).toFixed(1) : 0
        }));

        res.json({ success: true, byCategory: result, totalSpent });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route GET /api/analytics/daily
router.get('/daily', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const daily = await Expense.aggregate([
            { $match: { user: req.user._id, date: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, daily });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
