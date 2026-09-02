import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

// High-contrast editorial serif for the display type — the optical-size and
// SOFT axes let the huge headlines stay sharp without turning brittle.
const display = Fraunces({
  subsets: ['latin'],
  // No `weight`: that keeps the variable font variable, which the SOFT and
  // opsz axes below depend on.
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Noir Roast — From Bean to Moment',
  description:
    'A single-origin roast, followed from the tree to the cup. Scroll through the harvest, the roast, the aroma and the pour.',
  openGraph: {
    title: 'Noir Roast — From Bean to Moment',
    description:
      'A single-origin roast, followed from the tree to the cup.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#050302',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
