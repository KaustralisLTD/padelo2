'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { locales } from '@/i18n';

const languageNames: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  ua: 'UA',
  ru: 'RU',
  ca: 'CA',
  zh: 'ZH',
  nl: 'NL',
  da: 'DA',
  sv: 'SV',
  de: 'DE',
  no: 'NO',
  it: 'IT',
  fr: 'FR',
  ar: 'AR',
};

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-poppins transition-colors border rounded-lg hover:border-primary ${
          theme === 'light'
            ? 'text-white/90 hover:text-primary border-white/20 hover:border-primary'
            : 'text-text-secondary hover:text-primary border-border'
        }`}
      >
        <span>{languageNames[locale] || locale.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-background-secondary border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-background-secondary">
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: var(--background-secondary);
            }
            div::-webkit-scrollbar-thumb {
              background: var(--primary);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: var(--accent);
            }
          `}</style>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className={`w-full text-left px-4 py-2 text-sm font-poppins transition-colors hover:bg-background ${
                locale === loc
                  ? 'text-primary bg-background'
                  : 'text-text-secondary'
              }`}
            >
              {languageNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;


