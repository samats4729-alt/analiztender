'use client';

import { useState } from 'react';
import Chat from '@/components/Chat';
import Tenders from '@/components/Tenders';
import styles from './page.module.css';

export default function Home() {
    const [activeTab, setActiveTab] = useState('tenders'); // Default to tenders for data entry

    return (
        <main className={styles.main}>
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'tenders' ? styles.active : ''}`}
                    onClick={() => setActiveTab('tenders')}
                >
                    Тендеры
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Чат с ИИ
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'tenders' ? <Tenders /> : <Chat />}
            </div>
        </main>
    )
}
