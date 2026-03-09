const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    icon: {
        type: String,
        default: '📦'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    budget: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

categorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
