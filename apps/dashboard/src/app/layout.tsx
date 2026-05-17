import type { Metadata } from 'next';
import { Sidebar } from '@/components/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'JARVIS',
  description: 'AI Growth Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex h-screen overflow-hidden bg-[var(--background)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
