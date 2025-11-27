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

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  ua: '🇺🇦',
  ru: '🇺🇦',
  ca: '🏴',
  zh: '🇨🇳',
  nl: '🇳🇱',
  da: '🇩🇰',
  sv: '🇸🇪',
  de: '🇩🇪',
  no: '🇳🇴',
  it: '🇮🇹',
  fr: '🇫🇷',
  ar: '🇦🇪',
};

interface LanguageSelectorProps {
  variant?: 'header' | 'menu';
}

const LanguageSelector = ({ variant = 'header' }: LanguageSelectorProps) => {
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
        className={`flex items-center px-3 py-2 text-sm font-poppins transition-colors border rounded-lg hover:border-primary ${
          locale === 'ar' ? 'flex-row-reverse gap-2' : 'gap-2'
        } ${
          theme === 'light'
            ? variant === 'menu'
              ? 'text-gray-800 hover:text-primary border-gray-300 hover:border-primary bg-white'
              : 'text-white/90 hover:text-primary border-white/30 hover:border-primary bg-white/10 backdrop-blur-sm'
            : 'text-text-secondary hover:text-primary border-border'
        }`}
      >
        <span className="text-lg leading-none">{languageFlags[locale] || '🌐'}</span>
        <span className="text-xs font-semibold tracking-wider">
          {languageNames[locale] || locale.toUpperCase()}
        </span>
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
        <div 
          className={`absolute top-full mt-2 w-40 border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary ${
            locale === 'ar'
              ? 'left-0 ml-2' // Для RTL языков позиционируем слева с отступом
              : 'right-0' // Для LTR языков позиционируем справа
          } ${
            theme === 'light'
              ? variant === 'menu'
                ? 'bg-white border-gray-200 shadow-lg'
                : 'bg-white/95 backdrop-blur-md border-white/30'
              : 'bg-background-secondary border-border scrollbar-track-background-secondary'
          }`}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: ${theme === 'light' ? 'rgba(255, 255, 255, 0.1)' : 'var(--background-secondary)'};
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
              className={`w-full px-4 py-2 text-sm font-poppins transition-colors ${
                locale === 'ar' ? 'text-right' : 'text-left'
              } ${ 
                locale === loc
                  ? `text-primary ${theme === 'light' ? 'bg-primary/15 font-semibold' : 'bg-background'}`
                  : theme === 'light'
                    ? 'text-gray-800 hover:text-primary hover:bg-gray-50'
                    : 'text-text-secondary hover:bg-background'
              }`}
            >
              <span className={`inline-flex items-center ${locale === 'ar' ? 'flex-row-reverse gap-2' : 'gap-2'}`}>
                <span className="text-lg leading-none">{languageFlags[loc] || '🌐'}</span>
                <span>{languageNames[loc]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;


