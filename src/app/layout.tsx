import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'WhatsApp AI Brain — SaaS Dashboard',
  description: 'Multi-tenant WhatsApp AI chatbot platform. Manage conversations, orders, and products from one powerful dashboard.',
  keywords: 'WhatsApp AI, chatbot, SaaS, orders, dashboard, Gemini AI',
  openGraph: {
    title: 'WhatsApp AI Brain Dashboard',
    description: 'Manage your WhatsApp AI chatbot, conversations, orders, and products.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#FFFFFF',
                  color: '#000000',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                },
                success: { iconTheme: { primary: '#2563EB', secondary: '#FFFFFF' } },
                error:   { iconTheme: { primary: '#E11D48', secondary: '#FFFFFF' } },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
