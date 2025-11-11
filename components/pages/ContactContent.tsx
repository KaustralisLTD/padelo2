'use client';

import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function ContactContent() {
  const t = useTranslations('Contact');

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center title-with-subscript">
        {t('title')}
      </h1>
      <p className="text-text-secondary font-poppins text-lg text-center max-w-2xl mx-auto mb-12">
        {t('description')}
      </p>

      <ContactForm email="contact@padelo2.com" />
    </div>
  );
}

