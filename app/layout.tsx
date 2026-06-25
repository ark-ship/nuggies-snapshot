import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { Providers } from './providers';

// Restoring the Silkscreen font configuration
const silkscreen = Silkscreen({ 
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nuggies Explorer',
  description: 'Snapshot holders and view collection metadata instantly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={silkscreen.className}>
        <Providers>
          {children}
        </Providers>
        {/* Restoring Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}