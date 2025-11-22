'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TournamentConfirmContentProps {
  tournamentId: number;
}

export function TournamentConfirmContent({ tournamentId }: TournamentConfirmContentProps) {
  const t = useTranslations('TournamentConfirm');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('registration');
  
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/tournament/${tournamentId}`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          } : {},
        });
        
        if (response.ok) {
          const data = await response.json();
          setTournament(data);
        }
      } catch (error) {
        console.error('Error fetching tournament:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-poppins font-bold mb-4 gradient-text">{t('tournamentNotFound')}</h1>
          <Link
            href={`/${locale}/tournaments`}
            className="inline-block px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity mt-6"
          >
            {t('backToTournaments')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-poppins font-bold gradient-text mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins">
            {tournament.name}
          </p>
        </div>

        {/* Payment Information */}
        <div className="bg-background-secondary rounded-lg border border-border p-8 mb-8">
          <h2 className="text-2xl font-poppins font-bold text-text mb-6">
            {t('paymentMethods')}
          </h2>
          
          <div className="space-y-6">
            {/* On-site Payment */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                  {t('onSitePayment')}
                </h3>
                <p className="text-text-secondary font-poppins mb-2">
                  {t('onSitePaymentDescription')}
                </p>
                {tournament.locationAddress && (
                  <p className="text-text-secondary font-poppins text-sm">
                    📍 {tournament.locationAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Online Payment */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                  {t('onlinePayment')}
                </h3>
                <p className="text-text-secondary font-poppins mb-2">
                  {t('onlinePaymentDescription')}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-poppins">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('inDevelopment')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-background-secondary rounded-lg border border-border p-8 mb-8">
          <h2 className="text-2xl font-poppins font-bold text-text mb-4">
            {t('contactOrganizers')}
          </h2>
          <p className="text-text-secondary font-poppins mb-4">
            {t('contactDescription')}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('contactUs')}
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/dashboard`}
            className="px-6 py-3 bg-background-secondary border border-border text-text font-poppins font-semibold rounded-lg hover:border-primary transition-colors text-center"
          >
            {t('backToDashboard')}
          </Link>
          <Link
            href={`/${locale}/tournaments`}
            className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
          >
            {t('viewTournaments')}
          </Link>
        </div>
      </div>
    </div>
  );
}

