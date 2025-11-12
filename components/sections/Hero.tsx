'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

const Hero = () => {
  const [logoError, setLogoError] = useState(false);
  const { theme } = useTheme();
  const t = useTranslations('Hero');
  const locale = useLocale();

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className={`absolute inset-0 ${
          theme === 'light'
            ? 'bg-gradient-to-b from-black/50 via-black/40 to-black/60'
            : 'bg-gradient-to-b from-background/40 via-background/30 to-background/50'
        }`} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          {logoError ? (
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-orbitron font-bold">
              <span className="gradient-text">{t('title')}</span>
            </h1>
          ) : (
            <div className="relative w-64 h-32 md:w-96 md:h-48 lg:w-[500px] lg:h-[250px]">
              <Image
                src="/logo-hero.png"
                alt="PadelO₂"
                fill
                className="object-contain"
                priority
                onError={() => setLogoError(true)}
              />
            </div>
          )}
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-text-secondary font-poppins mb-8 max-w-2xl mx-auto"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link 
            href={`/${locale}/tournaments`}
            className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('ctaPrimary')}
          </Link>
          <Link 
            href={`/${locale}/about`}
            className="px-8 py-3 border-2 border-primary text-primary font-orbitron font-semibold rounded-lg hover:bg-primary/10 transition-colors"
          >
            {t('ctaSecondary')}
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <svg
          className="w-6 h-6 text-primary animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </motion.div>
    </section>
  );
};

export default Hero;

