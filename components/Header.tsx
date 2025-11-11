'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSelector from './LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { key: 'home', href: `/${locale}` },
    { key: 'tournaments', href: `/${locale}/tournaments` },
    { key: 'academy', href: `/${locale}/academy` },
    { key: 'machines', href: `/${locale}/machines` },
    { key: 'courts', href: `/${locale}/courts` },
    { key: 'investments', href: `/${locale}/investments` },
    { key: 'partners', href: `/${locale}/partners` },
    { key: 'about', href: `/${locale}/about` },
    { key: 'contact', href: `/${locale}/contact` },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
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

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-sm font-poppins transition-colors hover:text-primary ${
                pathname === item.href ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
          <LanguageSelector />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-text"
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
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background-secondary border-t border-gray-800"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
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
              <div className="pt-4 border-t border-gray-800">
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

