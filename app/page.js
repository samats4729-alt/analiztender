'use client';

import { useState } from 'react';
import Chat from '@/components/Chat';
import Tenders from '@/components/Tenders';
import styles from './page.module.css';

export default function Home() {
    // Current active view
    const [activeTab, setActiveTab] = useState('tenders');
    // Mobile sidebar toggle
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        closeSidebar();
    };

    return (
        <div className={`${styles.layout} ${isSidebarOpen ? styles.menuOpen : ''}`}>
            {/* Mobile Overlay */}
            <div className={styles.sidebarOverlay} onClick={closeSidebar}></div>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
                <div className={styles.logoArea}>
                    <span>TenderAI 🤖</span>
                </div>

                <nav className={styles.nav}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'tenders' ? styles.active : ''}`}
                        onClick={() => handleTabChange('tenders')}
                    >
                        <span className={styles.navIcon}>📋</span>
                        <span>Тендеры</span>
                    </button>

                    <button
                        className={`${styles.navItem} ${activeTab === 'chat' ? styles.active : ''}`}
                        onClick={() => handleTabChange('chat')}
                    >
                        <span className={styles.navIcon}>💬</span>
                        <span>Чат с ИИ</span>
                    </button>

                    {/* Placeholder for future features */}
                    <button className={styles.navItem} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <span className={styles.navIcon}>📊</span>
                        <span>Аналитика (Скоро)</span>
                    </button>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Samat Logistics <br /> v1.0.2
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={styles.mainWrapper}>
                {/* Header */}
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className={styles.mobileToggle} onClick={toggleSidebar}>
                            ☰
                        </button>
                        <div className={styles.headerTitle}>
                            {activeTab === 'tenders' ? 'Управление тендерами' : 'AI Ассистент'}
                        </div>
                    </div>

                    {/* Header Actions (User Profile, etc) could go here */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* We can move the 'Clear All' button here via Context later, 
                            but for now it remains in Tenders for simplicity of state access */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.contentArea}>
                    {activeTab === 'tenders' ? <Tenders /> : <Chat />}
                </main>
            </div>
        </div>
    );
}
