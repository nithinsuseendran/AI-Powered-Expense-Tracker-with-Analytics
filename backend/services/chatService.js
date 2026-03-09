const OpenAI = require('openai');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Budget = require('../models/Budget');

// Supports both Groq (free) and OpenAI
// Set GROQ_API_KEY in .env for free usage — https://console.groq.com
// Or set OPENAI_API_KEY for OpenAI
const isGroq = !!process.env.GROQ_API_KEY;
const openai = new OpenAI({
    apiKey: isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY,
    ...(isGroq ? { baseURL: 'https://api.groq.com/openai/v1' } : {})
});

// Free Groq model: llama-3.3-70b-versatile (fast & smart)
// Fallback to gpt-4o-mini if using OpenAI
const AI_MODEL = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
console.log(`🤖 AI Provider: ${isGroq ? 'Groq (Free)' : 'OpenAI'} | Model: ${AI_MODEL}`);

const SYSTEM_PROMPT = `You are an intelligent AI assistant for an expense tracking application. 
Your job is to help users manage their finances through natural conversation.

You can perform these actions on expenses:
- CREATE: When user describes spending money or adding an expense
- READ: When user asks about spending summaries, totals, or history  
- UPDATE: When user wants to modify an existing expense
- DELETE: When user wants to remove an expense
- ANALYTICS: When user asks for insights, trends, or comparisons
- GENERAL: For any other financial advice or conversation

IMPORTANT INSTRUCTIONS:
1. Always extract structured data from natural language
2. Be context-aware — remember what was discussed earlier in the conversation
3. When creating expenses, extract: amount, category, date, description, paymentMethod
4. For dates, interpret relative terms (yesterday, last week, today) based on current date: ${new Date().toISOString()}
5. Default category if unclear: "Other"
6. Default payment method if unclear: "cash"
7. Always confirm actions in a friendly, conversational tone
8. Provide helpful financial insights when relevant

When responding, you MUST structure your response as JSON with this exact format:
{
  "action": "create|read|update|delete|analytics|general",
  "message": "Your friendly response to the user",
  "data": {
    // For CREATE: { amount, category, date, description, paymentMethod }
    // For UPDATE: { expenseId (if known), fields to update }
    // For DELETE: { expenseId (if known), criteria: "last" | "specific" }
    // For READ: { period, category, startDate, endDate }
    // For ANALYTICS: { type: "trends|comparison|summary|budget_status" }
    // For GENERAL: {}
  },
  "needsConfirmation": false,
  "followUpQuestion": null
}`;

