import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://padelo2.com'),
  title: {
    default: 'PadelO₂ - Breathe and Live',
    template: '%s | PadelO₂',
  },
  description: 'Innovative padel sports ecosystem combining tournaments, training, AI-powered machines, and global court construction.',
  keywords: ['padel', 'tournaments', 'training', 'AI machines', 'padel courts', 'investments'],
  authors: [{ name: 'Kaus Australis LTD' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://padelo2.com',
    siteName: 'PadelO₂',
    title: 'PadelO₂ - Breathe and Live',
    description: 'Innovative padel sports ecosystem',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PadelO₂ - Breathe and Live',
    description: 'Innovative padel sports ecosystem',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


