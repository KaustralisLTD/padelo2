'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Match {
  id: number;
  tournamentName: string;
  category: string;
  groupName: string;
  pair1Players: string[];
  pair2Players: string[];
  pair1Games: number;
  pair2Games: number;
  pair1Set1?: number;
  pair1Set2?: number;
  pair1Set3?: number;
  pair2Set1?: number;
  pair2Set2?: number;
  pair2Set3?: number;
  winnerPairId: number;
  matchDate: string | null;
  courtNumber: number | null;
}

interface Statistics {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
  totalGamesWon: number;
  totalGamesLost: number;
}

export function ParticipantResultsContent() {
  const t = useTranslations('ParticipantResults');
  const locale = useLocale();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetch('/api/participant/matches', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMatches(data.matches || []);
          setStatistics(data.statistics || null);
        }
      })
      .catch((err) => {
        console.error('Error fetching matches:', err);
        setError('Failed to load matches');
      })
      .finally(() => setLoading(false));
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-400 font-poppins mb-4">{error}</p>
          <Link
            href={`/${locale}/dashboard`}
            className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block"
          >
            {t('backToDashboard')}
          </Link>
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
          <Link
            href={`/${locale}/dashboard`}
            className="px-6 py-3 bg-background-secondary border border-border text-text font-orbitron font-semibold rounded-lg hover:border-primary transition-colors"
          >
            {t('backToDashboard')}
          </Link>
        </div>

        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <div className="text-3xl font-bold text-primary mb-2">{statistics.totalMatches}</div>
              <div className="text-text-secondary font-poppins text-sm">{t('statistics.totalMatches')}</div>
            </div>
            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <div className="text-3xl font-bold text-green-400 mb-2">{statistics.wins}</div>
              <div className="text-text-secondary font-poppins text-sm">{t('statistics.wins')}</div>
            </div>
            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <div className="text-3xl font-bold text-red-400 mb-2">{statistics.losses}</div>
              <div className="text-text-secondary font-poppins text-sm">{t('statistics.losses')}</div>
            </div>
            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <div className="text-3xl font-bold text-primary mb-2">{statistics.winRate}%</div>
              <div className="text-text-secondary font-poppins text-sm">{t('statistics.winRate')}</div>
            </div>
            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <div className="text-3xl font-bold text-primary mb-2">
                {statistics.totalGamesWon}:{statistics.totalGamesLost}
              </div>
              <div className="text-text-secondary font-poppins text-sm">{t('statistics.games')}</div>
            </div>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-background-secondary p-8 rounded-lg border border-border text-center">
            <p className="text-text-secondary font-poppins">{t('noMatches')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const hasSets = match.pair1Set1 !== null && match.pair1Set1 !== undefined;
              // Определяем, в какой паре находится пользователь (проверяем по наличию winnerPairId)
              const userWon = match.winnerPairId === match.pair1Id || match.winnerPairId === match.pair2Id;
              
              return (
                <div
                  key={match.id}
                  className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-orbitron font-semibold text-text">
                          {match.tournamentName}
                        </h3>
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-poppins rounded">
                          {match.category}
                        </span>
                        {match.groupName && (
                          <span className="px-2 py-1 bg-background text-text-secondary text-xs font-poppins rounded">
                            {match.groupName}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className={`p-4 rounded-lg ${match.winnerPairId === match.pair1Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-background border border-border'}`}>
                          <div className="font-poppins text-sm text-text-secondary mb-1">{t('pair1')}</div>
                          <div className="font-poppins text-text">
                            {match.pair1Players.join(' / ')}
                          </div>
                          {hasSets ? (
                            <div className="mt-2 text-lg font-bold text-text">
                              {match.pair1Set1} - {match.pair2Set1}
                              {match.pair1Set2 !== null && ` / ${match.pair1Set2} - ${match.pair2Set2}`}
                              {match.pair1Set3 !== null && ` / ${match.pair1Set3} - ${match.pair2Set3}`}
                            </div>
                          ) : (
                            <div className="mt-2 text-lg font-bold text-text">
                              {match.pair1Games} - {match.pair2Games}
                            </div>
                          )}
                        </div>
                        
                        <div className={`p-4 rounded-lg ${match.winnerPairId === match.pair2Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-background border border-border'}`}>
                          <div className="font-poppins text-sm text-text-secondary mb-1">{t('pair2')}</div>
                          <div className="font-poppins text-text">
                            {match.pair2Players.join(' / ')}
                          </div>
                          {hasSets ? (
                            <div className="mt-2 text-lg font-bold text-text">
                              {match.pair2Set1} - {match.pair1Set1}
                              {match.pair2Set2 !== null && ` / ${match.pair2Set2} - ${match.pair1Set2}`}
                              {match.pair2Set3 !== null && ` / ${match.pair2Set3} - ${match.pair1Set3}`}
                            </div>
                          ) : (
                            <div className="mt-2 text-lg font-bold text-text">
                              {match.pair2Games} - {match.pair1Games}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {match.matchDate && (
                        <div className="text-text-secondary font-poppins text-sm mb-2">
                          {new Date(match.matchDate).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                      {match.courtNumber && (
                        <div className="text-text-secondary font-poppins text-sm">
                          {t('court')} {match.courtNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

