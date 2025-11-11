import { setRequestLocale } from 'next-intl/server';
import Hero from '@/components/sections/Hero';
import HistoryTimeline from '@/components/sections/HistoryTimeline';
import Investments from '@/components/sections/Investments';
import Academy from '@/components/sections/Academy';
import Machines from '@/components/sections/Machines';
import Courts from '@/components/sections/Courts';
import Partners from '@/components/sections/Partners';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return (
    <>
      <Hero />
      <HistoryTimeline />
      <Investments />
      <Academy />
      <Machines />
      <Courts />
      <Partners />
    </>
  );
}

