import type { Metadata } from 'next';
import { Shell } from '@/components/layout/Shell';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Hermes Dashboard',
  description: 'Control center for Hermes Agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-bg-root text-tx-primary antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}