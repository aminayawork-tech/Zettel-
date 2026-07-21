import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zettel — a reflective learning journal',
  description: 'Turn what you read, watch, and hear into lasting understanding.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <Nav />
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
