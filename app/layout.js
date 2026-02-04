import './globals.css'

export const metadata = {
    title: 'Tender Analyzer',
    description: 'Pro Tender Analysis Platform',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ru">
            <body>{children}</body>
        </html>
    )
}
