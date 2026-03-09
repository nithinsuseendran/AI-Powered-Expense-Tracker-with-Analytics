const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'analytics', 'general', null],
        default: null
    },
    relatedExpenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

chatMessageSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
