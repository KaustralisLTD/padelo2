'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ConfirmationContentProps {
  token: string;
}

export default function ConfirmationContent({ token }: ConfirmationContentProps) {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [registration, setRegistration] = useState<any>(null);

  useEffect(() => {
    const confirmRegistration = async () => {
      try {
        // First, get the registration
        const response = await fetch(`/api/tournament/register?token=${token}`);
        
        if (response.ok) {
          const data = await response.json();
          setRegistration(data.registration);
          
          // If not already confirmed, confirm the registration
          if (!data.registration.confirmed) {
            const confirmResponse = await fetch('/api/tournament/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
            
            if (confirmResponse.ok) {
              setStatus('success');
              // Update registration status
              setRegistration({ ...data.registration, confirmed: true });
            } else {
              setStatus('error');
            }
          } else {
            // Already confirmed
            setStatus('success');
          }
        } else {
          // Если регистрация не найдена, проверяем детали ошибки
          const errorData = await response.json().catch(() => ({}));
          console.error('Registration not found:', errorData);
          setStatus('error');
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
      }
    };

    if (token) {
      confirmRegistration();
    } else {
      setStatus('error');
    }
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('confirmation.loading')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-6 bg-red-500/20 border border-red-500 rounded-lg mb-6">
            <p className="text-red-400 font-poppins">{t('confirmation.error')}</p>
          </div>
          <Link
            href={`/${locale}/tournaments`}
            className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block"
          >
            {t('confirmation.backToTournaments')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-4 gradient-text">
            {t('confirmation.title')}
          </h1>
          <p className="text-text-secondary font-poppins text-lg mb-6">
            {t('confirmation.success')}
          </p>
        </div>

        <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-6">
          <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
            {t('confirmation.registrationDetails')}
          </h2>
          {registration && (
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('form.firstName')}:</strong> {registration.firstName}</p>
              <p><strong className="text-text">{t('form.lastName')}:</strong> {registration.lastName}</p>
              <p><strong className="text-text">{t('form.email')}:</strong> {registration.email}</p>
              {registration.telegram && (
                <p><strong className="text-text">{t('form.telegram')}:</strong> {registration.telegram}</p>
              )}
              <p><strong className="text-text">{t('form.phone')}:</strong> {registration.phone}</p>
              <p><strong className="text-text">{t('form.categories')}:</strong> {
                registration.categories.map((cat: string) => t(`categories.${cat}`)).join(', ')
              }</p>
              <p><strong className="text-text">{t('form.tshirtSize')}:</strong> {registration.tshirtSize}</p>
              {registration.message && (
                <p><strong className="text-text">{t('form.message')}:</strong> {registration.message}</p>
              )}
            </div>
          )}
        </div>

        {registration?.partner && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-6">
            <h3 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.partnerInfo')}
            </h3>
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('form.partnerName')}:</strong> {registration.partner.name}</p>
              <p><strong className="text-text">{t('form.partnerEmail')}:</strong> {registration.partner.email}</p>
              <p><strong className="text-text">{t('form.partnerPhone')}:</strong> {registration.partner.phone}</p>
              <p><strong className="text-text">{t('form.partnerTshirtSize')}:</strong> {registration.partner.tshirtSize}</p>
              {registration.partner.photoName && (
                <p><strong className="text-text">{t('form.partnerPhoto')}:</strong> {registration.partner.photoName}</p>
              )}
              {registration.partner.photoData && (
                <div className="mt-4">
                  <p className="text-sm text-text-secondary mb-2">{t('form.partnerPhoto')}</p>
                  <img
                    src={registration.partner.photoData}
                    alt={registration.partner.name}
                    className="w-full max-w-xs rounded-lg border border-gray-700"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href={`/${locale}/tournament/dashboard?token=${token}`}
            className="px-8 py-4 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block text-lg"
          >
            {t('confirmation.goToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}

