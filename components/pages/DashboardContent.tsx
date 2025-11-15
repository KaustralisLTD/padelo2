'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardContent() {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get token from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || localStorage.getItem('tournament_token');
    
    if (token) {
      localStorage.setItem('tournament_token', token);
      fetchRegistration(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRegistration = async (token: string) => {
    try {
      const response = await fetch(`/api/tournament/register?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        if (data.registration) {
          setRegistration(data.registration);
        } else {
          setLoading(false);
          return;
        }
      } else {
        // Token might be invalid or expired
        localStorage.removeItem('tournament_token');
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-text-secondary font-poppins mb-6">{t('dashboard.noRegistration')}</p>
        <Link
          href={`/${locale}/tournaments`}
          className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block"
        >
          {t('dashboard.registerNow')}
        </Link>
      </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-8 gradient-text text-center">
          {t('dashboard.title')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Registration Info */}
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.registrationInfo')}
            </h2>
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('form.firstName')}:</strong> {registration.firstName}</p>
              <p><strong className="text-text">{t('form.lastName')}:</strong> {registration.lastName}</p>
              <p><strong className="text-text">{t('form.email')}:</strong> {registration.email}</p>
              <p><strong className="text-text">{t('form.phone')}:</strong> {registration.phone}</p>
              {registration.telegram && (
                <p><strong className="text-text">{t('form.telegram')}:</strong> {registration.telegram}</p>
              )}
            </div>
          </div>

          {/* Tournament Info */}
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.tournamentInfo')}
            </h2>
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('dashboard.tournament')}:</strong> {registration.tournamentName}</p>
              <p><strong className="text-text">{t('form.categories')}:</strong> {
                registration.categories.map((cat: string) => t(`categories.${cat}`)).join(', ')
              }</p>
              <p><strong className="text-text">{t('form.tshirtSize')}:</strong> {registration.tshirtSize}</p>
              <p><strong className="text-text">{t('dashboard.status')}:</strong> {
                registration.confirmed ? (
                  <span className="text-green-400">{t('dashboard.confirmed')}</span>
                ) : (
                  <span className="text-yellow-400">{t('dashboard.pending')}</span>
                )
              }</p>
            </div>
          </div>
        </div>

        {/* Partner Info */}
        {registration.partner && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.partnerInfo')}
            </h2>
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
                  <Image
                    src={registration.partner.photoData}
                    alt={registration.partner.name}
                    width={220}
                    height={220}
                    className="rounded-lg border border-gray-700 object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Upload */}
        <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
          <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
            {t('dashboard.photoUpload')}
          </h2>
          <p className="text-text-secondary font-poppins text-sm mb-4">
            {t('dashboard.photoInstructions')}
          </p>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer inline-block px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('dashboard.uploadPhoto')}
            </label>
            <p className="text-text-secondary font-poppins text-xs mt-2">
              {t('form.photoInstructions.filenameExample')}
            </p>
          </div>
        </div>

        {/* Message */}
        {registration.message && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('form.message')}
            </h2>
            <p className="text-text-secondary font-poppins">{registration.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

