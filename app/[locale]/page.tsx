import Hero from '@/components/sections/Hero';
import HistoryTimeline from '@/components/sections/HistoryTimeline';
import Investments from '@/components/sections/Investments';
import Academy from '@/components/sections/Academy';
import Machines from '@/components/sections/Machines';
import Courts from '@/components/sections/Courts';
import Partners from '@/components/sections/Partners';

export default function HomePage() {
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

