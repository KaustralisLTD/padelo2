'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import TournamentScheduleAdmin from './TournamentScheduleAdmin';

interface Match {
  id: number;
  group_id: number;
  pair1_id: number;
  pair2_id: number;
  match_date: string;
  court_number: number | null;
  pair1_games: number | null;
  pair2_games: number | null;
  winner_pair_id: number | null;
  group_name?: string;
  group_number?: number;
  category?: string;
  pair1_players?: string[];
  pair2_players?: string[];
}

interface TournamentScheduleProps {
  tournamentId: number;
  category?: string;
  groupId?: number;
  isAdmin?: boolean;
  onScheduleGenerated?: () => void;
}

export default function TournamentSchedule({ 
  tournamentId, 
  category, 
  groupId,
  isAdmin = false,
  onScheduleGenerated
}: TournamentScheduleProps) {
  const t = useTranslations('Tournaments.bracket');
  const tCategories = useTranslations('Tournaments.categories');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [resultForm, setResultForm] = useState({ pair1Games: '', pair2Games: '' });
  const [savingResult, setSavingResult] = useState(false);
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    availableCourts: 3,
    matchDurationMinutes: 45,
    breakMinutes: 15,
    timeSlots: [{ date: '', startTime: '', endTime: '' }], // Множественные временные промежутки
  });

  useEffect(() => {
    fetchSchedule();
  }, [tournamentId, category, groupId]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      let url = `/api/tournament/${tournamentId}/schedule`;
      if (groupId) {
        url += `?groupId=${groupId}`;
      } else if (category) {
        url += `?category=${category}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
        setAdminRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!confirm(t('clearSchedule') + '?')) return;

    setGenerating(true);
    setGenerationProgress(0);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/schedule`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert(t('scheduleCleared'));
        await fetchSchedule();
      } else {
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error clearing schedule:', error);
      alert(t('error'));
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleGenerateSchedule = async () => {
    // Проверяем, что все временные промежутки заполнены
    const validSlots = formData.timeSlots.filter(slot => slot.date && slot.startTime && slot.endTime);
    if (validSlots.length === 0) {
      alert(t('startTimeRequired'));
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    
    // Симуляция прогресса (так как реальный прогресс сложно отследить)
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          availableCourts: formData.availableCourts,
          matchDurationMinutes: formData.matchDurationMinutes,
          breakMinutes: formData.breakMinutes,
          timeSlots: validSlots, // Отправляем массив временных промежутков
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.ok) {
        const data = await response.json();
        const message = t('scheduleGenerated', { count: data.matchesGenerated });
        // Не показываем alert, чтобы не мешать
        setShowGenerateForm(false);
        // Обновляем расписание - оно автоматически отобразится через TournamentScheduleAdmin
        await fetchSchedule();
        // Уведомляем родительский компонент об обновлении расписания
        if (onScheduleGenerated) {
          onScheduleGenerated();
        }
      } else {
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert(t('errorGenerating'));
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleSaveResult = async (match: Match) => {
    if (!resultForm.pair1Games || !resultForm.pair2Games) {
      alert(t('fillResult'));
      return;
    }

    setSavingResult(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: match.group_id,
          pair1Id: match.pair1_id,
          pair2Id: match.pair2_id,
          pair1Games: parseInt(resultForm.pair1Games),
          pair2Games: parseInt(resultForm.pair2Games),
        }),
      });

      if (response.ok) {
        setSelectedMatch(null);
        setResultForm({ pair1Games: '', pair2Games: '' });
        fetchSchedule();
      } else {
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving result:', error);
      alert(t('errorSavingResult'));
    } finally {
      setSavingResult(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (cat: string) => {
    return tCategories(cat) || cat;
  };

  if (loading) {
    return <div className="text-text-secondary font-poppins">{t('loadingSchedule')}</div>;
  }

  return (
    <div className="bg-background-secondary rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-poppins font-bold text-text">
          {t('schedule')}
        </h2>
        {isAdmin && !category && !groupId && (
          <div className="flex gap-2">
            {!showGenerateForm ? (
              <button
                onClick={() => setShowGenerateForm(true)}
                className="px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins text-sm"
              >
                {t('generateScheduleForAll')}
              </button>
            ) : (
              <button
                onClick={() => setShowGenerateForm(false)}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins text-sm"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        )}
      </div>

      {showGenerateForm && isAdmin && (
        <div className="mb-6 p-4 bg-background rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-poppins font-bold text-text">
              {t('scheduleSettings')}
            </h3>
            <button
              onClick={handleClearSchedule}
              disabled={generating}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-poppins text-sm disabled:opacity-50"
            >
              {t('clearSchedule')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('courts')}
              </label>
              <input
                type="number"
                min="1"
                value={formData.availableCourts}
                onChange={(e) => setFormData({ ...formData, availableCourts: parseInt(e.target.value) || 3 })}
                className="w-full p-2 bg-background-secondary border border-border rounded-lg text-text font-poppins"
              />
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('matchDuration')}
              </label>
              <input
                type="number"
                min="30"
                value={formData.matchDurationMinutes}
                onChange={(e) => setFormData({ ...formData, matchDurationMinutes: parseInt(e.target.value) || 45 })}
                className="w-full p-2 bg-background-secondary border border-border rounded-lg text-text font-poppins"
              />
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('breakDuration')}
              </label>
              <input
                type="number"
                min="5"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 15 })}
                className="w-full p-2 bg-background-secondary border border-border rounded-lg text-text font-poppins"
              />
            </div>
          </div>
          
          {/* Временные промежутки */}
          <div className="mb-4">
            <label className="block text-sm font-poppins text-text-secondary mb-2">
              {t('timeSlots')}
            </label>
            {formData.timeSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => {
                      const newSlots = [...formData.timeSlots];
                      newSlots[index].date = e.target.value;
                      setFormData({ ...formData, timeSlots: newSlots });
                    }}
                    className="w-full p-2 bg-background-secondary border border-border rounded-lg text-text font-poppins text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                    {t('startTime')}
                  </label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => {
                      const newSlots = [...formData.timeSlots];
                      newSlots[index].startTime = e.target.value;
                      setFormData({ ...formData, timeSlots: newSlots });
                    }}
                    className="w-full p-2 bg-background-secondary border border-border rounded-lg text-text font-poppins text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                    {t('endTime')}
                  </label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => {
                      const newSlots = [...formData.timeSlots];
                      newSlots[index].endTime = e.target.value;
                      setFormData({ ...formData, timeSlots: newSlots });
                    }}
                    className="w-full p-2 bg-background-secondary border border-border rounded-lg text-text font-poppins text-sm"
                  />
                </div>
                <div className="flex items-end">
                  {formData.timeSlots.length > 1 && (
                    <button
                      onClick={() => {
                        const newSlots = formData.timeSlots.filter((_, i) => i !== index);
                        setFormData({ ...formData, timeSlots: newSlots });
                      }}
                      className="w-full px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-poppins text-sm"
                    >
                      {t('remove')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  timeSlots: [...formData.timeSlots, { date: '', startTime: '', endTime: '' }],
                });
              }}
              className="mt-2 px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins text-sm"
            >
              + {t('addTimeSlot')}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateSchedule}
              disabled={generating || formData.timeSlots.filter(s => s.date && s.startTime && s.endTime).length === 0}
              className="flex-1 px-6 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins disabled:opacity-50 relative overflow-hidden"
            >
              {generating && (
                <div
                  className="absolute inset-y-0 left-0 bg-background/25 dark:bg-white/10 transition-[width] duration-300 ease-out pointer-events-none"
                  style={{ width: `${generationProgress}%` }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {generating ? (
                  <>
                    <span>{t('generating')}</span>
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>{t('generate')}</>
                )}
              </span>
            </button>
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  timeSlots: [{ date: '', startTime: '', endTime: '' }],
                });
                setShowGenerateForm(false);
              }}
              className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-8 text-text-secondary font-poppins">
          {t('noSchedule')} {isAdmin && !category && t('generateForAllCategories')}
        </div>
      ) : isAdmin && !category && !groupId ? (
        // Для админа показываем улучшенную панель
        <TournamentScheduleAdmin tournamentId={tournamentId} refreshToken={adminRefreshKey} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-poppins font-semibold text-text">{t('dateTime')}</th>
                <th className="text-left p-3 font-poppins font-semibold text-text">{t('court')}</th>
                {!groupId && <th className="text-left p-3 font-poppins font-semibold text-text">{t('category')}</th>}
                {!groupId && <th className="text-left p-3 font-poppins font-semibold text-text">{t('group')}</th>}
                <th className="text-left p-3 font-poppins font-semibold text-text">{t('pair1')}</th>
                <th className="text-left p-3 font-poppins font-semibold text-text">{t('pair2')}</th>
                <th className="text-left p-3 font-poppins font-semibold text-text">{t('result')}</th>
                {isAdmin && <th className="text-left p-3 font-poppins font-semibold text-text">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-b border-border hover:bg-background/50">
                  <td className="p-3 text-text-secondary font-poppins">
                    {formatDate(match.match_date)}
                  </td>
                  <td className="p-3 text-text-secondary font-poppins">
                    {match.court_number || '-'}
                  </td>
                  {!groupId && (
                    <>
                      <td className="p-3 text-text-secondary font-poppins">
                        {match.category ? getCategoryLabel(match.category) : '-'}
                      </td>
                      <td className="p-3 text-text-secondary font-poppins">
                        {match.group_name || `${t('group')} ${match.group_number}`}
                      </td>
                    </>
                  )}
                  <td className="p-3 text-text-secondary font-poppins">
                    {match.pair1_players && match.pair1_players.length > 0
                      ? match.pair1_players.join(' / ')
                      : `${t('pair')} ${match.pair1_id}`}
                  </td>
                  <td className="p-3 text-text-secondary font-poppins">
                    {match.pair2_players && match.pair2_players.length > 0
                      ? match.pair2_players.join(' / ')
                      : `${t('pair')} ${match.pair2_id}`}
                  </td>
                  <td className="p-3 text-text-secondary font-poppins">
                    {match.pair1_games !== null && match.pair2_games !== null
                      ? `${match.pair1_games} - ${match.pair2_games}`
                      : '-'}
                  </td>
                  {isAdmin && (
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedMatch(match);
                          setResultForm({
                            pair1Games: match.pair1_games?.toString() || '',
                            pair2Games: match.pair2_games?.toString() || '',
                          });
                        }}
                        className="px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors font-poppins text-xs"
                      >
                        {match.pair1_games !== null ? t('editResult') : t('addResult')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal для ввода результата */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('enterResult')}
            </h3>
            <div className="mb-4">
              <p className="text-text-secondary font-poppins text-sm mb-2">
                {selectedMatch.pair1_players && selectedMatch.pair1_players.length > 0
                  ? selectedMatch.pair1_players.join(' / ')
                  : `${t('pair')} ${selectedMatch.pair1_id}`}
                {' vs '}
                {selectedMatch.pair2_players && selectedMatch.pair2_players.length > 0
                  ? selectedMatch.pair2_players.join(' / ')
                  : `${t('pair')} ${selectedMatch.pair2_id}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-1">
                  {t('pair1Games')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={resultForm.pair1Games}
                  onChange={(e) => setResultForm({ ...resultForm, pair1Games: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-1">
                  {t('pair2Games')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={resultForm.pair2Games}
                  onChange={(e) => setResultForm({ ...resultForm, pair2Games: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveResult(selectedMatch)}
                disabled={savingResult}
                className="flex-1 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins disabled:opacity-50"
              >
                {savingResult ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setResultForm({ pair1Games: '', pair2Games: '' });
                }}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
