'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('Common');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const x = useMotionValue(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Определяем, мобильное ли устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Загружаем состояние из localStorage при монтировании (только для десктопа)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem('themeToggleCollapsed');
      if (savedState === 'true') {
        setIsCollapsed(true);
        x.set(100); // Смещаем вправо
      }
    }
  }, [x, isMobile]);

  // Сохраняем состояние в localStorage (только для десктопа)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('themeToggleCollapsed', isCollapsed.toString());
    }
  }, [isCollapsed, isMobile]);

  // Ограничиваем движение только вправо
  const constrainedX = useTransform(x, (value) => {
    return Math.max(0, Math.min(100, value));
  });

  const handleDragStart = () => {
    setIsDragging(true);
    setHasDragged(false);
    // Очищаем таймаут клика если был
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  };

  const handleDrag = () => {
    if (x.get() > 5) {
      setHasDragged(true);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Если перетянули больше чем на 50px вправо - скрываем
    if (x.get() > 50) {
      setIsCollapsed(true);
      animate(x, 100, { type: 'spring', stiffness: 300, damping: 30 });
    } else {
      // Иначе возвращаем обратно
      setIsCollapsed(false);
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
    // Сбрасываем флаг перетягивания через небольшую задержку
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    // На мобильных всегда только переключаем тему
    if (isMobile) {
      toggleTheme();
      return;
    }

    // На десктопе: если только что перетягивали - игнорируем клик
    if (hasDragged || isDragging) {
      return;
    }

    if (isCollapsed) {
      // Если скрыт - показываем обратно
      setIsCollapsed(false);
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    } else {
      // Если виден - переключаем тему
      toggleTheme();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(true);
    animate(x, 100, { type: 'spring', stiffness: 300, damping: 30 });
  };

  return (
    <>
      {/* Видимая часть когда свернуто - показывает иконку темы (только на десктопе) */}
      {isCollapsed && !isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClick}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 cursor-pointer flex items-center justify-center"
          style={{ 
            background: 'transparent',
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background-secondary border border-border hover:border-primary transition-all shadow-lg flex items-center justify-center">
            {theme === 'dark' ? (
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
            ) : (
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
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        drag={isMobile ? false : "x"}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ 
          x: isMobile ? 0 : constrainedX,
          right: isMobile ? 24 : (isCollapsed ? -50 : 24),
        }}
        className={`fixed top-1/2 -translate-y-1/2 z-50 ${
          isMobile ? 'cursor-pointer' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')
        }`}
      >
        <motion.button
          onClick={handleClick}
          className={`flex flex-col items-center gap-1 md:gap-2 ${
            isMobile 
              ? 'p-2 w-10 h-10' 
              : `p-2 md:p-3 ${isCollapsed ? 'pr-3' : ''}`
          } rounded-full bg-background-secondary border border-border hover:border-primary transition-all shadow-lg hover:shadow-xl relative`}
          whileHover={!isDragging && !isMobile ? { scale: 1.1 } : {}}
          whileTap={!isDragging ? { scale: 0.9 } : {}}
          aria-label={theme === 'dark' ? t('darkMode') : t('lightMode')}
        >
          {/* Крестик для сворачивания - только на десктопе */}
          {!isCollapsed && !isMobile && (
            <button
              onClick={handleCloseClick}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/80 hover:bg-primary flex items-center justify-center transition-colors z-10"
              aria-label="Collapse"
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          
          {/* Иконка темы */}
          {theme === 'dark' ? (
            <>
              <svg
                className={`${isMobile ? 'w-5 h-5' : (isCollapsed ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6')} text-primary`}
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
              {!isCollapsed && !isMobile && (
                <span className="hidden md:inline text-xs font-poppins text-text-secondary whitespace-nowrap">
                  {t('darkMode')}
                </span>
              )}
            </>
          ) : (
            <>
              <svg
                className={`${isMobile ? 'w-5 h-5' : (isCollapsed ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6')} text-primary`}
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
              {!isCollapsed && !isMobile && (
                <span className="hidden md:inline text-xs font-poppins text-text-secondary whitespace-nowrap">
                  {t('lightMode')}
                </span>
              )}
            </>
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

export default ThemeToggle;

