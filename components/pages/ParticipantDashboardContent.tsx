'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tournament {
  id: number;
  tournamentId: number;
  tournamentName: string;
  categories: string[];
  confirmed: boolean;
  confirmedAt: string | null;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  tournamentStatus: string;
  location: string | null;
}

export function ParticipantDashboardContent() {
  const t = useTranslations('ParticipantDashboard');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    confirmedTournaments: 0,
    upcomingTournaments: 0,
    completedTournaments: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchTournaments(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const fetchTournaments = async (token: string) => {
    try {
      const response = await fetch('/api/user/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
        
        // Calculate stats
        const now = new Date();
        const total = data.tournaments?.length || 0;
        const confirmed = data.tournaments?.filter((t: Tournament) => t.confirmed).length || 0;
        const upcoming = data.tournaments?.filter((t: Tournament) => {
          if (!t.startDate) return false;
          return new Date(t.startDate) > now;
        }).length || 0;
        const completed = data.tournaments?.filter((t: Tournament) => {
          if (!t.endDate) return false;
          return new Date(t.endDate) < now;
        }).length || 0;

        setStats({
          totalTournaments: total,
          confirmedTournaments: confirmed,
          upcomingTournaments: upcoming,
          completedTournaments: completed,
        });
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        router.push(`/${locale}/login`);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      male1: t('categories.male1'),
      male2: t('categories.male2'),
      female1: t('categories.female1'),
      female2: t('categories.female2'),
      mixed1: t('categories.mixed1'),
      mixed2: t('categories.mixed2'),
    };
    return categoryMap[category] || category;
  };

  const getStatusBadge = (tournament: Tournament) => {
    if (!tournament.confirmed) {
      return (
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-poppins">
          {t('status.pending')}
        </span>
      );
    }
    
    const now = new Date();
    if (tournament.endDate && new Date(tournament.endDate) < now) {
      return (
        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-poppins">
          {t('status.completed')}
        </span>
      );
    }
    
    if (tournament.startDate && new Date(tournament.startDate) > now) {
      return (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-poppins">
          {t('status.upcoming')}
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-poppins">
        {t('status.inProgress')}
      </span>
    );
  };

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
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/profile`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors mb-4 inline-block"
          >
            ← {t('backToProfile')}
          </Link>
          <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
            {t('title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins">
            {t('description')}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h3 className="text-sm font-poppins text-text-secondary mb-2">{t('stats.totalTournaments')}</h3>
            <p className="text-3xl font-poppins font-bold text-primary">{stats.totalTournaments}</p>
          </div>
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h3 className="text-sm font-poppins text-text-secondary mb-2">{t('stats.confirmed')}</h3>
            <p className="text-3xl font-poppins font-bold text-green-400">{stats.confirmedTournaments}</p>
          </div>
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h3 className="text-sm font-poppins text-text-secondary mb-2">{t('stats.upcoming')}</h3>
            <p className="text-3xl font-poppins font-bold text-blue-400">{stats.upcomingTournaments}</p>
          </div>
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h3 className="text-sm font-poppins text-text-secondary mb-2">{t('stats.completed')}</h3>
            <p className="text-3xl font-poppins font-bold text-gray-400">{stats.completedTournaments}</p>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-poppins font-bold text-text">{t('myTournaments')}</h2>
          </div>

          {tournaments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-text-secondary font-poppins mb-6">{t('noTournaments')}</p>
              <Link
                href={`/${locale}/tournaments`}
                className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block"
              >
                {t('registerForTournament')}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="p-6 hover:bg-background transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-poppins font-bold text-text">
                          {tournament.tournamentName}
                        </h3>
                        {getStatusBadge(tournament)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-text-secondary font-poppins">
                        {tournament.location && (
                          <p>📍 {tournament.location}</p>
                        )}
                        <p>
                          {t('dates')}: {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </p>
                        <p>
                          {t('categories')}: {tournament.categories.map(getCategoryLabel).join(', ')}
                        </p>
                        {tournament.confirmedAt && (
                          <p className="text-green-400">
                            ✓ {t('confirmedAt')}: {formatDate(tournament.confirmedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Placeholder sections for future features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h3 className="text-xl font-poppins font-bold text-text mb-4">{t('statistics.title')}</h3>
            <p className="text-text-secondary font-poppins">{t('statistics.comingSoon')}</p>
          </div>
          
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h3 className="text-xl font-poppins font-bold text-text mb-4">{t('prizes.title')}</h3>
            <p className="text-text-secondary font-poppins">{t('prizes.comingSoon')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

