import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Invisible Workflow Agent',
  description: 'Smart workflow automation with natural language rules',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="antialiased">{children}</body>
    </html>
  );
}
