'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import TournamentSchedule from './TournamentSchedule';

interface Player {
  registrationId: number;
  firstName: string;
  lastName: string;
  email: string;
  isPartner: boolean;
}

interface Pair {
  id: number;
  pairNumber: number;
  players: Player[];
}

interface Group {
  id: number;
  category: string;
  groupName: string;
  groupNumber: number;
  maxPairs: number;
  startTime: string | null;
  pairs: Pair[];
  isCompleted?: boolean;
}

const DEFAULT_DEMO_PARTICIPANTS_COUNT = 120;

interface TournamentBracketProps {
  tournamentId: number;
}

export default function TournamentBracket({ tournamentId }: TournamentBracketProps) {
  const t = useTranslations('Tournaments.bracket');
  const tCategories = useTranslations('Tournaments.categories');
  const tAdmin = useTranslations('Admin.tournaments');
  const locale = useLocale();
  const [bracket, setBracket] = useState<Record<string, Group[]>>({});
  const [loading, setLoading] = useState(true);
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [playoffStage, setPlayoffStage] = useState<'quarterfinals' | 'semifinals' | 'finals' | 'all'>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [draggedPair, setDraggedPair] = useState<{ pairId: number; groupId: number } | null>(null);
  const [editingPair, setEditingPair] = useState<{ pairId: number; groupId: number; players: Player[]; category: string } | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<{ pairId: number; playerIndex: number; player: Player | null } | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [pairForm, setPairForm] = useState({
    player1RegistrationId: '',
    player2RegistrationId: '',
    // Для ручного ввода имен
    player1FirstName: '',
    player1LastName: '',
    player1Email: '',
    player1Phone: '',
    player2FirstName: '',
    player2LastName: '',
    player2Email: '',
    player2Phone: '',
  });
  const [player1ManualMode, setPlayer1ManualMode] = useState(false);
  const [player2ManualMode, setPlayer2ManualMode] = useState(false);
  const [playerEditForm, setPlayerEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [savingPair, setSavingPair] = useState(false);
  const [notifyParticipants, setNotifyParticipants] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [resultForm, setResultForm] = useState({ 
    pair1Games: '', 
    pair2Games: '',
    // Для knockout-матчей (sets)
    pair1Set1: '', pair1Set2: '', pair1Set3: '',
    pair2Set1: '', pair2Set2: '', pair2Set3: ''
  });
  const [savingResult, setSavingResult] = useState(false);
  const [isKnockoutMatch, setIsKnockoutMatch] = useState(false);
  const [groupWinners, setGroupWinners] = useState<Record<number, number[]>>({}); // groupId -> winner pair IDs
  const [demoParticipantsCount, setDemoParticipantsCount] = useState<number | null>(null);
  const [demoParticipantsInput, setDemoParticipantsInput] = useState('120');
  const [demoCategoryDistribution, setDemoCategoryDistribution] = useState<Record<string, number>>({
    male1: 40,
    female1: 40,
    mixed1: 40,
  });
  const [creatingDemoParticipants, setCreatingDemoParticipants] = useState(false);
  const [demoParticipantsMessage, setDemoParticipantsMessage] = useState<string | null>(null);
  const [autoGenerationAttempted, setAutoGenerationAttempted] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBracket();
  }, [tournamentId]);

  useEffect(() => {
    if (demoParticipantsCount && demoParticipantsCount > 0) {
      setDemoParticipantsInput(String(demoParticipantsCount));
    }
  }, [demoParticipantsCount]);

  // Автоматическая генерация таблицы для demo турниров с участниками
  useEffect(() => {
    if (
      !isAdmin ||
      tournamentStatus !== 'demo' ||
      loading ||
      generatingBracket ||
      creatingDemoParticipants ||
      autoGenerationAttempted
    ) {
      return;
    }

    if (Object.keys(bracket).length === 0) {
      setAutoGenerationAttempted(true);
      console.log('[TournamentBracket] Auto-generating bracket for demo tournament');
      generateBracketForDemo({ auto: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, tournamentStatus, bracket, loading, generatingBracket, creatingDemoParticipants, autoGenerationAttempted]);

  useEffect(() => {
    if (selectedCategory && bracket[selectedCategory]) {
      // Проверяем завершенность групп при смене категории
      checkGroupCompletions();
      fetchMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]); // Убрали bracket из зависимостей, чтобы избежать циклов

  // Отдельный useEffect для проверки завершенности после загрузки bracket
  // Но только если еще не все группы завершены
  useEffect(() => {
    if (selectedCategory && bracket[selectedCategory] && Object.keys(bracket).length > 0) {
      // Проверяем, все ли обычные группы уже завершены
      const regularGroups = bracket[selectedCategory].filter(g => {
        const isKnockoutStage = g.groupName?.toLowerCase().includes('match') ||
                                g.groupName?.toLowerCase().includes('quarterfinal') ||
                                g.groupName?.toLowerCase().includes('semifinal') ||
                                g.groupName?.toLowerCase().includes('final') ||
                                g.groupName?.toLowerCase().includes('quarter') ||
                                g.groupName?.toLowerCase().includes('semi');
        return !isKnockoutStage;
      });
      
      // Проверяем завершенность только если есть незавершенные группы
      const allCompleted = regularGroups.every(g => g.isCompleted === true);
      if (!allCompleted) {
        const timer = setTimeout(() => {
          checkGroupCompletions();
        }, 800);
        return () => clearTimeout(timer);
      } else {
        console.log('[useEffect] All regular groups are completed, skipping checkGroupCompletions');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracket]);

  // Дополнительная проверка при сохранении результата матча
  useEffect(() => {
    if (selectedCategory && !savingResult && matches.length > 0) {
      // Проверяем завершенность после сохранения результата
      const timer = setTimeout(() => {
        console.log('[useEffect] Triggering checkGroupCompletions after result saved, matches:', matches.length);
        checkGroupCompletions();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savingResult, selectedCategory, matches.length]);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAdmin(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.session && (data.session.role === 'superadmin' || data.session.role === 'staff')) {
        setIsAdmin(true);
      }
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchBracket = async () => {
    try {
      // Получаем статус турнира отдельно, чтобы гарантировать его загрузку
      const tournamentResponse = await fetch(`/api/tournament/${tournamentId}`);
      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        const info = tournamentData.tournament;
        setTournamentStatus(info?.status || null);
        setDemoParticipantsCount(info?.demoParticipantsCount ?? null);
      }

      const response = await fetch(`/api/tournament/${tournamentId}/bracket`);
      if (response.ok) {
        const data = await response.json();
        setBracket(data.bracket);
        
        // Set first category as selected by default
        const categories = Object.keys(data.bracket);
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching bracket:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBracketForDemo = async ({
    auto = false,
    allowEnsureParticipants = true,
  }: { auto?: boolean; allowEnsureParticipants?: boolean } = {}): Promise<boolean> => {
    if (!isAdmin || !tournamentStatus || tournamentStatus !== 'demo') {
      return false;
    }
    
    setGeneratingBracket(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        if (!auto) {
          alert(t('demoOnlyAdminHint'));
        }
        return false;
      }
      
      const response = await fetch(`/api/tournament/${tournamentId}/generate-bracket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[generateBracketForDemo] Bracket generated successfully:', data);
        setDemoParticipantsMessage(null);
        await fetchBracket();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const message = errorData.error || t('demoParticipantsMissing');
        console.log('[generateBracketForDemo] Failed to generate bracket:', errorData);
        setDemoParticipantsMessage(message);

        const shouldEnsure =
          allowEnsureParticipants &&
          typeof message === 'string' &&
          message.toLowerCase().includes('no confirmed registrations');

        if (shouldEnsure) {
          const ensured = await ensureDemoParticipants();
          if (ensured) {
            return await generateBracketForDemo({ auto, allowEnsureParticipants: false });
          }
        }

        if (!auto) {
          alert(message);
        }
        return false;
      }
    } catch (error) {
      console.error('[generateBracketForDemo] Error generating bracket:', error);
      if (!auto) {
        alert(t('errorGenerating'));
      }
      setDemoParticipantsMessage(t('demoParticipantsError'));
      return false;
    } finally {
      setGeneratingBracket(false);
    }
  };

  const checkGroupCompletions = async () => {
    if (!selectedCategory || !bracket[selectedCategory]) return;
    
    console.log('[checkGroupCompletions] Checking groups for category:', selectedCategory);
    
    // Фильтруем только обычные группы (не knockout stages)
    const regularGroups = bracket[selectedCategory].filter(g => {
      const isKnockoutStage = g.groupName?.toLowerCase().includes('match') ||
                              g.groupName?.toLowerCase().includes('quarterfinal') ||
                              g.groupName?.toLowerCase().includes('semifinal') ||
                              g.groupName?.toLowerCase().includes('final') ||
                              g.groupName?.toLowerCase().includes('quarter') ||
                              g.groupName?.toLowerCase().includes('semi');
      return !isKnockoutStage;
    });
    
    console.log(`[checkGroupCompletions] Regular groups to check: ${regularGroups.length}`);
    
    // Проверяем завершенность групп асинхронно
    const completionPromises = regularGroups.map(async (group: Group) => {
      try {
        const response = await fetch(`/api/tournament/${tournamentId}/group/${group.id}/completed`);
        if (response.ok) {
          const data = await response.json();
          console.log(`[checkGroupCompletions] Group ${group.id} (${group.groupName}): completed=${data.completed}`);
          
          // Выводим диагностическую информацию, если группа не завершена
          if (!data.completed && data.diagnostics) {
            console.log(`[checkGroupCompletions] Group ${group.id} diagnostics:`, data.diagnostics);
            console.log(`[checkGroupCompletions] Group ${group.id} - Expected: ${data.diagnostics.expectedMatches}, Total: ${data.diagnostics.totalMatches}, Completed: ${data.diagnostics.completedMatches}`);
            
            // Если матчи не созданы или не все созданы, создаем недостающие
            if (data.diagnostics.totalMatches < data.diagnostics.expectedMatches) {
              console.log(`[checkGroupCompletions] Group ${group.id} - Missing ${data.diagnostics.expectedMatches - data.diagnostics.totalMatches} matches, creating them...`);
              try {
                const createResponse = await fetch(`/api/tournament/${tournamentId}/group/${group.id}/create-matches`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json',
                  },
                });
                if (createResponse.ok) {
                  const createData = await createResponse.json();
                  console.log(`[checkGroupCompletions] Group ${group.id} - Created ${createData.created} matches`);
                  // Перепроверяем завершенность после создания матчей
                  const recheckResponse = await fetch(`/api/tournament/${tournamentId}/group/${group.id}/completed`);
                  if (recheckResponse.ok) {
                    const recheckData = await recheckResponse.json();
                    return { groupId: group.id, completed: recheckData.completed, diagnostics: recheckData.diagnostics };
                  }
                } else {
                  console.error(`[checkGroupCompletions] Failed to create matches for group ${group.id}`);
                }
              } catch (error) {
                console.error(`[checkGroupCompletions] Error creating matches for group ${group.id}:`, error);
              }
            }
            
            // Показываем незавершенные матчи
            const incompleteMatches = data.diagnostics.matches.filter((m: any) => !m.isCompleted);
            if (incompleteMatches.length > 0) {
              console.log(`[checkGroupCompletions] Group ${group.id} - Incomplete matches:`, incompleteMatches);
            }
          }
          
          return { groupId: group.id, completed: data.completed, diagnostics: data.diagnostics };
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[checkGroupCompletions] Failed to check group ${group.id}:`, errorData);
        }
      } catch (error) {
        console.error(`[checkGroupCompletions] Error checking group ${group.id} completion:`, error);
      }
      return null;
    });
    
    const results = await Promise.all(completionPromises);
    
    // Обновляем состояние только если есть изменения
    setBracket(prevBracket => {
      const updatedBracket = JSON.parse(JSON.stringify(prevBracket));
      if (!updatedBracket[selectedCategory]) return prevBracket;
      
      let hasChanges = false;
      results.forEach(result => {
        if (result) {
          const group = updatedBracket[selectedCategory].find((g: Group) => g.id === result.groupId);
          if (group) {
            const oldCompleted = group.isCompleted;
            group.isCompleted = result.completed;
            if (oldCompleted !== result.completed) {
              hasChanges = true;
              console.log(`[checkGroupCompletions] Updated group ${group.id} (${group.groupName}): ${oldCompleted} -> ${result.completed}`);
            }
          }
        }
      });
      
      // Логируем статус всех групп для отладки
      const allRegularGroups = updatedBracket[selectedCategory].filter((g: Group) => {
        const isKnockoutStage = g.groupName?.toLowerCase().includes('match') ||
                                g.groupName?.toLowerCase().includes('quarterfinal') ||
                                g.groupName?.toLowerCase().includes('semifinal') ||
                                g.groupName?.toLowerCase().includes('final') ||
                                g.groupName?.toLowerCase().includes('quarter') ||
                                g.groupName?.toLowerCase().includes('semi');
        return !isKnockoutStage;
      });
      console.log('[checkGroupCompletions] All regular groups status:', 
        allRegularGroups.map((g: Group) => ({ id: g.id, name: g.groupName, completed: g.isCompleted }))
      );
      
      // Всегда обновляем состояние, даже если нет изменений, чтобы гарантировать актуальность
      // Это важно, так как состояние может быть устаревшим после сохранения результатов
      return updatedBracket;
    });
  };

  const createDemoParticipants = async () => {
    if (!isAdmin) {
      alert('Только администратор может создавать демо участников.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Необходима авторизация для создания демо участников.');
      return;
    }

    // Проверяем распределение по категориям
    const distribution: Record<string, number> = {};
    let totalCount = 0;
    
    for (const [category, count] of Object.entries(demoCategoryDistribution)) {
      const numCount = parseInt(String(count || 0), 10);
      if (numCount > 0) {
        if (numCount % 2 !== 0) {
          alert(t('demoParticipantsCategoryOdd', { category: tCategories(category) }));
          return;
        }
        distribution[category] = numCount;
        totalCount += numCount;
      }
    }

    if (totalCount < 2) {
      alert(tAdmin('demoParticipantsCountPlaceholder'));
      return;
    }

    setCreatingDemoParticipants(true);
    try {
      const response = await fetch(`/api/tournament/${tournamentId}/demo-participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryDistribution: distribution }),
      });

      if (response.ok) {
        const data = await response.json();
        const created = data.registrationsCreated ?? totalCount;
        setDemoParticipantsCount(totalCount);
        setDemoParticipantsMessage(
          t('demoParticipantsSuccess', { count: created })
        );
        await fetchBracket();
        setAutoGenerationAttempted(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const message = errorData.error || t('demoParticipantsError');
        setDemoParticipantsMessage(message);
        alert(message);
      }
    } catch (error) {
      console.error('[createDemoParticipants] Error:', error);
      alert(t('demoParticipantsError'));
      setDemoParticipantsMessage(t('demoParticipantsError'));
    } finally {
      setCreatingDemoParticipants(false);
    }
  };

  const ensureDemoParticipants = async (): Promise<boolean> => {
    if (!isAdmin) {
      return false;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }

    let count =
      (typeof demoParticipantsCount === 'number' && demoParticipantsCount >= 2
        ? demoParticipantsCount
        : Number.parseInt(demoParticipantsInput, 10)) || DEFAULT_DEMO_PARTICIPANTS_COUNT;

    if (!Number.isFinite(count) || count < 2) {
      count = DEFAULT_DEMO_PARTICIPANTS_COUNT;
    }
    if (count % 2 !== 0) {
      count += 1;
    }

    setCreatingDemoParticipants(true);
    try {
      const response = await fetch(`/api/tournament/${tournamentId}/demo-participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });

      if (response.ok) {
        setDemoParticipantsCount(count);
        setDemoParticipantsInput(String(count));
        setDemoParticipantsMessage(null);
        setAutoGenerationAttempted(false);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const message = errorData.error || t('demoParticipantsError');
        setDemoParticipantsMessage(message);
        return false;
      }
    } catch (error) {
      console.error('[ensureDemoParticipants] Error:', error);
      setDemoParticipantsMessage(t('demoParticipantsError'));
      return false;
    } finally {
      setCreatingDemoParticipants(false);
    }
  };

  const fetchMatches = async () => {
    if (!selectedCategory) return;
    setLoadingMatches(true);
    try {
      const response = await fetch(`/api/tournament/${tournamentId}/schedule?category=${selectedCategory}`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
        
        // Определяем победителей групп на основе матчей
        const winners: Record<number, number[]> = {};
        data.matches?.forEach((match: any) => {
          if (match.winner_pair_id && match.group_id) {
            if (!winners[match.group_id]) {
              winners[match.group_id] = [];
            }
            if (!winners[match.group_id].includes(match.winner_pair_id)) {
              winners[match.group_id].push(match.winner_pair_id);
            }
          }
        });
        setGroupWinners(winners);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSaveResult = async () => {
    if (!selectedMatch) return;
    
    setSavingResult(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      let body: any;
      if (isKnockoutMatch) {
        // Для knockout-матчей: проверяем sets
        const pair1Set1 = resultForm.pair1Set1 ? parseInt(resultForm.pair1Set1) : null;
        const pair1Set2 = resultForm.pair1Set2 ? parseInt(resultForm.pair1Set2) : null;
        const pair1Set3 = resultForm.pair1Set3 ? parseInt(resultForm.pair1Set3) : null;
        const pair2Set1 = resultForm.pair2Set1 ? parseInt(resultForm.pair2Set1) : null;
        const pair2Set2 = resultForm.pair2Set2 ? parseInt(resultForm.pair2Set2) : null;
        const pair2Set3 = resultForm.pair2Set3 ? parseInt(resultForm.pair2Set3) : null;
        
        // Минимум должны быть заполнены СЕТ 1 и СЕТ 2
        if (pair1Set1 === null || pair1Set2 === null || pair2Set1 === null || pair2Set2 === null) {
          alert(t('invalidResult') || 'Заполните хотя бы СЕТ 1 и СЕТ 2');
          setSavingResult(false);
          return;
        }
        
        body = {
          isKnockout: true,
          pair1Set1, pair1Set2, pair1Set3,
          pair2Set1, pair2Set2, pair2Set3,
        };
      } else {
        // Для обычных матчей: проверяем games
    const pair1Games = parseInt(resultForm.pair1Games);
    const pair2Games = parseInt(resultForm.pair2Games);
    
    if (isNaN(pair1Games) || isNaN(pair2Games)) {
      alert(t('invalidResult'));
          setSavingResult(false);
      return;
    }

        body = {
          pair1Games,
          pair2Games,
        };
      }
      
      const response = await fetch(`/api/tournament/${tournamentId}/schedule/match/${selectedMatch.id}/result`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSelectedMatch(null);
        setIsKnockoutMatch(false);
        setResultForm({ 
          pair1Games: '', 
          pair2Games: '',
          pair1Set1: '', pair1Set2: '', pair1Set3: '',
          pair2Set1: '', pair2Set2: '', pair2Set3: ''
        });
        const data = await response.json();
        fetchMatches();
        fetchBracket(); // Обновляем bracket для отображения нового этапа
        
        // Если создан следующий этап, предлагаем сгенерировать расписание
        if (data.advancement && data.advancement.nextStage) {
          setTimeout(() => {
            const shouldGenerate = confirm(
              `${t('nextStageCreated') || 'Следующий этап создан'}: ${data.advancement.nextStage}. ${t('generateScheduleForNextStage') || 'Сгенерировать расписание для следующего этапа?'}`
            );
            if (shouldGenerate && selectedCategory) {
              // Автоматически генерируем расписание
              const token = localStorage.getItem('auth_token');
              fetch(`/api/tournament/${tournamentId}/schedule/next-playoff`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ category: selectedCategory }),
              })
                .then(res => res.json())
                .then(result => {
                  if (result.success) {
                    alert(t('scheduleGenerated', { count: result.matchesGenerated }) || `Расписание сгенерировано! Создано матчей: ${result.matchesGenerated}`);
                    fetchMatches();
                    fetchBracket();
                    setShowSchedule(true);
                  } else {
                    alert(`${t('error')}: ${result.error}`);
                  }
                })
                .catch(err => {
                  console.error('Error auto-generating schedule:', err);
                  alert(t('error'));
                });
            }
          }, 1000);
        }
        
        // Обновляем статус завершенности групп сразу после сохранения
        // Используем небольшую задержку, чтобы БД успела обновиться
        setTimeout(() => {
          console.log('[handleSaveResult] Triggering checkGroupCompletions after saving result');
          checkGroupCompletions(); // Обновляем статус завершенности групп
        }, 500);
      } else {
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving result:', error);
      alert(t('error'));
    } finally {
      setSavingResult(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartKnockout = async (category: string) => {
    // Проверяем, существует ли уже knockout stage для этой категории
    const categoryKnockoutGroups = knockoutGroups.filter(g => g.category === category);
    const hasKnockoutStage = categoryKnockoutGroups.length > 0;

    // Если knockout stage уже существует, просто переключаемся на вкладку
    if (hasKnockoutStage) {
      setActiveTab('knockout');
      return;
    }

    // Если knockout stage еще не создан, проверяем готовность групп
    if (!allGroupsCompleted) {
      alert(t('allResultsRequired'));
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/knockout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ category }),
      });

      if (response.ok) {
        fetchBracket();
        setActiveTab('knockout'); // Переключаемся на вкладку финальной части
      } else {
        const error = await response.json();
        // Если ошибка о том, что следующий этап уже существует, просто переключаемся
        if (error.error && error.error.includes('already exists')) {
          fetchBracket();
          setActiveTab('knockout');
        } else {
        alert(`${t('error')}: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error starting knockout:', error);
      alert(t('error'));
    }
  };

  const handleDragStart = (pairId: number, groupId: number) => {
    if (!isAdmin) return;
    setDraggedPair({ pairId, groupId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetGroupId: number) => {
    if (!draggedPair || draggedPair.groupId === targetGroupId) {
      setDraggedPair(null);
      return;
    }

    // Сохраняем исходное состояние для отката
    const originalBracket = JSON.parse(JSON.stringify(bracket));
    const sourceGroup = bracket[selectedCategory || '']?.find(g => g.id === draggedPair.groupId);
    const targetGroup = bracket[selectedCategory || '']?.find(g => g.id === targetGroupId);
    
    if (!sourceGroup || !targetGroup) {
      setDraggedPair(null);
      return;
    }

    const pairToMove = sourceGroup.pairs.find(p => p.id === draggedPair.pairId);
    if (!pairToMove) {
      setDraggedPair(null);
      return;
    }

    // Оптимистичное обновление - сразу обновляем локальное состояние
    const updatedBracket = JSON.parse(JSON.stringify(bracket));
    const updatedSourceGroup = updatedBracket[selectedCategory || '']?.find((g: any) => g.id === draggedPair.groupId);
    const updatedTargetGroup = updatedBracket[selectedCategory || '']?.find((g: any) => g.id === targetGroupId);
    
    if (updatedSourceGroup && updatedTargetGroup) {
      // Удаляем из исходной группы
      updatedSourceGroup.pairs = updatedSourceGroup.pairs.filter((p: any) => p.id !== draggedPair.pairId);
      // Сохраняем оригинальный номер пары, если он свободен в целевой группе
      const originalPairNumber = pairToMove.pairNumber;
      const isNumberFree = !updatedTargetGroup.pairs.some((p: any) => p.pairNumber === originalPairNumber);
      
      // Используем оригинальный номер, если свободен, иначе находим следующий
      const newPairNumber = isNumberFree 
        ? originalPairNumber 
        : Math.max(...updatedTargetGroup.pairs.map((p: any) => p.pairNumber), 0) + 1;
      
      // Добавляем в целевую группу с сохраненным или новым номером
      updatedTargetGroup.pairs.push({ ...pairToMove, pairNumber: newPairNumber });
      setBracket(updatedBracket);
    }

    const savedPairId = draggedPair.pairId;
    const savedTargetGroupId = targetGroupId;
    setDraggedPair(null);

    // Отправляем запрос в фоне
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/pair/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pairId: savedPairId,
          targetGroupId: savedTargetGroupId,
        }),
      });

      if (!response.ok) {
        // Если запрос не удался, откатываем изменения
        setBracket(originalBracket);
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
      // При успехе НЕ вызываем fetchBracket() - оптимистичное обновление уже применено
    } catch (error) {
      // Если ошибка, откатываем изменения
      setBracket(originalBracket);
      console.error('Error moving pair:', error);
      alert(t('error'));
    }
  };

  const handleEditPair = async (pairId: number, groupId: number, players: Player[], category: string) => {
    setEditingPair({ pairId, groupId, players, category });
    
    // Загрузить доступных игроков для замены
    setLoadingPlayers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/players?category=${category}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailablePlayers(data.players || []);
        
        // Заполнить форму текущими значениями
        const player1 = players.find(p => !p.isPartner);
        const player2 = players.find((p, idx) => idx > 0 && !p.isPartner);
        
        // Определяем режим ввода для каждого игрока
        const player1HasRegistration = player1?.registrationId;
        const player2HasRegistration = player2?.registrationId;
        
        setPlayer1ManualMode(!player1HasRegistration);
        setPlayer2ManualMode(!player2HasRegistration);
        
        setPairForm({
          player1RegistrationId: player1HasRegistration?.toString() || '',
          player2RegistrationId: player2HasRegistration?.toString() || '',
          // Если игрок не из БД, заполняем поля вручную
          player1FirstName: !player1HasRegistration ? player1?.firstName || '' : '',
          player1LastName: !player1HasRegistration ? player1?.lastName || '' : '',
          player1Email: !player1HasRegistration ? player1?.email || '' : '',
          player1Phone: '',
          player2FirstName: !player2HasRegistration ? player2?.firstName || '' : '',
          player2LastName: !player2HasRegistration ? player2?.lastName || '' : '',
          player2Email: !player2HasRegistration ? player2?.email || '' : '',
          player2Phone: '',
        });
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleSavePair = async () => {
    if (!editingPair) return;

    setSavingPair(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Если введены имена вручную, сначала создаем/обновляем регистрации
      let player1RegId = pairForm.player1RegistrationId ? parseInt(pairForm.player1RegistrationId) : null;
      let player2RegId = pairForm.player2RegistrationId ? parseInt(pairForm.player2RegistrationId) : null;

      // Создаем регистрацию для player1, если введены данные вручную
      if (!player1RegId && pairForm.player1FirstName && pairForm.player1LastName) {
        const createRegResponse = await fetch(`/api/tournament/${tournamentId}/register-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: pairForm.player1FirstName,
            lastName: pairForm.player1LastName,
            email: pairForm.player1Email || `${pairForm.player1FirstName.toLowerCase()}.${pairForm.player1LastName.toLowerCase()}@temp.padelo2.com`,
            phone: pairForm.player1Phone || null,
            categories: [editingPair.category],
            confirmed: true, // Автоматически подтверждаем для суперадмина
          }),
        });

        if (createRegResponse.ok) {
          const regData = await createRegResponse.json();
          player1RegId = regData.registrationId || regData.id;
        } else {
          const error = await createRegResponse.json();
          alert(`${t('error')}: ${error.error}`);
          return;
        }
      }

      // Создаем регистрацию для player2, если введены данные вручную
      if (!player2RegId && pairForm.player2FirstName && pairForm.player2LastName) {
        const createRegResponse = await fetch(`/api/tournament/${tournamentId}/register-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: pairForm.player2FirstName,
            lastName: pairForm.player2LastName,
            email: pairForm.player2Email || `${pairForm.player2FirstName.toLowerCase()}.${pairForm.player2LastName.toLowerCase()}@temp.padelo2.com`,
            phone: pairForm.player2Phone || null,
            categories: [editingPair.category],
            confirmed: true,
          }),
        });

        if (createRegResponse.ok) {
          const regData = await createRegResponse.json();
          player2RegId = regData.registrationId || regData.id;
        } else {
          const error = await createRegResponse.json();
          alert(`${t('error')}: ${error.error}`);
          return;
        }
      }

      const response = await fetch(`/api/tournament/${tournamentId}/pair`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pairId: editingPair.pairId,
          player1RegistrationId: player1RegId,
          player2RegistrationId: player2RegId,
        }),
      });

      if (response.ok) {
        // Отправляем уведомления, если выбрано
        if (notifyParticipants) {
          try {
            // Получаем информацию о паре для уведомлений
            const notifyResponse = await fetch(`/api/tournament/${tournamentId}/pair/${editingPair.pairId}/notify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
          player1RegistrationId: player1RegId,
          player2RegistrationId: player2RegId,
          partner1RegistrationId: null,
          partner2RegistrationId: null,
        }),
      });

            if (!notifyResponse.ok) {
              console.warn('Failed to send notifications');
            }
          } catch (notifyError) {
            console.error('Error sending notifications:', notifyError);
            // Не блокируем сохранение, если уведомления не отправились
          }
        }
        
        setEditingPair(null);
        setNotifyParticipants(false);
        setPlayer1ManualMode(false);
        setPlayer2ManualMode(false);
        setPairForm({
          player1RegistrationId: '',
          player2RegistrationId: '',
          player1FirstName: '',
          player1LastName: '',
          player1Email: '',
          player1Phone: '',
          player2FirstName: '',
          player2LastName: '',
          player2Email: '',
          player2Phone: '',
        });
        fetchBracket();
      } else {
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving pair:', error);
      alert(t('errorUpdatingPair'));
    } finally {
      setSavingPair(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return tCategories(category) || category;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Разделяем группы на обычные и финальные
  const { regularGroups, knockoutGroups } = useMemo(() => {
    if (!selectedCategory || !bracket[selectedCategory]) {
      return { regularGroups: [], knockoutGroups: [] };
    }
    
    const allGroups = bracket[selectedCategory];
    const regular: Group[] = [];
    const knockout: Group[] = [];
    
    allGroups.forEach(g => {
      const isKnockoutStage = g.groupName?.toLowerCase().includes('match') ||
                              g.groupName?.toLowerCase().includes('quarterfinal') ||
                              g.groupName?.toLowerCase().includes('semifinal') ||
                              g.groupName?.toLowerCase().includes('final') ||
                              g.groupName?.toLowerCase().includes('quarter') ||
                              g.groupName?.toLowerCase().includes('semi');
      if (isKnockoutStage) {
        knockout.push(g);
      } else {
        regular.push(g);
      }
    });
    
    return { regularGroups: regular, knockoutGroups: knockout };
  }, [selectedCategory, bracket]);
    
  // Проверяем, все ли обычные группы в категории завершены
  const allGroupsCompleted = useMemo(() => {
    if (regularGroups.length === 0) {
      console.log('[allGroupsCompleted] No regular groups found');
      return false;
    }
    const allCompleted = regularGroups.every(g => g.isCompleted === true);
    console.log('[allGroupsCompleted] Regular groups:', regularGroups.length, 'All completed:', allCompleted);
    console.log('[allGroupsCompleted] Groups status:', regularGroups.map(g => ({ id: g.id, name: g.groupName, completed: g.isCompleted })));
    return allCompleted;
  }, [regularGroups]);

  if (loading) {
    return (
      <div className="p-6 bg-background-secondary rounded-lg border border-border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(bracket);
  if (categories.length === 0) {
    // Если это demo турнир, показываем кнопку для генерации таблицы
    if (tournamentStatus === 'demo') {
      return (
        <div className="p-6 bg-background-secondary rounded-lg border border-border">
          <p className="text-text-secondary font-poppins mb-4">
            {t('notCreated')}
          </p>
          {isAdmin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('demoParticipantsCategoryDistribution')}
                </label>
                <div className="space-y-3">
                  {['male1', 'male2', 'female1', 'female2', 'mixed1', 'mixed2'].map((category) => (
                    <div key={category} className="flex items-center gap-3">
                      <label className="text-sm font-poppins text-text w-32">
                        {tCategories(category)}:
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="2"
                        value={demoCategoryDistribution[category] || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10) || 0;
                          setDemoCategoryDistribution({
                            ...demoCategoryDistribution,
                            [category]: value,
                          });
                        }}
                        placeholder="0"
                        className="px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors w-24"
                      />
                      <span className="text-xs text-text-tertiary font-poppins">
                        ({Math.floor((demoCategoryDistribution[category] || 0) / 2)} {t('pairs')})
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-tertiary font-poppins mt-2">
                  {t('demoParticipantsCategoryHint')}
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={createDemoParticipants}
                    disabled={creatingDemoParticipants}
                    className="px-6 py-2 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingDemoParticipants ? t('generating') : t('demoParticipantsCreate')}
                  </button>
                </div>
              </div>
              <button
                onClick={() => generateBracketForDemo()}
                disabled={generatingBracket}
                className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingBracket ? t('generating') : t('generateBracket')}
              </button>
              {demoParticipantsMessage && (
                <p className="text-xs text-text-secondary font-poppins">{demoParticipantsMessage}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary font-poppins">
              {t('demoOnlyAdminHint')}
            </p>
          )}
        </div>
      );
    }
    
    return (
      <div className="p-6 bg-background-secondary rounded-lg border border-border">
        <p className="text-text-secondary font-poppins">
          {t('notCreated')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary rounded-lg border border-border p-6">
      <div className="mb-6">
        <Link
          href={`/${locale}/tournaments`}
          className="text-text-secondary hover:text-primary font-poppins transition-colors"
        >
          ← {t('back')}
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-poppins font-bold text-text">
          {t('title')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-poppins text-sm"
          >
            {showSchedule ? t('hideSchedule') : t('schedule')}
          </button>
          <Link
            href={`/${locale}/tournament/${tournamentId}/rules`}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-poppins text-sm"
          >
            {t('rules')}
          </Link>
        </div>
      </div>

      {showSchedule && (
        <div className="mb-6 relative">
          <TournamentSchedule 
            tournamentId={tournamentId} 
            isAdmin={isAdmin}
            onScheduleGenerated={() => {
              // Обновляем матчи после генерации расписания
              fetchMatches();
              // Обновляем bracket для отображения новых групп
              fetchBracket();
            }}
          />
        </div>
      )}

      {/* Category selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-poppins font-semibold transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-background'
                : 'bg-background text-text border border-border hover:border-primary'
            }`}
          >
            {getCategoryLabel(category)}
            <span className="ml-2 text-sm opacity-75">
              ({bracket[category]
                .filter(g => {
                  // Считаем только обычные группы (не knockout stages)
                  const isKnockoutStage = g.groupName?.toLowerCase().includes('match') ||
                                          g.groupName?.toLowerCase().includes('quarterfinal') ||
                                          g.groupName?.toLowerCase().includes('semifinal') ||
                                          g.groupName?.toLowerCase().includes('final') ||
                                          g.groupName?.toLowerCase().includes('quarter') ||
                                          g.groupName?.toLowerCase().includes('semi');
                  return !isKnockoutStage;
                })
                .reduce((sum, g) => {
                  // Считаем только пары с игроками (где есть хотя бы один игрок)
                  const pairsWithPlayers = g.pairs.filter(p => p.players && p.players.length > 0);
                  return sum + pairsWithPlayers.length;
                }, 0)} {t('pair')})
            </span>
          </button>
        ))}
      </div>

      {/* Вкладки */}
      {selectedCategory && (
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
              activeTab === 'groups'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {t('groups')}
          </button>
          <button
            onClick={() => setActiveTab('knockout')}
            className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
              activeTab === 'knockout'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {t('playoff')}
          </button>
        </div>
      )}

      {/* Кнопка перехода к финальной части (всегда видна для админа на вкладке групп) */}
      {selectedCategory && isAdmin && activeTab === 'groups' && (() => {
        const categoryKnockoutGroups = knockoutGroups.filter(g => g.category === selectedCategory);
        const hasKnockoutStage = categoryKnockoutGroups.length > 0;
        
        return (
          <div className="mb-6 p-4 bg-background rounded-lg border border-border">
          <div className="flex items-center justify-between">
              <div className="flex-1">
              <h3 className="text-lg font-poppins font-bold text-text mb-1">
                  {hasKnockoutStage ? t('goToPlayoff') || 'Перейти до PLAY OFF' : t('startKnockout')}
              </h3>
                <p className={`text-sm font-poppins ${
                  hasKnockoutStage || allGroupsCompleted 
                    ? 'text-text-secondary' 
                    : 'text-orange-500'
                }`}>
                  {hasKnockoutStage 
                    ? t('knockoutStageExists') || 'Фінальна частина вже створена'
                    : allGroupsCompleted 
                      ? t('allGroupsCompleted')
                      : t('allResultsRequired')
                  }
              </p>
            </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('[Button] Manual checkGroupCompletions triggered');
                    checkGroupCompletions();
                  }}
                  className="px-3 py-2 rounded-lg font-poppins text-sm bg-background-secondary text-text border border-border hover:bg-background transition-colors"
                  title={t('refreshStatus') || 'Обновить статус'}
                >
                  🔄
                </button>
            <button
              onClick={() => selectedCategory && handleStartKnockout(selectedCategory)}
                  disabled={!hasKnockoutStage && !allGroupsCompleted}
                  className={`px-4 py-2 rounded-lg font-poppins transition-opacity ${
                    hasKnockoutStage || allGroupsCompleted
                      ? 'bg-primary text-background hover:opacity-90'
                      : 'bg-background-secondary text-text-secondary border border-border cursor-not-allowed opacity-50'
                  }`}
            >
                  {hasKnockoutStage ? t('goToPlayoff') || 'Перейти до PLAY OFF' : t('startKnockout')}
            </button>
          </div>
        </div>
          </div>
        );
      })()}

      {/* Вкладка "Группы" */}
      {selectedCategory && activeTab === 'groups' && regularGroups.length > 0 && (
        <div className="space-y-6">
          {regularGroups.map((group) => {
            // Проверяем, соответствует ли количество пар maxPairs
            const pairsCount = group.pairs.length;
            const hasError = pairsCount !== group.maxPairs;
            const isOverLimit = pairsCount > group.maxPairs;
            const isUnderLimit = pairsCount < group.maxPairs;
            
            return (
            <div
              key={group.id}
              className={`bg-background rounded-lg border p-4 ${
                hasError 
                  ? isOverLimit 
                    ? 'border-yellow-500 bg-yellow-500/10' 
                    : 'border-orange-500 bg-orange-500/10'
                  : 'border-border'
              }`}
              onDragOver={isAdmin ? handleDragOver : undefined}
              onDrop={isAdmin ? () => handleDrop(group.id) : undefined}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-poppins font-bold text-text">
                    {group.groupName} ({group.category})
                  </h3>
                  {hasError && (
                    <p className="text-sm font-poppins mt-1">
                      {isOverLimit ? (
                        <span className="text-yellow-500">
                          ⚠️ {t('groupOverLimit', { current: pairsCount, max: group.maxPairs })}
                        </span>
                      ) : (
                        <span className="text-orange-500">
                          ⚠️ {t('groupUnderLimit', { current: pairsCount, max: group.maxPairs })}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {group.isCompleted && (
                    <span className="text-sm text-green-400 font-poppins font-semibold">
                      ✓ {t('completed')}
                    </span>
                  )}
                  {group.startTime && (
                    <span className="text-sm text-text-secondary font-poppins">
                      {t('startTime')}: {formatTime(group.startTime)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.pairs.map((pair) => (
                  <div
                    key={pair.id}
                    draggable={isAdmin}
                    onDragStart={() => isAdmin && handleDragStart(pair.id, group.id)}
                    className={`bg-background-secondary rounded-lg border border-border p-3 ${
                      isAdmin ? 'cursor-move hover:border-primary transition-colors' : ''
                    } ${draggedPair?.pairId === pair.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-poppins font-semibold text-primary">
                        {t('pair')} {pair.pairNumber}
                        <span className="text-xs text-text-secondary ml-1">(ID: {pair.id})</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleEditPair(pair.id, group.id, pair.players, group.category)}
                          className="text-xs text-text-secondary hover:text-primary transition-colors"
                          title={t('editPair')}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {(() => {
                        const mainPlayers = pair.players.filter(p => !p.isPartner);
                        if (mainPlayers.length >= 2) {
                          // Показываем пару в формате "Имя1 Фамилия1 & Имя2 Фамилия2"
                          const player1 = `${mainPlayers[0].firstName} ${mainPlayers[0].lastName}`.trim();
                          const player2 = `${mainPlayers[1].firstName} ${mainPlayers[1].lastName}`.trim();
                          return (
                            <div className="text-sm font-poppins text-text font-semibold">
                              {player1} & {player2}
                            </div>
                          );
                        } else if (mainPlayers.length === 1) {
                          // Если только один игрок
                          return (
                            <div className="text-sm font-poppins text-text font-semibold">
                              {mainPlayers[0].firstName} {mainPlayers[0].lastName}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-sm text-text-secondary font-poppins italic">
                              {t('empty')}
                            </div>
                          );
                        }
                      })()}
                      {isAdmin && pair.players.filter(p => !p.isPartner).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {pair.players
                            .filter(p => !p.isPartner)
                            .map((player, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setEditingPlayer({ pairId: pair.id, playerIndex: idx, player });
                                  setPlayerEditForm({
                                    firstName: player.firstName || '',
                                    lastName: player.lastName || '',
                                    email: player.email || '',
                                  });
                                }}
                                className="text-xs text-text-secondary hover:text-primary transition-colors"
                                title={t('editPlayer') || 'Редактировать игрока'}
                              >
                                ✏️ {player.firstName}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Вкладка "Финальная часть" */}
      {selectedCategory && activeTab === 'knockout' && (
        <div className="space-y-6">
          {knockoutGroups.length > 0 ? (
            <>
              {/* Вкладки для навигации между этапами плей-офф */}
              {(() => {
                // Определяем группы категории для проверки наличия четвертьфиналов
                const categoryKnockoutGroups = knockoutGroups.filter(g => g.category === selectedCategory);
                
                // Проверяем наличие четвертьфиналов в категории
                const hasQuarterfinals = categoryKnockoutGroups.some((group: any) => {
                  const groupName = group.groupName?.toLowerCase() || '';
                  return groupName.includes('quarterfinal') || 
                         (groupName.includes('match') && !groupName.includes('semifinal') && !groupName.includes('final'));
                });
                
                return (
                  <div className="flex gap-2 border-b border-border pb-2">
                    <button
                      onClick={() => setPlayoffStage('all')}
                      className={`px-4 py-2 rounded-t-lg font-poppins font-semibold transition-colors ${
                        playoffStage === 'all'
                          ? 'bg-primary text-background'
                          : 'bg-background-secondary text-text-secondary hover:bg-background'
                      }`}
                    >
                      {t('allStages') || 'Все этапы'}
                    </button>
                    {hasQuarterfinals && (
                      <button
                        onClick={() => setPlayoffStage('quarterfinals')}
                        className={`px-4 py-2 rounded-t-lg font-poppins font-semibold transition-colors ${
                          playoffStage === 'quarterfinals'
                            ? 'bg-primary text-background'
                            : 'bg-background-secondary text-text-secondary hover:bg-background'
                        }`}
                      >
                        {t('quarterfinals') || 'Четвертьфинал'}
                      </button>
                    )}
                    <button
                      onClick={() => setPlayoffStage('semifinals')}
                      className={`px-4 py-2 rounded-t-lg font-poppins font-semibold transition-colors ${
                        playoffStage === 'semifinals'
                          ? 'bg-primary text-background'
                          : 'bg-background-secondary text-text-secondary hover:bg-background'
                      }`}
                    >
                      {t('semifinals') || 'Полуфинал'}
                    </button>
                    <button
                      onClick={() => setPlayoffStage('finals')}
                      className={`px-4 py-2 rounded-t-lg font-poppins font-semibold transition-colors ${
                        playoffStage === 'finals'
                          ? 'bg-primary text-background'
                          : 'bg-background-secondary text-text-secondary hover:bg-background'
                      }`}
                    >
                      {t('finals') || 'Финал'}
                    </button>
                  </div>
                );
              })()}

              {/* Фильтруем группы по выбранному этапу */}
              {(() => {
                const categoryKnockoutGroups = knockoutGroups.filter(g => g.category === selectedCategory);
                const filteredGroups = categoryKnockoutGroups.filter((group) => {
                  if (playoffStage === 'all') return true;
                  const groupName = group.groupName.toLowerCase();
                  if (playoffStage === 'quarterfinals') {
                    return groupName.includes('quarterfinal') || 
                           (groupName.includes('match') && !groupName.includes('semifinal') && !groupName.includes('final'));
                  }
                  if (playoffStage === 'semifinals') {
                    return groupName.includes('semifinal');
                  }
                  if (playoffStage === 'finals') {
                    return groupName.includes('final') && !groupName.includes('semifinal');
                  }
                  return true;
                });

                return (
                  <>
                    {/* Кнопка генерации расписания для финальной части - показываем всегда, если есть группы плей-офф в категории */}
                    {isAdmin && categoryKnockoutGroups.length > 0 && (
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={async () => {
                      if (!selectedCategory) return;
                      
                      try {
                        const token = localStorage.getItem('auth_token');
                        const response = await fetch(`/api/tournament/${tournamentId}/schedule/next-playoff`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ category: selectedCategory }),
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                                alert(t('scheduleGenerated', { count: data.matchesGenerated }) || `Расписание сгенерировано! Создано матчей: ${data.matchesGenerated}`);
                          // Обновляем матчи и bracket
                          fetchMatches();
                          fetchBracket();
                          // Переключаемся на вкладку расписания
                          setShowSchedule(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          const error = await response.json();
                          alert(`${t('error')}: ${error.error}`);
                        }
                      } catch (error) {
                        console.error('Error generating next playoff schedule:', error);
                        alert(t('error'));
                      }
                    }}
                    className="px-6 py-3 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins font-semibold"
                  >
                    {t('generateSchedule')}
                  </button>
                </div>
              )}

              {/* Группы финальной части */}
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => {
                const pairsCount = group.pairs.length;
                const hasError = pairsCount !== group.maxPairs;
                const isOverLimit = pairsCount > group.maxPairs;
                const isUnderLimit = pairsCount < group.maxPairs;
                
                return (
                  <div
                    key={group.id}
                    className={`bg-background rounded-lg border p-4 ${
                      hasError 
                        ? isOverLimit 
                          ? 'border-yellow-500 bg-yellow-500/10' 
                          : 'border-orange-500 bg-orange-500/10'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-poppins font-bold text-text">
                          {group.groupName} ({group.category})
                        </h3>
                        {hasError && (
                          <p className="text-sm font-poppins mt-1">
                            {isOverLimit ? (
                              <span className="text-yellow-500">
                                ⚠️ {t('groupOverLimit', { current: pairsCount, max: group.maxPairs })}
                              </span>
                            ) : (
                              <span className="text-orange-500">
                                ⚠️ {t('groupUnderLimit', { current: pairsCount, max: group.maxPairs })}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {group.isCompleted && (
                          <span className="text-sm text-green-400 font-poppins font-semibold">
                            ✓ {t('completed')}
                          </span>
                        )}
                        {group.startTime && (
                          <span className="text-sm text-text-secondary font-poppins">
                            {t('startTime')}: {formatTime(group.startTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {group.pairs.map((pair) => (
                        <div
                          key={pair.id}
                          className="bg-background-secondary rounded-lg border border-border p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-poppins font-semibold text-primary">
                                {t('pair')} {pair.pairNumber}
                                <span className="text-xs text-text-secondary ml-1">(ID: {pair.id})</span>
                              </div>
                              {groupWinners[group.id]?.includes(pair.id) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-poppins font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                  🏆 {t('winner')}
                                </span>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleEditPair(pair.id, group.id, pair.players, group.category)}
                                className="text-xs text-text-secondary hover:text-primary transition-colors"
                                title={t('editPair')}
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {(() => {
                              const mainPlayers = pair.players.filter(p => !p.isPartner);
                              if (mainPlayers.length >= 2) {
                                // Показываем пару в формате "Имя1 Фамилия1 & Имя2 Фамилия2"
                                const player1 = `${mainPlayers[0].firstName} ${mainPlayers[0].lastName}`.trim();
                                const player2 = `${mainPlayers[1].firstName} ${mainPlayers[1].lastName}`.trim();
                                return (
                                  <div className="text-sm font-poppins text-text font-semibold">
                                    {player1} & {player2}
                                  </div>
                                );
                              } else if (mainPlayers.length === 1) {
                                // Если только один игрок
                                return (
                                  <div className="text-sm font-poppins text-text font-semibold">
                                    {mainPlayers[0].firstName} {mainPlayers[0].lastName}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-sm text-text-secondary font-poppins italic">
                                    {t('empty')}
                                  </div>
                                );
                              }
                            })()}
                            {isAdmin && pair.players.filter(p => !p.isPartner).length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {pair.players
                                  .filter(p => !p.isPartner)
                                  .map((player, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setEditingPlayer({ pairId: pair.id, playerIndex: idx, player });
                                        setPlayerEditForm({
                                          firstName: player.firstName || '',
                                          lastName: player.lastName || '',
                                          email: player.email || '',
                                        });
                                      }}
                                      className="text-xs text-text-secondary hover:text-primary transition-colors"
                                      title={t('editPlayer') || 'Редактировать игрока'}
                                    >
                                      ✏️ {player.firstName}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                  </div>
                ))}
              </div>
            </div>
            );
                    })
                    ) : (
                      <div className="p-6 bg-background rounded-lg border border-border text-center">
                        <p className="text-text-secondary font-poppins">
                          {t('noGroupsForStage') || `Нет групп для этапа ${playoffStage === 'quarterfinals' ? 'Четвертьфинал' : playoffStage === 'semifinals' ? 'Полуфинал' : 'Финал'}`}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <div className="p-6 bg-background rounded-lg border border-border text-center">
              <p className="text-text-secondary font-poppins mb-4">
                {t('noKnockoutGroups')}
              </p>
              {isAdmin && !allGroupsCompleted && (
                <p className="text-sm text-orange-500 font-poppins">
                  {t('allResultsRequired')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Таблица со всеми матчами категории (для вкладки групп) */}
      {selectedCategory && activeTab === 'groups' && (
        <div className="mt-8">
          <h3 className="text-xl font-poppins font-bold text-text mb-4">
            {t('allMatches')}
          </h3>
          {loadingMatches ? (
            <div className="text-center py-8">
              <p className="text-text-secondary font-poppins">{t('loading')}</p>
            </div>
          ) : matches.length === 0 ? (
            <p className="text-text-secondary font-poppins">{t('noMatches')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-poppins font-semibold text-text">{t('date')}</th>
                    <th className="text-left p-3 font-poppins font-semibold text-text">{t('court')}</th>
                    <th className="text-left p-3 font-poppins font-semibold text-text">{t('group')}</th>
                    <th className="text-left p-3 font-poppins font-semibold text-text">{t('pair1')}</th>
                    <th className="text-left p-3 font-poppins font-semibold text-text">{t('pair2')}</th>
                    <th className="text-left p-3 font-poppins font-semibold text-text">{t('result')}</th>
                    {isAdmin && <th className="text-left p-3 font-poppins font-semibold text-text">{t('actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {matches
                    .filter((match) => {
                      // Фильтруем по категории
                      if (match.category !== selectedCategory) return false;
                      // Фильтруем только обычные группы (не knockout stage)
                      const isKnockout = match.group_name?.toLowerCase().includes('match') ||
                                        match.group_name?.toLowerCase().includes('quarterfinal') ||
                                        match.group_name?.toLowerCase().includes('semifinal') ||
                                        match.group_name?.toLowerCase().includes('final') ||
                                        match.group_name?.toLowerCase().includes('quarter') ||
                                        match.group_name?.toLowerCase().includes('semi');
                      return !isKnockout;
                    })
                    .map((match) => (
                    <tr key={match.id} className="border-b border-border hover:bg-background/50">
                      <td className="p-3 text-text-secondary font-poppins">
                        {formatDate(match.match_date)}
                      </td>
                      <td className="p-3 text-text-secondary font-poppins">
                        {match.court_number || '-'}
                      </td>
                      <td className="p-3 text-text-secondary font-poppins">
                        {match.group_name || `${t('group')} ${match.group_number}`}
                      </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          <div className="flex items-center gap-2">
                            {match.pair1_formatted || (match.pair1_players && match.pair1_players.length > 0
                              ? match.pair1_players.length === 2 
                                ? `${match.pair1_players[0]} & ${match.pair1_players[1]}`
                                : match.pair1_players.join(' / ')
                              : `${t('pair')} ${match.pair1_id}`)}
                            {match.winner_pair_id === match.pair1_id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-poppins font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                              🏆 {t('winner')}
                            </span>
                          )}
                        </div>
                      </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          <div className="flex items-center gap-2">
                            {match.pair2_formatted || (match.pair2_players && match.pair2_players.length > 0
                              ? match.pair2_players.length === 2 
                                ? `${match.pair2_players[0]} & ${match.pair2_players[1]}`
                                : match.pair2_players.join(' / ')
                              : `${t('pair')} ${match.pair2_id}`)}
                            {match.winner_pair_id === match.pair2_id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-poppins font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                              🏆 {t('winner')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-text-secondary font-poppins">
                        {(() => {
                          // Проверяем, является ли это knockout-матчем
                          const isKnockout = match.group_name?.toLowerCase().includes('match') ||
                                           match.group_name?.toLowerCase().includes('quarterfinal') ||
                                           match.group_name?.toLowerCase().includes('semifinal') ||
                                           match.group_name?.toLowerCase().includes('final');
                          
                          if (isKnockout && match.pair1_set1 !== null && match.pair1_set2 !== null &&
                              match.pair2_set1 !== null && match.pair2_set2 !== null) {
                            // Отображаем sets для knockout-матчей
                            let result = `${match.pair1_set1}-${match.pair2_set1} ${match.pair1_set2}-${match.pair2_set2}`;
                            if (match.pair1_set3 !== null && match.pair2_set3 !== null) {
                              result += ` ${match.pair1_set3}-${match.pair2_set3}`;
                            }
                            return result;
                          } else if (match.pair1_games !== null && match.pair2_games !== null) {
                            // Отображаем games для обычных матчей
                            return `${match.pair1_games} - ${match.pair2_games}`;
                          }
                          return '-';
                        })()}
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedMatch(match);
                              // Проверяем, является ли это knockout-матчем
                              const isKnockout = match.group_name?.toLowerCase().includes('match') || 
                                                match.group_name?.toLowerCase().includes('quarterfinal') ||
                                                match.group_name?.toLowerCase().includes('semifinal') ||
                                                match.group_name?.toLowerCase().includes('final');
                              setIsKnockoutMatch(isKnockout);
                              
                              if (isKnockout) {
                                // Для knockout-матчей используем sets
                                setResultForm({
                                  pair1Games: '',
                                  pair2Games: '',
                                  pair1Set1: match.pair1_set1?.toString() || '',
                                  pair1Set2: match.pair1_set2?.toString() || '',
                                  pair1Set3: match.pair1_set3?.toString() || '',
                                  pair2Set1: match.pair2_set1?.toString() || '',
                                  pair2Set2: match.pair2_set2?.toString() || '',
                                  pair2Set3: match.pair2_set3?.toString() || '',
                                });
                              } else {
                                // Для обычных матчей используем games
                              setResultForm({
                                pair1Games: match.pair1_games?.toString() || '',
                                pair2Games: match.pair2_games?.toString() || '',
                                  pair1Set1: '', pair1Set2: '', pair1Set3: '',
                                  pair2Set1: '', pair2Set2: '', pair2Set3: ''
                              });
                              }
                            }}
                            className="px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors font-poppins text-xs"
                          >
                            {(match.pair1_games !== null || (match.pair1_set1 !== null && match.pair1_set2 !== null)) 
                              ? t('editResult') 
                              : t('addResult')}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Таблица со всеми матчами Play Off (для вкладки knockout) */}
      {selectedCategory && activeTab === 'knockout' && (
        <div className="mt-8">
          <h3 className="text-xl font-poppins font-bold text-text mb-4">
            {t('allMatches')}
          </h3>
          {loadingMatches ? (
            <div className="text-center py-8">
              <p className="text-text-secondary font-poppins">{t('loading')}</p>
            </div>
          ) : (() => {
            // Фильтруем только матчи Play Off
            const playoffMatches = matches.filter((match) => {
              // Фильтруем по категории
              if (match.category !== selectedCategory) return false;
              const isKnockout = match.group_name?.toLowerCase().includes('match') ||
                                match.group_name?.toLowerCase().includes('quarterfinal') ||
                                match.group_name?.toLowerCase().includes('semifinal') ||
                                match.group_name?.toLowerCase().includes('final') ||
                                match.group_name?.toLowerCase().includes('quarter') ||
                                match.group_name?.toLowerCase().includes('semi');
              return isKnockout;
            });
            
            return playoffMatches.length === 0 ? (
              <p className="text-text-secondary font-poppins">{t('noMatches')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-poppins font-semibold text-text">{t('date')}</th>
                      <th className="text-left p-3 font-poppins font-semibold text-text">{t('court')}</th>
                      <th className="text-left p-3 font-poppins font-semibold text-text">{t('group')}</th>
                      <th className="text-left p-3 font-poppins font-semibold text-text">{t('pair1')}</th>
                      <th className="text-left p-3 font-poppins font-semibold text-text">{t('pair2')}</th>
                      <th className="text-left p-3 font-poppins font-semibold text-text">{t('result')}</th>
                      {isAdmin && <th className="text-left p-3 font-poppins font-semibold text-text">{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {playoffMatches.map((match) => (
                      <tr key={match.id} className="border-b border-border hover:bg-background/50">
                        <td className="p-3 text-text-secondary font-poppins">
                          {formatDate(match.match_date)}
                        </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          {match.court_number || '-'}
                        </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          {match.group_name || `${t('group')} ${match.group_number}`}
                        </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          <div className="flex items-center gap-2">
                            {match.pair1_formatted || (match.pair1_players && match.pair1_players.length > 0
                              ? match.pair1_players.length === 2 
                                ? `${match.pair1_players[0]} & ${match.pair1_players[1]}`
                                : match.pair1_players.join(' / ')
                              : `${t('pair')} ${match.pair1_id}`)}
                            {match.winner_pair_id === match.pair1_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-poppins font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                🏆 {t('winner')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          <div className="flex items-center gap-2">
                            {match.pair2_formatted || (match.pair2_players && match.pair2_players.length > 0
                              ? match.pair2_players.length === 2 
                                ? `${match.pair2_players[0]} & ${match.pair2_players[1]}`
                                : match.pair2_players.join(' / ')
                              : `${t('pair')} ${match.pair2_id}`)}
                            {match.winner_pair_id === match.pair2_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-poppins font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                🏆 {t('winner')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-text-secondary font-poppins">
                          {(() => {
                            // Для Play Off матчей всегда используем sets
                            if (match.pair1_set1 !== null && match.pair1_set2 !== null &&
                                match.pair2_set1 !== null && match.pair2_set2 !== null) {
                              // Отображаем sets для knockout-матчей
                              let result = `${match.pair1_set1}-${match.pair2_set1} ${match.pair1_set2}-${match.pair2_set2}`;
                              if (match.pair1_set3 !== null && match.pair2_set3 !== null) {
                                result += ` ${match.pair1_set3}-${match.pair2_set3}`;
                              }
                              return result;
                            }
                            return '-';
                          })()}
                        </td>
                        {isAdmin && (
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setSelectedMatch(match);
                                setIsKnockoutMatch(true);
                                
                                // Для knockout-матчей используем sets
                                setResultForm({
                                  pair1Games: '',
                                  pair2Games: '',
                                  pair1Set1: match.pair1_set1?.toString() || '',
                                  pair1Set2: match.pair1_set2?.toString() || '',
                                  pair1Set3: match.pair1_set3?.toString() || '',
                                  pair2Set1: match.pair2_set1?.toString() || '',
                                  pair2Set2: match.pair2_set2?.toString() || '',
                                  pair2Set3: match.pair2_set3?.toString() || '',
                                });
                              }}
                              className="px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors font-poppins text-xs"
                            >
                              {(match.pair1_set1 !== null && match.pair1_set2 !== null) 
                                ? t('editResult') 
                                : t('addResult')}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal для ввода результата */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('enterResult')}
            </h3>
            <div className="mb-4">
              <p className="text-text-secondary font-poppins text-sm mb-4">
                {selectedMatch.pair1_formatted || (selectedMatch.pair1_players && selectedMatch.pair1_players.length > 0
                  ? selectedMatch.pair1_players.length === 2 
                    ? `${selectedMatch.pair1_players[0]} & ${selectedMatch.pair1_players[1]}`
                    : selectedMatch.pair1_players.join(' / ')
                  : `${t('pair')} ${selectedMatch.pair1_id}`)}
                {' vs '}
                {selectedMatch.pair2_formatted || (selectedMatch.pair2_players && selectedMatch.pair2_players.length > 0
                  ? selectedMatch.pair2_players.length === 2 
                    ? `${selectedMatch.pair2_players[0]} & ${selectedMatch.pair2_players[1]}`
                    : selectedMatch.pair2_players.join(' / ')
                  : `${t('pair')} ${selectedMatch.pair2_id}`)}
              </p>
              {isKnockoutMatch ? (
                // Для knockout-матчей: СЕТ 1, СЕТ 2, СЕТ 3
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center text-sm font-poppins text-text-secondary">{t('set1')}</div>
                    <div className="text-center text-sm font-poppins text-text-secondary">{t('set2')}</div>
                    <div className="text-center text-sm font-poppins text-text-secondary">{t('set3')}</div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {selectedMatch.pair1_formatted || (selectedMatch.pair1_players && selectedMatch.pair1_players.length > 0
                          ? selectedMatch.pair1_players.length === 2 
                            ? `${selectedMatch.pair1_players[0]} & ${selectedMatch.pair1_players[1]}`
                            : selectedMatch.pair1_players.join(' / ')
                          : `${t('pair')} ${selectedMatch.pair1_id}`)}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={resultForm.pair1Set1}
                          onChange={(e) => setResultForm({ ...resultForm, pair1Set1: e.target.value })}
                          placeholder="0-7"
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          min="0"
                          value={resultForm.pair1Set2}
                          onChange={(e) => setResultForm({ ...resultForm, pair1Set2: e.target.value })}
                          placeholder="0-7"
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          min="0"
                          value={resultForm.pair1Set3}
                          onChange={(e) => setResultForm({ ...resultForm, pair1Set3: e.target.value })}
                          placeholder="0+ (TB)"
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {selectedMatch.pair2_formatted || (selectedMatch.pair2_players && selectedMatch.pair2_players.length > 0
                          ? selectedMatch.pair2_players.length === 2 
                            ? `${selectedMatch.pair2_players[0]} & ${selectedMatch.pair2_players[1]}`
                            : selectedMatch.pair2_players.join(' / ')
                          : `${t('pair')} ${selectedMatch.pair2_id}`)}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={resultForm.pair2Set1}
                          onChange={(e) => setResultForm({ ...resultForm, pair2Set1: e.target.value })}
                          placeholder="0-7"
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          min="0"
                          value={resultForm.pair2Set2}
                          onChange={(e) => setResultForm({ ...resultForm, pair2Set2: e.target.value })}
                          placeholder="0-7"
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          min="0"
                          value={resultForm.pair2Set3}
                          onChange={(e) => setResultForm({ ...resultForm, pair2Set3: e.target.value })}
                          placeholder="0+ (TB)"
                          className="px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary font-poppins mt-2">
                    {t('knockoutSetsHint')}
                  </p>
                </div>
              ) : (
                // Для обычных матчей: games
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-text font-poppins font-semibold">
                    {selectedMatch.pair1_formatted || (selectedMatch.pair1_players && selectedMatch.pair1_players.length > 0
                      ? selectedMatch.pair1_players.length === 2 
                        ? `${selectedMatch.pair1_players[0]} & ${selectedMatch.pair1_players[1]}`
                        : selectedMatch.pair1_players.join(' / ')
                      : `${t('pair')} ${selectedMatch.pair1_id}`)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.pair1Games}
                    onChange={(e) => setResultForm({ ...resultForm, pair1Games: e.target.value })}
                    className="w-20 px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-text font-poppins font-semibold">
                    {selectedMatch.pair2_formatted || (selectedMatch.pair2_players && selectedMatch.pair2_players.length > 0
                      ? selectedMatch.pair2_players.length === 2 
                        ? `${selectedMatch.pair2_players[0]} & ${selectedMatch.pair2_players[1]}`
                        : selectedMatch.pair2_players.join(' / ')
                      : `${t('pair')} ${selectedMatch.pair2_id}`)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.pair2Games}
                    onChange={(e) => setResultForm({ ...resultForm, pair2Games: e.target.value })}
                    className="w-20 px-3 py-2 bg-background border border-border rounded-lg text-text font-orbitron text-center focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveResult}
                disabled={savingResult}
                className="flex-1 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins disabled:opacity-50"
              >
                {savingResult ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setIsKnockoutMatch(false);
                  setResultForm({ 
                    pair1Games: '', 
                    pair2Games: '',
                    pair1Set1: '', pair1Set2: '', pair1Set3: '',
                    pair2Set1: '', pair2Set2: '', pair2Set3: ''
                  });
                }}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal для редактирования пары */}
      {editingPair && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('editPair')}
            </h3>
            <p className="text-sm text-text-secondary font-poppins mb-4">
              {t('changePlayers')}
            </p>

            {loadingPlayers ? (
              <div className="text-center py-8">
                <p className="text-text-secondary font-poppins">{t('loadingPlayers')}</p>
              </div>
            ) : (
              <div className="space-y-6 mb-4">
                {/* Player 1 */}
                <div className="border border-border rounded-lg p-4">
                  <label className="block text-sm font-poppins font-semibold text-text mb-3">
                    {t('player1')} *
                  </label>
                  
                  {/* Переключатель: выбрать из списка / ввести вручную */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPlayer1ManualMode(false);
                        setPairForm({ ...pairForm, player1FirstName: '', player1LastName: '', player1Email: '', player1Phone: '' });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-poppins text-sm transition-colors ${
                        !player1ManualMode
                          ? 'bg-primary text-background'
                          : 'bg-background text-text-secondary border border-border hover:border-primary'
                      }`}
                    >
                      {t('selectFromList')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlayer1ManualMode(true);
                        setPairForm({ ...pairForm, player1RegistrationId: '' });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-poppins text-sm transition-colors ${
                        player1ManualMode
                          ? 'bg-primary text-background'
                          : 'bg-background text-text-secondary border border-border hover:border-primary'
                      }`}
                    >
                      {t('enterManually')}
                    </button>
                  </div>

                  {!player1ManualMode ? (
                    // Выбор из списка
                    <select
                      value={pairForm.player1RegistrationId}
                      onChange={(e) => {
                        setPairForm({ ...pairForm, player1RegistrationId: e.target.value });
                      }}
                      className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                      required
                    >
                      <option value="">{t('selectPlayer1')}</option>
                      {availablePlayers.filter(p => !p.isPartner).map((player) => (
                        <option key={`${player.registrationId}-${player.isPartner}`} value={player.registrationId}>
                          {player.fullName} ({player.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Ручной ввод
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder={t('firstName')}
                        value={pairForm.player1FirstName}
                        onChange={(e) => setPairForm({ ...pairForm, player1FirstName: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                        required
                      />
                      <input
                        type="text"
                        placeholder={t('lastName')}
                        value={pairForm.player1LastName}
                        onChange={(e) => setPairForm({ ...pairForm, player1LastName: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                        required
                      />
                      <input
                        type="email"
                        placeholder={t('email')}
                        value={pairForm.player1Email}
                        onChange={(e) => setPairForm({ ...pairForm, player1Email: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                        required
                      />
                      <input
                        type="tel"
                        placeholder={`${t('phone')} (${t('optional')})`}
                        value={pairForm.player1Phone}
                        onChange={(e) => setPairForm({ ...pairForm, player1Phone: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                      />
                  </div>
                )}
                </div>

                {/* Player 2 */}
                <div className="border border-border rounded-lg p-4">
                  <label className="block text-sm font-poppins font-semibold text-text mb-3">
                    {t('player2')} *
                  </label>
                  
                  {/* Переключатель: выбрать из списка / ввести вручную */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPlayer2ManualMode(false);
                        setPairForm({ ...pairForm, player2FirstName: '', player2LastName: '', player2Email: '', player2Phone: '' });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-poppins text-sm transition-colors ${
                        !player2ManualMode
                          ? 'bg-primary text-background'
                          : 'bg-background text-text-secondary border border-border hover:border-primary'
                      }`}
                    >
                      {t('selectFromList')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlayer2ManualMode(true);
                        setPairForm({ ...pairForm, player2RegistrationId: '' });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-poppins text-sm transition-colors ${
                        player2ManualMode
                          ? 'bg-primary text-background'
                          : 'bg-background text-text-secondary border border-border hover:border-primary'
                      }`}
                    >
                      {t('enterManually')}
                    </button>
                  </div>

                  {!player2ManualMode ? (
                    // Выбор из списка
                    <select
                      value={pairForm.player2RegistrationId}
                      onChange={(e) => {
                        setPairForm({ ...pairForm, player2RegistrationId: e.target.value });
                      }}
                      className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                      required
                    >
                      <option value="">{t('selectPlayer2')}</option>
                      {availablePlayers.filter(p => !p.isPartner).map((player) => (
                        <option key={`${player.registrationId}-${player.isPartner}`} value={player.registrationId}>
                          {player.fullName} ({player.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Ручной ввод
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder={t('firstName')}
                        value={pairForm.player2FirstName}
                        onChange={(e) => setPairForm({ ...pairForm, player2FirstName: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                        required
                      />
                      <input
                        type="text"
                        placeholder={t('lastName')}
                        value={pairForm.player2LastName}
                        onChange={(e) => setPairForm({ ...pairForm, player2LastName: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                        required
                      />
                      <input
                        type="email"
                        placeholder={t('email')}
                        value={pairForm.player2Email}
                        onChange={(e) => setPairForm({ ...pairForm, player2Email: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                        required
                      />
                      <input
                        type="tel"
                        placeholder={`${t('phone')} (${t('optional')})`}
                        value={pairForm.player2Phone}
                        onChange={(e) => setPairForm({ ...pairForm, player2Phone: e.target.value })}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                      />
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Чекбокс уведомлений */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyParticipants"
                checked={notifyParticipants}
                onChange={(e) => setNotifyParticipants(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="notifyParticipants" className="text-sm font-poppins text-text-secondary cursor-pointer">
                {t('notifyParticipants')}
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSavePair}
                disabled={savingPair || (!pairForm.player1RegistrationId && !pairForm.player1FirstName)}
                className="flex-1 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins disabled:opacity-50"
              >
                {savingPair ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => {
                  setEditingPair(null);
                  setNotifyParticipants(false);
                  setPlayer1ManualMode(false);
                  setPlayer2ManualMode(false);
                  setPairForm({
                    player1RegistrationId: '',
                    player2RegistrationId: '',
                    player1FirstName: '',
                    player1LastName: '',
                    player1Email: '',
                    player1Phone: '',
                    player2FirstName: '',
                    player2LastName: '',
                    player2Email: '',
                    player2Phone: '',
                  });
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
