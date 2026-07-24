import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Scan Studio',
  description: 'Automação de tradução e produção de mangás, manhwas, manhuas e novels com IA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
