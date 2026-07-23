import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zettel — a reflective learning journal',
  description: 'Turn what you read, watch, and hear into lasting understanding.',
};

// Locks pinch/double-tap zoom so the layout stays fit-to-screen like a native
// app on mobile, instead of users being able to zoom out into broken/overflowing
// layouts (fixed-width elements like the graph don't reflow with visual zoom).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <Nav />
          <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
