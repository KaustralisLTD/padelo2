'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('Common');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  
  // Загружаем состояние из localStorage при монтировании
  useEffect(() => {
    const savedState = localStorage.getItem('themeToggleCollapsed');
    if (savedState === 'true') {
      setIsCollapsed(true);
      x.set(100); // Смещаем вправо
    }
  }, [x]);

  // Сохраняем состояние в localStorage
  useEffect(() => {
    localStorage.setItem('themeToggleCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Ограничиваем движение только вправо
  const constrainedX = useTransform(x, (value) => {
    return Math.max(0, Math.min(100, value));
  });

  const handleDragEnd = () => {
    setIsDragging(false);
    // Если перетянули больше чем на 50px вправо - скрываем
    if (x.get() > 50) {
      setIsCollapsed(true);
      x.set(100);
    } else {
      // Иначе возвращаем обратно
      setIsCollapsed(false);
      x.set(0);
    }
  };

  const handleClick = () => {
    if (isCollapsed) {
      // Если скрыт - показываем обратно
      setIsCollapsed(false);
      x.set(0);
    } else {
      // Если виден - переключаем тему
      toggleTheme();
    }
  };

  return (
    <>
      {/* Скрытая часть для клика, когда переключатель скрыт */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClick}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-8 h-16 md:h-20 cursor-pointer"
          style={{ 
            background: 'transparent',
          }}
        />
      )}

      <motion.button
        onClick={handleClick}
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ 
          x: constrainedX,
          right: isCollapsed ? -60 : 24,
        }}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-full bg-background-secondary border border-border hover:border-primary transition-all shadow-lg hover:shadow-xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        whileHover={!isDragging ? { scale: 1.1 } : {}}
        whileTap={!isDragging ? { scale: 0.9 } : {}}
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
    </>
  );
};

export default ThemeToggle;