class ChatService {
    async processMessage(userMessage, conversationHistory, userId) {
        try {
            // Build messages array for OpenAI
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...conversationHistory.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                { role: 'user', content: userMessage }
            ];

            // Get AI response
            const completion = await openai.chat.completions.create({
                model: AI_MODEL,
                messages,
                temperature: 0.3,
                response_format: { type: 'json_object' },
                max_tokens: 1000
            });

            let aiResponse;
            try {
                aiResponse = JSON.parse(completion.choices[0].message.content);
            } catch {
                aiResponse = {
                    action: 'general',
                    message: completion.choices[0].message.content,
                    data: {}
                };
            }

            // Execute the action
            const result = await this.executeAction(aiResponse, userId, conversationHistory);
            return result;

        } catch (error) {
            console.error('AI API error:', error);
            if (error.status === 401) {
                throw new Error(
                    isGroq
                        ? 'Invalid Groq API key. Get a free key at https://console.groq.com'
                        : 'Invalid OpenAI API key. Please configure a valid key.'
                );
            }
            throw error;
        }
    }

    async executeAction(aiResponse, userId, conversationHistory) {
        const { action, message, data } = aiResponse;
        let finalMessage = message;
        let actionResult = null;

        try {
            switch (action) {
                case 'create': {
                    if (data && data.amount) {
                        const expense = await Expense.create({
                            user: userId,
                            amount: parseFloat(data.amount),
                            category: data.category || 'Other',
                            description: data.description || '',
                            date: data.date ? new Date(data.date) : new Date(),
                            paymentMethod: data.paymentMethod || 'cash'
                        });
                        actionResult = expense;
                        finalMessage = message || `✅ Got it! Added **$${data.amount}** for ${data.category} on ${new Date(data.date || Date.now()).toLocaleDateString()}.`;
                    }
                    break;
                }

                case 'read': {
                    const queryResult = await this.handleReadQuery(data, userId);
                    finalMessage = await this.formatReadResponse(queryResult, data, userId);
                    actionResult = queryResult;
                    break;
                }

                case 'update': {
                    const updateResult = await this.handleUpdate(data, userId, conversationHistory);
                    if (updateResult) {
                        actionResult = updateResult;
                        finalMessage = message || `✅ Expense updated successfully!`;
                    } else {
                        finalMessage = "I couldn't find the expense to update. Could you be more specific?";
                    }
                    break;
                }

                case 'delete': {
                    const deleteResult = await this.handleDelete(data, userId, conversationHistory);
                    if (deleteResult) {
                        actionResult = deleteResult;
                        finalMessage = message || `🗑️ Done! Expense deleted.`;
                    } else {
                        finalMessage = "I couldn't find the expense to delete. Could you be more specific?";
                    }
                    break;
                }

                case 'analytics': {
                    const analyticsData = await this.handleAnalytics(data, userId);
                    finalMessage = await this.formatAnalyticsResponse(analyticsData, data, userId);
                    actionResult = analyticsData;
                    break;
                }

                default:
                    break;
            }
        } catch (execError) {
            console.error('Action execution error:', execError);
            finalMessage = message || "I understood your request but ran into an issue. Please try again.";
        }

        return {
            action,
            message: finalMessage,
            data: actionResult,
            metadata: aiResponse.data
        };
    }

    async handleReadQuery(data, userId) {
        const now = new Date();
        let startDate, endDate;

        const period = (data?.period || 'month').toLowerCase();

        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (period === 'week') {
            const dayOfWeek = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
            endDate = now;
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        } else if (period === 'all') {
            // No date restriction — fetch all time
            startDate = null;
            endDate = null;
        } else {
            // Default: current month (covers 'month', 'summary', unknown values)
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        // Handle explicit date range
        if (data?.startDate) {
            startDate = new Date(data.startDate);
            endDate = data.endDate ? new Date(data.endDate) : now;
        }

        const filter = {
            user: userId,
            ...(startDate && endDate ? { date: { $gte: startDate, $lte: endDate } } : {})
        };

        if (data?.category) {
            filter.category = { $regex: new RegExp(data.category, 'i') };
        }

        const expenses = await Expense.find(filter).sort({ date: -1 }).limit(50);
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);

        return { expenses, total, count: expenses.length, startDate, endDate, period };
    }

    async formatReadResponse(queryResult, data, userId) {
        const { expenses, total, count, startDate } = queryResult;

        if (count === 0) {
            return `I didn't find any expenses${data?.category ? ` for ${data.category}` : ''}${startDate ? ` in that period` : ''}. You haven't tracked anything there yet!`;
        }

        const period = data?.period || 'this month';
        let response = `📊 Here's what I found for **${period}**:\n\n`;
        response += `💰 **Total Spent: $${total.toFixed(2)}** across ${count} expense${count > 1 ? 's' : ''}\n\n`;

        if (data?.category) {
            response += `Top expenses in **${data.category}**:\n`;
            expenses.slice(0, 5).forEach(e => {
                response += `• $${e.amount.toFixed(2)} — ${e.description || e.category} (${new Date(e.date).toLocaleDateString()})\n`;
            });
        } else {
            // Category breakdown
            const byCat = {};
            expenses.forEach(e => {
                byCat[e.category] = (byCat[e.category] || 0) + e.amount;
            });
            const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
            response += `**By Category:**\n`;
            sorted.slice(0, 5).forEach(([cat, amt]) => {
                const pct = ((amt / total) * 100).toFixed(0);
                response += `• **${cat}**: $${amt.toFixed(2)} (${pct}%)\n`;
            });
        }

        return response;
    }

    async handleUpdate(data, userId, conversationHistory) {
        let expense;

        if (data?.expenseId) {
            expense = await Expense.findOne({ _id: data.expenseId, user: userId });
        } else {
            // Try to find from context or get last expense
            expense = await Expense.findOne({ user: userId }).sort({ createdAt: -1 });
        }

        if (!expense) return null;

        const updates = {};
        if (data?.amount !== undefined) updates.amount = parseFloat(data.amount);
        if (data?.category) updates.category = data.category;
        if (data?.description) updates.description = data.description;
        if (data?.date) updates.date = new Date(data.date);
        if (data?.paymentMethod) updates.paymentMethod = data.paymentMethod;

        Object.assign(expense, updates);
        await expense.save();
        return expense;
    }

    async handleDelete(data, userId, conversationHistory) {
        let expense;

        if (data?.expenseId) {
            expense = await Expense.findOne({ _id: data.expenseId, user: userId });
        } else if (data?.criteria === 'last') {
            expense = await Expense.findOne({ user: userId }).sort({ createdAt: -1 });
        }

        if (!expense) return null;

        await Expense.findByIdAndDelete(expense._id);
        return expense;
    }

    async handleAnalytics(data, userId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [thisMonth, lastMonth, byCategory, budgets] = await Promise.all([
            Expense.aggregate([
                { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } }
            ]),
            Budget.find({ user: userId, type: 'monthly', month: now.getMonth() + 1, year: now.getFullYear() })
        ]);

        return { thisMonth, lastMonth: lastMonth[0]?.total || 0, byCategory, budgets };
    }

    async formatAnalyticsResponse(analyticsData, data, userId) {
        const { thisMonth, lastMonth, byCategory } = analyticsData;
        const thisMonthTotal = thisMonth.reduce((s, c) => s + c.total, 0);

        let response = `📈 **Spending Analytics**\n\n`;
        response += `**This Month:** $${thisMonthTotal.toFixed(2)}\n`;
        response += `**Last Month:** $${lastMonth.toFixed(2)}\n`;

        if (lastMonth > 0) {
            const change = ((thisMonthTotal - lastMonth) / lastMonth * 100).toFixed(1);
            const emoji = parseFloat(change) > 0 ? '📈' : '📉';
            response += `**Change:** ${emoji} ${change}% ${parseFloat(change) > 0 ? 'more' : 'less'} than last month\n\n`;
        }

        if (byCategory.length > 0) {
            response += `**Top Spending Categories:**\n`;
            byCategory.slice(0, 5).forEach((cat, i) => {
                const pct = thisMonthTotal > 0 ? ((cat.total / thisMonthTotal) * 100).toFixed(0) : 0;
                response += `${i + 1}. **${cat._id}**: $${cat.total.toFixed(2)} (${pct}%)\n`;
            });
        }

        return response;
    }
}

module.exports = new ChatService();
