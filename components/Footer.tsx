'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const [logoError, setLogoError] = useState(false);
  const t = useTranslations('Footer');
  const locale = useLocale();

  return (
    <footer className="bg-background-secondary border-t border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {logoError ? (
              <h3 className="text-xl font-orbitron font-bold gradient-text mb-4">
                PadelO<sub className="text-sm">₂</sub>
              </h3>
            ) : (
              <div className="relative w-40 h-12 mb-4">
                <Image
                  src="/logo-footer.png"
                  alt="PadelO₂"
                  fill
                  className="object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <p className="text-text-secondary text-sm font-poppins">
              {t('tagline')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-orbitron font-semibold mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-sm font-poppins text-text-secondary">
              <li>
                <Link href={`/${locale}/tournaments`} className="hover:text-primary transition-colors">
                  {t('tournaments')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/academy`} className="hover:text-primary transition-colors">
                  {t('academy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/investments`} className="hover:text-primary transition-colors">
                  {t('investments')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-orbitron font-semibold mb-4">{t('company')}</h4>
            <ul className="space-y-2 text-sm font-poppins text-text-secondary">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-primary transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/partners`} className="hover:text-primary transition-colors">
                  {t('partners')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-primary transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-orbitron font-semibold mb-4">{t('legal')}</h4>
            <p className="text-text-secondary text-xs font-poppins">
              © {new Date().getFullYear()} Kaus Australis LTD
            </p>
            <p className="text-text-secondary text-xs font-poppins mt-2">
              {t('rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

