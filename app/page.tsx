import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSEOData('/', 'en');
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'PadelO₂ — AI Training, Courts, Academy & Tournaments',
      description: 'The padel ecosystem: AI-powered training machines, pro court construction, academy and global tournaments. Breathe and play with PadelO₂.',
      keywords: ['padel ecosystem', 'AI padel machines', 'padel courts', 'padel academy', 'tournaments'],
      path: '',
    }, 'en');
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['padel ecosystem', 'AI padel machines', 'padel courts', 'padel academy', 'tournaments'],
    path: '',
  }, 'en');
}

export default function RootPage() {
  redirect('/en');
}

