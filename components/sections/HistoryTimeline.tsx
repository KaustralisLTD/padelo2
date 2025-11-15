'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  image: string;
}

const HistoryTimeline = () => {
  const t = useTranslations('Timeline');
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const timelineItems: TimelineItem[] = [
    {
      year: '1969',
      title: t('items.1969.title'),
      description: t('items.1969.description'),
      image: '/images/timeline/1969.jpg',
    },
    {
      year: '1990s',
      title: t('items.1990s.title'),
      description: t('items.1990s.description'),
      image: '/images/timeline/1990s.jpg',
    },
    {
      year: '2010s',
      title: t('items.2010s.title'),
      description: t('items.2010s.description'),
      image: '/images/timeline/2010s.jpg',
    },
    {
      year: '2025',
      title: t('items.2025.title'),
      description: t('items.2025.description'),
      image: '/images/timeline/2025.jpg',
    },
    {
      year: t('future'),
      title: t('items.future.title'),
      description: t('items.future.description'),
      image: '/images/timeline/future.jpg',
    },
  ];

  return (
    <section ref={ref} className="py-20 bg-background-secondary">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-poppins font-bold text-center mb-16 gradient-text"
        >
          {t('title')}
        </motion.h2>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary transform md:-translate-x-1/2" />

          {/* Timeline Items */}
          <div className="space-y-16">
            {timelineItems.map((item, index) => (
              <TimelineItem
                key={item.year}
                item={item}
                index={index}
                inView={inView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const TimelineItem = ({
  item,
  index,
  inView,
}: {
  item: TimelineItem;
  index: number;
  inView: boolean;
}) => {
  const { ref, inView: itemInView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
      {/* Dot */}
      <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background-secondary transform md:-translate-x-1/2 z-10" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
        animate={itemInView && inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: index * 0.2 }}
        className={`w-full md:w-1/2 ${isEven ? 'md:pr-12 pl-20 md:pl-0' : 'md:pl-12 pl-20 md:pr-0'}`}
      >
        <div className="bg-background p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors">
          <span className="text-primary font-orbitron font-bold text-lg">{item.year}</span>
          <h3 className="text-xl font-orbitron font-semibold mt-2 mb-3">{item.title}</h3>
          <p className="text-text-secondary font-poppins text-sm leading-relaxed">{item.description}</p>
          <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryTimeline;


