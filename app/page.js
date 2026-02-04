'use client';

import { useState } from 'react';
import Chat from '@/components/Chat';
import Tenders from '@/components/Tenders';
import styles from './page.module.css';
import {
    LayoutDashboard,
    MessageSquare,
    Bot,
    Menu,
    Bell,
    User,
    Box
} from 'lucide-react';

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
                    <Box size={28} color="white" strokeWidth={2.5} />
                    <span>TenderAI</span>
                </div>

                <nav className={styles.nav}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'tenders' ? styles.active : ''}`}
                        onClick={() => handleTabChange('tenders')}
                    >
                        <div className={styles.navIcon}><LayoutDashboard size={20} /></div>
                        <span>Тендеры</span>
                    </button>

                    <button
                        className={`${styles.navItem} ${activeTab === 'chat' ? styles.active : ''}`}
                        onClick={() => handleTabChange('chat')}
                    >
                        <div className={styles.navIcon}><MessageSquare size={20} /></div>
                        <span>Чат с ИИ</span>
                    </button>


                </nav>

                <div className={styles.sidebarFooter}>
                    v1.0.4
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={styles.mainWrapper}>
                {/* Header */}
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className={styles.mobileToggle} onClick={toggleSidebar}>
                            <Menu size={24} />
                        </button>
                        <div className={styles.headerTitle}>
                            {activeTab === 'tenders' ? 'Управление тендерами' : 'AI Ассистент'}
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                            <Bell size={20} />
                        </button>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: '#e0e7ff', color: '#4f46e5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                            <User size={20} />
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
