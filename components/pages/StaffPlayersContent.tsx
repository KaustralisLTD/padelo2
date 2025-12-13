'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffPlayersContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      try {
        const response = await fetch('/api/tournaments', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTournaments(data.tournaments || []);
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [locale, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/${locale}/admin/dashboard`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {t('backToDashboard') || 'Back to Dashboard'}
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('staff.editPlayers')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins mb-8">
          {t('staff.editPlayersDesc')}
        </p>

        {tournaments.length === 0 ? (
          <div className="bg-background-secondary p-12 rounded-lg border border-border text-center">
            <p className="text-text-secondary font-poppins text-lg">
              {t('staff.noTournaments') || 'No tournaments available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/${locale}/admin/tournaments/${tournament.id}/participants`}
                className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
              >
                <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                  {tournament.name}
                </h3>
                <p className="text-text-secondary font-poppins text-sm">
                  {new Date(tournament.startDate).toLocaleDateString(locale)} - {new Date(tournament.endDate).toLocaleDateString(locale)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

