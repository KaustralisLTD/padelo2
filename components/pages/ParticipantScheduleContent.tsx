'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ScheduleItem {
  id: number;
  type: 'court' | 'training' | 'ai_training' | 'tournament';
  title: string;
  date: string;
  time: string;
  duration?: number;
  court?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export function ParticipantScheduleContent() {
  const t = useTranslations('ParticipantSchedule');
  const locale = useLocale();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // TODO: Заменить на реальный API endpoint
    // fetch('/api/participant/schedule', {
    //   headers: { 'Authorization': `Bearer ${token}` },
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (data.error) {
    //       setError(data.error);
    //     } else {
    //       setSchedule(data.schedule || []);
    //     }
    //   })
    //   .catch((err) => {
    //     console.error('Error fetching schedule:', err);
    //     setError('Failed to load schedule');
    //   })
    //   .finally(() => setLoading(false));
    
    // Временные данные для демонстрации
    setSchedule([]);
    setLoading(false);
  }, [locale, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold gradient-text">
            {t('title')}
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('createBooking')}
            </button>
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-3 bg-background-secondary border border-border text-text font-orbitron font-semibold rounded-lg hover:border-primary transition-colors"
            >
              {t('backToDashboard')}
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-poppins">{error}</p>
          </div>
        )}

        {schedule.length === 0 ? (
          <div className="bg-background-secondary p-8 rounded-lg border border-border text-center">
            <p className="text-text-secondary font-poppins mb-4">{t('noBookings')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('createFirstBooking')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedule.map((item) => (
              <div
                key={item.id}
                className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-poppins rounded ${
                        item.type === 'court' ? 'bg-blue-500/20 text-blue-400' :
                        item.type === 'training' ? 'bg-green-500/20 text-green-400' :
                        item.type === 'ai_training' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {t(`types.${item.type}`)}
                      </span>
                      <h3 className="text-xl font-orbitron font-semibold text-text">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-text-secondary font-poppins text-sm">
                      {new Date(item.date).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} {item.time}
                      {item.duration && ` • ${item.duration} ${t('minutes')}`}
                      {item.court && ` • ${t('court')} ${item.court}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-poppins rounded ${
                      item.status === 'upcoming' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {t(`status.${item.status}`)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-md w-full">
              <h2 className="text-2xl font-orbitron font-semibold mb-4 text-text">
                {t('createBooking')}
              </h2>
              <p className="text-text-secondary font-poppins mb-4">
                {t('comingSoon')}
              </p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full px-6 py-3 bg-background border border-border text-text font-orbitron font-semibold rounded-lg hover:border-primary transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

