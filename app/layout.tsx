import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

// manggil font silkscreen biar pixelnya tetep clean dan kebaca
const pixelFont = Silkscreen({ 
  subsets: ['latin'],
  weight: ['400', '700'], 
});

export const metadata = {
  title: 'Nuggies Explorer | NFT Holder Snapshot Tool',
  description: 'Instantly export NFT holder lists to CSV. Supports Ethereum, Base, and Abstract chains. Built for the culture by Nuggies.',
  openGraph: {
    title: 'Nuggies Explorer',
    description: 'The ultimate tool for NFT communities.',
    images: ['icon.png'],
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={pixelFont.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}