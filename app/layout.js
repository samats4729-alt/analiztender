import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
    title: 'TenderAI',
    description: 'AI-powered tender analysis',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ru">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
