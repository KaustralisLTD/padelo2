'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Academy = () => {
  const t = useTranslations('Academy');
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const programs = [
    {
      key: 'coach',
      icon: '👨‍🏫',
    },
    {
      key: 'player',
      icon: '🎾',
    },
    {
      key: 'smart',
      icon: '🤖',
    },
  ];

  return (
    <section ref={ref} className="py-20 bg-background-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 gradient-text">
            {t('title')}
          </h2>
          <p className="text-text-secondary font-poppins text-lg max-w-2xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <motion.div
              key={program.key}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-background p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors overflow-hidden"
            >
              <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                <img
                  src={`/images/academy/${program.key}-training.jpg`}
                  alt={t(`programs.${program.key}.title`)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-background-secondary"><span class="text-4xl">${program.icon}</span></div>`;
                    }
                  }}
                />
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3">
                {t(`programs.${program.key}.title`)}
              </h3>
              <p className="text-text-secondary font-poppins text-sm leading-relaxed">
                {t(`programs.${program.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Academy;

