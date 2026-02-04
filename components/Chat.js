'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Chat() {
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Привет! Я ваш ИИ-аналитик тендеров. Спрашивайте меня о прошлых тендерах или советах по ценам. Я умею рисовать таблицы.' }
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

        // Note: We use 'messages' array for history, matching the API expectation
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Fetch tenders from localStorage to provide context
            const storedTenders = localStorage.getItem('tenders_data');
            const tenders = storedTenders ? JSON.parse(storedTenders) : [];

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // API expects { messages: [], tenders: [] } based on my previous fix
                body: JSON.stringify({ messages: newMessages, tenders })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setMessages([...newMessages, { role: 'assistant', content: data.content }]);
        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', content: 'Ошибка: Не удалось получить ответ от сервера.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            height: '85vh',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>Чат с Аналитиком</h2>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                border: '1px solid #e0e0e0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                {messages.filter(m => m.role !== 'system').map((m, i) => (
                    <div key={i} style={{
                        marginBottom: '1.5rem',
                        display: 'flex',
                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderRadius: '16px',
                            background: m.role === 'user' ? '#0070f3' : '#f8f9fa',
                            color: m.role === 'user' ? '#fff' : '#111',
                            border: m.role !== 'user' ? '1px solid #e1e4e8' : 'none',
                            maxWidth: '85%',
                            boxShadow: m.role !== 'user' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 4px rgba(0,112,243,0.2)',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                        }}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Style tables specifically
                                    table: ({ node, ...props }) => <div style={{ overflowX: 'auto', margin: '1rem 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }} {...props} /></div>,
                                    th: ({ node, ...props }) => <th style={{ border: '1px solid #ddd', padding: '8px 12px', background: m.role === 'user' ? 'rgba(255,255,255,0.2)' : '#f0f0f0', fontWeight: '600' }} {...props} />,
                                    td: ({ node, ...props }) => <td style={{ border: '1px solid #ddd', padding: '8px 12px' }} {...props} />,
                                    p: ({ node, ...props }) => <p style={{ margin: '0.5rem 0' }} {...props} />,
                                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }} {...props} />,
                                    ol: ({ node, ...props }) => <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }} {...props} />,
                                    a: ({ node, ...props }) => <a style={{ color: m.role === 'user' ? '#fff' : '#0070f3', textDecoration: 'underline' }} {...props} />
                                }}
                            >
                                {m.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ textAlign: 'left', color: '#888', fontStyle: 'italic', marginLeft: '1rem' }}>
                        <span>• • •</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Пример: покажи цены на Астану..."
                    style={{
                        flex: 1,
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                    }}
                />
                <button type="submit" disabled={loading} style={{
                    padding: '0 2rem',
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'transform 0.1s'
                }}>
                    Send
                </button>
            </form>
        </div>
    );
}
