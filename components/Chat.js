'use client';

import { useState } from 'react';
import styles from '../app/chat/chat.module.css'; // Adjust import if we move css or keep it
import ReactMarkdown from 'react-markdown';

export default function Chat() {
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Привет! Я ваш ИИ-аналитик тендеров. Спрашивайте меня о прошлых тендерах или советах по ценам.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const tenders = JSON.parse(localStorage.getItem('tenders_data') || '[]');

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, tenders })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content || 'Ошибка: Не удалось получить ответ.'
            }]);
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Ошибка: ${error.message || 'Проблема с соединением'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Чат тендерного ИИ</h1>
            </header>

            <div className={styles.chatWindow}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                        <div className={styles.messageContent}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {loading && <div className={styles.loading}>ИИ думает...</div>}
            </div>

            <form onSubmit={sendMessage} className={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Спросите о тендере..."
                    className={styles.input}
                />
                <button type="submit" className={styles.sendBtn} disabled={loading}>Отправить</button>
            </form>
        </div>
    );
}
