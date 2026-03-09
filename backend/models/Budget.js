const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['monthly', 'category'],
        required: true
    },
    category: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        required: [true, 'Budget amount is required'],
        min: [1, 'Budget must be at least 1']
    },
    month: {
        type: Number,
        min: 1,
        max: 12
    },
    year: {
        type: Number
    },
    alertThreshold: {
        type: Number,
        default: 80,
        min: 1,
        max: 100
    }
}, {
    timestamps: true
});

budgetSchema.index({ user: 1, type: 1, category: 1, month: 1, year: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
