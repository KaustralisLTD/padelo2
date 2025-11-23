'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import LanguageSelector from './LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [menuItemsOverflow, setMenuItemsOverflow] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const t = useTranslations('Navigation');
  const tFooter = useTranslations('Footer');
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Проверка, помещается ли меню на экране
  useEffect(() => {
    const checkMenuOverflow = () => {
      if (navRef.current && window.innerWidth >= 1024) {
        const nav = navRef.current;
        const navItems = nav.querySelector('.nav-items-container') as HTMLElement;
        const navWidth = nav.offsetWidth;
        const itemsWidth = navItems?.offsetWidth || 0;
        const logoWidth = nav.querySelector('.logo-container')?.clientWidth || 0;
        const availableWidth = navWidth - logoWidth - 200; // 200px для отступов и других элементов
        
        setMenuItemsOverflow(itemsWidth > availableWidth);
        setShowMobileMenu(itemsWidth > availableWidth);
      } else {
        setShowMobileMenu(window.innerWidth < 1024);
      }
    };

    checkMenuOverflow();
    window.addEventListener('resize', checkMenuOverflow);
    return () => window.removeEventListener('resize', checkMenuOverflow);
  }, [isAuthenticated, locale]);

  // Function to check authentication
  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/auth/login', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setIsAuthenticated(!!data.session);
        })
        .catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Check authentication on mount and when pathname changes
    checkAuth();
  }, [pathname]);

  // Listen for storage changes (login/logout from other tabs or after redirect)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        checkAuth();
      }
    };

    // Listen for custom event when auth_token is set (same tab)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const navItems = [
    { key: 'about', href: `/${locale}/about` },
    { key: 'academy', href: `/${locale}/academy` },
    { key: 'machines', href: `/${locale}/machines` },
    { key: 'tournaments', href: `/${locale}/tournaments` },
    { key: 'merchandise', href: `/${locale}/merchandise` },
    { key: 'courts', href: `/${locale}/courts` },
    { key: 'partners', href: `/${locale}/partners` },
    { key: 'investments', href: `/${locale}/investments` },
    { key: 'contact', href: `/${locale}/contact` },
  ];

  // Добавляем Dashboard первым в меню для залогиненных пользователей
  const authenticatedNavItems = isAuthenticated 
    ? [{ key: 'dashboard', href: `/${locale}/dashboard` }, ...navItems]
    : navItems;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0E0E10]/95 backdrop-blur-md shadow-lg'
          : theme === 'light'
            ? 'bg-[#0E0E10]/95 backdrop-blur-md'
            : 'bg-transparent'
      }`}
    >
      <nav ref={navRef} className="container mx-auto px-4 py-4">
        {/* Desktop Navigation - показывается на lg+ и если меню помещается */}
        <div className={`${showMobileMenu ? 'hidden' : 'hidden lg:flex'} items-center justify-between`}>
          <Link href={`/${locale}`} className="logo-container flex items-center space-x-2 flex-shrink-0">
            {logoError ? (
              <span className="text-2xl xl:text-4xl font-orbitron font-bold gradient-text">
                PadelO<sub className="text-base xl:text-lg">₂</sub>
              </span>
            ) : (
              <div className="relative w-48 xl:w-64 h-12 xl:h-16">
                <Image
                  src="/logo-header.png"
                  alt="PadelO₂"
                  fill
                  className="object-contain"
                  priority
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
          </Link>

          <div className="nav-items-container flex items-center space-x-4 xl:space-x-6 2xl:space-x-8 flex-wrap justify-end">
            {authenticatedNavItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-xs xl:text-sm font-poppins transition-all duration-200 hover:text-primary whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/10 ${
                  pathname === item.href 
                    ? 'text-primary font-semibold' 
                    : theme === 'light'
                      ? 'text-white/90'
                      : 'text-text-secondary'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href={isAuthenticated ? `/${locale}/profile` : `/${locale}/login`}
              className={`text-xs xl:text-sm font-poppins transition-all duration-200 hover:text-primary whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/10 ${
                theme === 'light'
                  ? 'text-white/90'
                  : 'text-text-secondary'
              }`}
            >
              {isAuthenticated ? t('account') : t('login')}
            </Link>
            <div className="flex-shrink-0">
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Navigation - показывается на <lg или когда меню не помещается */}
        <div className={`${showMobileMenu ? 'flex' : 'lg:hidden flex'} items-center justify-between`}>
          {/* Mobile Menu Button (слева) */}
          <button
            className={`transition-all duration-200 p-2 rounded-lg hover:bg-primary/10 active:scale-95 ${
              theme === 'light'
                ? 'text-white'
                : 'text-text'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <motion.svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={isMobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </motion.svg>
          </button>

          {/* Logo (по центру) */}
          <Link 
            href={`/${locale}`} 
            className="flex flex-col items-center flex-1 mx-4"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {logoError ? (
              <span className="text-2xl sm:text-3xl font-orbitron font-bold gradient-text">
                PadelO<sub className="text-base sm:text-lg">₂</sub>
              </span>
            ) : (
              <div className="relative w-40 sm:w-48 h-10 sm:h-12">
                <Image
                  src="/logo-header.png"
                  alt="PadelO₂"
                  fill
                  className="object-contain"
                  priority
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <span className="text-[10px] sm:text-xs font-poppins font-medium gradient-text mt-0.5 sm:mt-1 hidden sm:block">
              {tFooter('tagline')}
            </span>
          </Link>

          {/* Language Selector (справа) */}
          <div className="flex items-center">
            <LanguageSelector />
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Menu - улучшенная версия */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay для закрытия меню */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Меню */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`${showMobileMenu ? 'block' : 'lg:hidden'} fixed top-[73px] left-0 right-0 bottom-0 z-50 bg-background-secondary border-t border-border overflow-y-auto`}
            >
              <div className="container mx-auto px-4 py-6">
                {/* Навигационные пункты */}
                <nav className="space-y-2 mb-6">
                  {authenticatedNavItems.map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-poppins ${
                          pathname === item.href
                            ? 'text-primary bg-primary/10 font-semibold'
                            : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <span className="text-base">{t(item.key)}</span>
                        {pathname === item.href && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="ml-auto w-2 h-2 rounded-full bg-primary"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Account/Login */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: authenticatedNavItems.length * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={isAuthenticated ? `/${locale}/profile` : `/${locale}/login`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-poppins ${
                        (pathname === `/${locale}/login` || pathname === `/${locale}/profile`)
                          ? 'text-primary bg-primary/10 font-semibold'
                          : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className="text-base">{isAuthenticated ? t('account') : t('login')}</span>
                      {(pathname === `/${locale}/login` || pathname === `/${locale}/profile`) && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 rounded-full bg-primary"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                </nav>

                {/* Разделитель */}
                <div className="border-t border-border my-6" />

                {/* Language Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (authenticatedNavItems.length + 1) * 0.05, duration: 0.2 }}
                  className="px-4"
                >
                  <div className="text-sm font-poppins text-text-secondary mb-3">
                    Language
                  </div>
                  <LanguageSelector />
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;

