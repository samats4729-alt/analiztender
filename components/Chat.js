'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTenders } from '../lib/tenderService';
import { Bot, Send, User } from 'lucide-react';

export default function Chat() {
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Привет! Я ваш ИИ-аналитик. Я вижу всю базу тендеров. Спрашивайте!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Fetch real data from Supabase
            const tenders = await getTenders();

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, tenders })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setMessages([...newMessages, { role: 'assistant', content: data.content }]);
        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', content: 'Ошибка: Не удалось получить ответ (проверьте консоль).' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden'
        }}>
            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem' // Tight gap between messages
            }}>
                {messages.filter(m => m.role !== 'system').map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '8px',
                        alignItems: 'flex-end'
                    }}>
                        {/* Avatar for Bot */}
                        {m.role !== 'user' && (
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                color: '#4f46e5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginBottom: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <Bot size={16} />
                            </div>
                        )}

                        <div style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '18px',
                            background: m.role === 'user' ? '#3b82f6' : '#ffffff',
                            color: m.role === 'user' ? '#fff' : '#1e293b',
                            borderTopLeftRadius: m.role === 'user' ? '18px' : '4px',
                            borderTopRightRadius: m.role === 'user' ? '4px' : '18px',
                            boxShadow: m.role !== 'user' ? '0 2px 8px rgba(0,0,0,0.06)' : '0 2px 4px rgba(59, 130, 246, 0.2)',
                            fontSize: '0.92rem',
                            lineHeight: '1.5'
                        }}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Lists
                                    ul: ({ node, ...props }) => <ul style={{ margin: '0.25rem 0', paddingLeft: '1.2rem' }} {...props} />,
                                    ol: ({ node, ...props }) => <ol style={{ margin: '0.25rem 0', paddingLeft: '1.2rem' }} {...props} />,
                                    li: ({ node, ...props }) => <li style={{ marginBottom: '0.2rem' }} {...props} />,
                                    // Paragraphs
                                    p: ({ node, ...props }) => <p style={{ margin: '0 0 0.5rem 0', lastChild: { margin: 0 } }} {...props} />,
                                    // Tables
                                    table: ({ node, ...props }) => <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }} {...props} /></div>,
                                    th: ({ node, ...props }) => <th style={{ borderBottom: '1px solid #e2e8f0', padding: '6px', textAlign: 'left', fontWeight: '600', color: m.role === 'user' ? '#fff' : '#475569' }} {...props} />,
                                    td: ({ node, ...props }) => <td style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '6px' }} {...props} />,
                                    // Code
                                    code: ({ node, inline, ...props }) => <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85em' }} {...props} />
                                }}
                            >
                                {m.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ alignSelf: 'flex-start', marginLeft: '32px', color: '#94a3b8', fontSize: '0.8rem' }}>
                        Печатает...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '1rem' }}>
                <form onSubmit={handleSend} style={{
                    display: 'flex',
                    gap: '0.5rem',
                    background: '#fff',
                    padding: '0.5rem',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #f1f5f9'
                }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Спроси о тендерах..."
                        style={{
                            flex: 1,
                            padding: '0.6rem 1rem',
                            borderRadius: '20px',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.95rem',
                            background: 'transparent'
                        }}
                    />
                    <button type="submit" disabled={loading || !input.trim()} style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s',
                        opacity: input.trim() ? 1 : 0.7
                    }}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
