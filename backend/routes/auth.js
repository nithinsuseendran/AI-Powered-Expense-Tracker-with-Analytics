const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d'
    });
};

const DEFAULT_CATEGORIES = [
    { name: 'Food', icon: '🍔', color: '#f59e0b', isDefault: true },
    { name: 'Transport', icon: '🚗', color: '#3b82f6', isDefault: true },
    { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', isDefault: true },
    { name: 'Bills', icon: '📄', color: '#ef4444', isDefault: true },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899', isDefault: true },
    { name: 'Healthcare', icon: '🏥', color: '#10b981', isDefault: true },
    { name: 'Education', icon: '📚', color: '#6366f1', isDefault: true },
    { name: 'Other', icon: '📦', color: '#6b7280', isDefault: true }
];

// @route POST /api/auth/signup
router.post('/signup', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }

        const user = await User.create({ name, email, password });

        // Create default categories for new user
        const defaultCats = DEFAULT_CATEGORIES.map(cat => ({ ...cat, user: user._id }));
        await Category.insertMany(defaultCats);

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency,
                monthlyBudget: user.monthlyBudget,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error during signup.' });
    }
});

// @route POST /api/auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency,
                monthlyBudget: user.monthlyBudget,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency,
                monthlyBudget: user.monthlyBudget,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route PUT /api/auth/update
router.put('/update', protect, async (req, res) => {
    try {
        const { name, currency, monthlyBudget } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, currency, monthlyBudget },
            { new: true, runValidators: true }
        );
        res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: { id: user._id, name: user.name, email: user.email, currency: user.currency, monthlyBudget: user.monthlyBudget }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
