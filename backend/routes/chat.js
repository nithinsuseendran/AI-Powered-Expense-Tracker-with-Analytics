const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const chatService = require('../services/chatService');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// @route GET /api/chat/history
router.get('/history', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const messages = await ChatMessage.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route POST /api/chat/message
router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }

        // Get recent conversation history for context
        const conversationHistory = await ChatMessage.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        const historyForAI = conversationHistory.reverse();

        // Save user message
        await ChatMessage.create({
            user: req.user._id,
            role: 'user',
            content: message.trim()
        });

        // Process with AI
        const aiResult = await chatService.processMessage(
            message.trim(),
            historyForAI,
            req.user._id
        );

        // Save assistant response
        const assistantMsg = await ChatMessage.create({
            user: req.user._id,
            role: 'assistant',
            content: aiResult.message,
            action: aiResult.action,
            relatedExpenseId: aiResult.data?._id || null,
            metadata: aiResult.metadata || {}
        });

        res.json({
            success: true,
            response: {
                id: assistantMsg._id,
                message: aiResult.message,
                action: aiResult.action,
                data: aiResult.data,
                timestamp: assistantMsg.createdAt
            }
        });
    } catch (error) {
        console.error('Chat error:', error);

        // Still save error response for user
        const errorMessage = error.message?.includes('OpenAI') || error.message?.includes('API key')
            ? "⚠️ AI service is not configured. Please add a valid OpenAI API key to the backend .env file."
            : "Sorry, I encountered an error processing your request. Please try again.";

        await ChatMessage.create({
            user: req.user._id,
            role: 'assistant',
            content: errorMessage,
            action: 'general'
        }).catch(() => { });

        res.json({
            success: true,
            response: {
                message: errorMessage,
                action: 'general',
                data: null,
                timestamp: new Date()
            }
        });
    }
});

// @route DELETE /api/chat/clear
router.delete('/clear', async (req, res) => {
    try {
        await ChatMessage.deleteMany({ user: req.user._id });
        res.json({ success: true, message: 'Chat history cleared.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
