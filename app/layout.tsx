import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// manggil font silkscreen biar pixelnya tetep clean dan kebaca
const pixelFont = Silkscreen({ 
  subsets: ['latin'],
  weight: ['400', '700'], 
});

export const metadata: Metadata = {
  title: 'Nuggies Explorer',
  description: 'snapshot holders & view collection metadata instantly.',
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