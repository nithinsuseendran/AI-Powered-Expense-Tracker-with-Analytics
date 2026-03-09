import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { Send, Bot, Trash2, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
    '📊 Show this month\'s summary',
    '➕ Add coffee $5 today',
    '💸 How much did I spend on food?',
    '📈 Compare last two months',
    '🗑️ Delete my last expense',
    '💰 What\'s my budget status?',
];

const ChatPanel = ({ isOpen, onToggle }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const loadHistory = async () => {
        try {
            const res = await chatAPI.getHistory(30);
            if (res.data.messages.length === 0) {
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: `👋 Hi there! I'm your AI expense assistant.\n\nI can help you:\n• Add expenses naturally ("I spent $45 on lunch")\n• Query spending ("How much on food this month?")\n• Update or delete expenses\n• Provide insights and analytics\n\nWhat would you like to do?`,
                    createdAt: new Date()
                }]);
            } else {
                setMessages(res.data.messages);
            }
        } catch (err) {
            console.error('Load history error:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || loading) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: text,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await chatAPI.sendMessage(text);
            const aiResponse = res.data.response;

            setMessages(prev => [...prev, {
                id: aiResponse.id || Date.now() + 1,
                role: 'assistant',
                content: aiResponse.message,
                action: aiResponse.action,
                createdAt: new Date(aiResponse.timestamp)
            }]);

            // If expense was created/updated/deleted, trigger dashboard refresh
            if (['create', 'update', 'delete'].includes(aiResponse.action)) {
                window.dispatchEvent(new CustomEvent('expense-changed'));
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: '⚠️ Connection error. Please check your backend server.',
                createdAt: new Date()
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearHistory = async () => {
        try {
            await chatAPI.clearHistory();
            setMessages([{
                id: 'welcome-new',
                role: 'assistant',
                content: '🗑️ Chat history cleared! Ready to help you track expenses.',
                createdAt: new Date()
            }]);
            toast.success('Chat history cleared');
        } catch (err) {
            toast.error('Failed to clear history');
        }
    };

    const formatMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                style={{
                    position: 'fixed',
                    right: 24,
                    bottom: 24,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-button)',
                    zIndex: 200,
                    transition: 'transform 0.2s ease',
                    animation: 'glow 3s ease infinite'
                }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
                <MessageSquare size={24} color="white" />
            </button>
        );
    }

    return (
        <div className="chat-panel">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-title">
                    <Bot size={18} style={{ color: 'var(--accent-primary-light)' }} />
                    AI Assistant
                    <span className="chat-ai-badge">
                        <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
                        GPT-4
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={clearHistory} title="Clear history">
                        <Trash2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onToggle} title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {historyLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                        <div className="spinner" />
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id || msg._id} className={`chat-message ${msg.role}`}>
                            <div className={`chat-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                                {msg.role === 'assistant' ? '🤖' : '👤'}
                            </div>
                            <div>
                                <div
                                    className={`chat-bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}
                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                                />
                                <div className="chat-timestamp">
                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {loading && (
                    <div className="chat-message" style={{ alignItems: 'flex-start' }}>
                        <div className="chat-avatar ai">🤖</div>
                        <div className="typing-indicator">
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="chat-suggestions">
                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <button
                        key={i}
                        className="chat-suggestion"
                        onClick={() => sendMessage(s.replace(/^[^\s]+\s/, ''))}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Ask me anything about your expenses..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        rows={1}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                    >
                        {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Send size={16} />}
                    </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
};

export default ChatPanel;
