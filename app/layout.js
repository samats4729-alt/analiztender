import './globals.css'

export const metadata = {
    title: 'Tender Analyzer',
    description: 'AI-powered Tender Analysis',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ru" translate="no">
            <body>{children}</body>
        </html>
    )
}
