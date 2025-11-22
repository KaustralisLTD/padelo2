'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TournamentScheduleContentProps {
  tournamentId: number;
}

interface Match {
  id: number;
  match_date: string | null;
  court_number: number | null;
  pair1_players: string[];
  pair2_players: string[];
  pair1_games: number | null;
  pair2_games: number | null;
  pair1_set1: number | null;
  pair1_set2: number | null;
  pair1_set3: number | null;
  pair2_set1: number | null;
  pair2_set2: number | null;
  pair2_set3: number | null;
  category: string;
  group_name: string;
  pair1_result_reported_by: string | null;
  pair2_result_reported_by: string | null;
  result_confirmed: boolean;
  pair1_id: number;
  pair2_id: number;
}

function TournamentScheduleContentInner({ tournamentId }: TournamentScheduleContentProps) {
  const t = useTranslations('TournamentSchedule');
  const locale = useLocale();
  const router = useRouter();
  
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState({
    pair1Games: '',
    pair2Games: '',
    pair1Set1: '',
    pair1Set2: '',
    pair1Set3: '',
    pair2Set1: '',
    pair2Set2: '',
    pair2Set3: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, locale, router]);

  const fetchData = async (token: string) => {
    try {
      // Fetch tournament
      const tournamentResponse = await fetch(`/api/tournament/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData);
      }

      // Fetch schedule
      const response = await fetch(`/api/tournament/${tournamentId}/schedule`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getMatchesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return matches.filter(match => {
      if (!match.match_date) return false;
      const matchDate = new Date(match.match_date).toISOString().split('T')[0];
      return matchDate === dateStr;
    });
  };

  const isUserInMatch = (match: Match): boolean => {
    // TODO: Check if current user is in pair1 or pair2
    // This requires getting current user's registration ID
    return true; // Placeholder
  };

  const canSubmitResult = (match: Match): boolean => {
    // User can submit if they are in the match and result is not confirmed
    return isUserInMatch(match) && !match.result_confirmed;
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/match/${selectedMatch.id}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pair1Games: parseInt(resultData.pair1Games) || 0,
          pair2Games: parseInt(resultData.pair2Games) || 0,
          pair1Set1: resultData.pair1Set1 ? parseInt(resultData.pair1Set1) : null,
          pair1Set2: resultData.pair1Set2 ? parseInt(resultData.pair1Set2) : null,
          pair1Set3: resultData.pair1Set3 ? parseInt(resultData.pair1Set3) : null,
          pair2Set1: resultData.pair2Set1 ? parseInt(resultData.pair2Set1) : null,
          pair2Set2: resultData.pair2Set2 ? parseInt(resultData.pair2Set2) : null,
          pair2Set3: resultData.pair2Set3 ? parseInt(resultData.pair2Set3) : null,
        }),
      });

      if (response.ok) {
        setShowResultModal(false);
        setSelectedMatch(null);
        setResultData({
          pair1Games: '',
          pair2Games: '',
          pair1Set1: '',
          pair1Set2: '',
          pair1Set3: '',
          pair2Set1: '',
          pair2Set2: '',
          pair2Set3: '',
        });
        // Refresh matches
        const token = localStorage.getItem('auth_token');
        if (token) {
          fetchData(token);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit result');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      alert('Failed to submit result');
    } finally {
      setSubmitting(false);
    }
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

  const todayMatches = getMatchesForDate(selectedDate);
  const courts = Array.from(new Set(todayMatches.map(m => m.court_number).filter(Boolean))).sort() as number[];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-poppins font-bold gradient-text mb-2">
              {t('title')}
            </h1>
            {tournament && (
              <p className="text-xl text-text-secondary font-poppins">
                {tournament.name}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/dashboard`}
            className="px-6 py-3 bg-background-secondary border border-border text-text font-poppins font-semibold rounded-lg hover:border-primary transition-colors"
          >
            {t('backToDashboard')}
          </Link>
        </div>

        {/* Date Navigation */}
        <div className="bg-background-secondary p-4 rounded-lg border border-border mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-primary/20 text-primary font-poppins font-semibold rounded-lg hover:bg-primary/30 transition-colors"
              >
                {t('today')}
              </button>
              <div className="text-xl font-orbitron font-semibold text-text min-w-[200px] text-center">
                {formatDate(selectedDate)}
              </div>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Matches List */}
        {todayMatches.length === 0 ? (
          <div className="bg-background-secondary rounded-lg border border-border p-12 text-center">
            <p className="text-text-secondary font-poppins text-lg">
              {t('noMatches')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayMatches.map((match) => (
              <div
                key={match.id}
                className="bg-background-secondary rounded-lg border border-border p-6 hover:border-primary transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-poppins font-semibold">
                        {match.category} - {match.group_name}
                      </span>
                      {match.court_number && (
                        <span className="px-3 py-1 bg-background border border-border rounded-full text-xs font-poppins">
                          {t('court')} {match.court_number}
                        </span>
                      )}
                      {match.result_confirmed && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-poppins">
                          {t('confirmed')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-text-secondary font-poppins mb-1">{t('pair1')}</p>
                        <p className="text-lg font-poppins font-semibold text-text">
                          {match.pair1_players.join(' / ')}
                        </p>
                        {match.pair1_games !== null && (
                          <p className="text-sm text-text-secondary font-poppins mt-1">
                            {t('games')}: {match.pair1_games}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary font-poppins mb-1">{t('pair2')}</p>
                        <p className="text-lg font-poppins font-semibold text-text">
                          {match.pair2_players.join(' / ')}
                        </p>
                        {match.pair2_games !== null && (
                          <p className="text-sm text-text-secondary font-poppins mt-1">
                            {t('games')}: {match.pair2_games}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary font-poppins">
                      {t('time')}: {formatTime(match.match_date)}
                    </p>
                  </div>
                  {canSubmitResult(match) && (
                    <button
                      onClick={() => {
                        setSelectedMatch(match);
                        setResultData({
                          pair1Games: match.pair1_games?.toString() || '',
                          pair2Games: match.pair2_games?.toString() || '',
                          pair1Set1: match.pair1_set1?.toString() || '',
                          pair1Set2: match.pair1_set2?.toString() || '',
                          pair1Set3: match.pair1_set3?.toString() || '',
                          pair2Set1: match.pair2_set1?.toString() || '',
                          pair2Set2: match.pair2_set2?.toString() || '',
                          pair2Set3: match.pair2_set3?.toString() || '',
                        });
                        setShowResultModal(true);
                      }}
                      className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {t('submitResult')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result Modal */}
        {showResultModal && selectedMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-poppins font-bold mb-6 text-text">
                {t('submitResult')}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-text-secondary font-poppins mb-2">{t('pair1')}</p>
                  <p className="text-lg font-poppins font-semibold text-text mb-4">
                    {selectedMatch.pair1_players.join(' / ')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-text-secondary font-poppins mb-2">{t('pair2')}</p>
                  <p className="text-lg font-poppins font-semibold text-text mb-4">
                    {selectedMatch.pair2_players.join(' / ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('pair1Games')}
                    </label>
                    <input
                      type="number"
                      value={resultData.pair1Games}
                      onChange={(e) => setResultData({ ...resultData, pair1Games: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('pair2Games')}
                    </label>
                    <input
                      type="number"
                      value={resultData.pair2Games}
                      onChange={(e) => setResultData({ ...resultData, pair2Games: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-poppins text-text-secondary mb-4">{t('setsOptional')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">Set 1</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="P1"
                          value={resultData.pair1Set1}
                          onChange={(e) => setResultData({ ...resultData, pair1Set1: e.target.value })}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          placeholder="P2"
                          value={resultData.pair2Set1}
                          onChange={(e) => setResultData({ ...resultData, pair2Set1: e.target.value })}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">Set 2</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="P1"
                          value={resultData.pair1Set2}
                          onChange={(e) => setResultData({ ...resultData, pair1Set2: e.target.value })}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          placeholder="P2"
                          value={resultData.pair2Set2}
                          onChange={(e) => setResultData({ ...resultData, pair2Set2: e.target.value })}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">Set 3</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="P1"
                          value={resultData.pair1Set3}
                          onChange={(e) => setResultData({ ...resultData, pair1Set3: e.target.value })}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          placeholder="P2"
                          value={resultData.pair2Set3}
                          onChange={(e) => setResultData({ ...resultData, pair2Set3: e.target.value })}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-400 font-poppins">
                    {t('resultConfirmationNote')}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setSelectedMatch(null);
                    }}
                    className="flex-1 px-6 py-3 bg-background border border-border text-text font-poppins font-semibold rounded-lg hover:border-primary transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSubmitResult}
                    disabled={submitting || !resultData.pair1Games || !resultData.pair2Games}
                    className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('submitting') : t('submit')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TournamentScheduleContent({ tournamentId }: TournamentScheduleContentProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </div>
    }>
      <TournamentScheduleContentInner tournamentId={tournamentId} />
    </Suspense>
  );
}

