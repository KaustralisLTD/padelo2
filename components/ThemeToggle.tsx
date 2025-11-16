'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('Common');

  return (
    <motion.button
      onClick={toggleTheme}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-full bg-background-secondary border border-border hover:border-primary transition-all shadow-lg hover:shadow-xl"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={theme === 'dark' ? t('darkMode') : t('lightMode')}
    >
      {theme === 'dark' ? (
        <>
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="hidden md:inline text-xs font-poppins text-text-secondary whitespace-nowrap">
            {t('darkMode')}
          </span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <span className="hidden md:inline text-xs font-poppins text-text-secondary whitespace-nowrap">
            {t('lightMode')}
          </span>
        </>
      )}
    </motion.button>
  );
};

export default ThemeToggle;

