'use client';

import { useState, useEffect } from 'react';
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
      <nav className="container mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          {logoError ? (
            <span className="text-4xl font-orbitron font-bold gradient-text">
              PadelO<sub className="text-lg">₂</sub>
            </span>
          ) : (
            <div className="relative w-64 h-16">
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

          <div className="flex items-center space-x-8">
          {authenticatedNavItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-sm font-poppins transition-colors hover:text-primary ${
                pathname === item.href 
                  ? 'text-primary' 
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
            className={`text-sm font-poppins transition-colors hover:text-primary ${
              theme === 'light'
                ? 'text-white/90'
                : 'text-text-secondary'
            }`}
          >
            {isAuthenticated ? t('account') : t('login')}
          </Link>
          <LanguageSelector />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between">
          {/* Mobile Menu Button (слева) */}
        <button
            className={`transition-colors ${
            theme === 'light'
              ? 'text-white'
              : 'text-text'
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

          {/* Logo (по центру) */}
          <Link href={`/${locale}`} className="flex flex-col items-center">
            {logoError ? (
              <span className="text-3xl font-orbitron font-bold gradient-text">
                PadelO<sub className="text-base">₂</sub>
              </span>
            ) : (
              <div className="relative w-48 h-12">
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
            <span className="text-xs font-poppins font-medium gradient-text mt-1">
              {tFooter('tagline')}
            </span>
          </Link>

          {/* Language Selector (справа) */}
          <div className="flex items-center">
            <LanguageSelector />
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background-secondary border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {authenticatedNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-sm font-poppins transition-colors hover:text-primary ${
                    pathname === item.href ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {t(item.key)}
                </Link>
              ))}
              <Link
                href={isAuthenticated ? `/${locale}/profile` : `/${locale}/login`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-sm font-poppins transition-colors hover:text-primary ${
                  (pathname === `/${locale}/login` || pathname === `/${locale}/profile`) ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {isAuthenticated ? t('account') : t('login')}
              </Link>
              <div className="pt-4 border-t border-border">
                <LanguageSelector />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;

