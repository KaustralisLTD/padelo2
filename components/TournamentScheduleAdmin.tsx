'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

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
  duration_slots?: number; // Количество слотов (1-4, по умолчанию 3)
  group_name?: string;
  group_number?: number;
  category?: string;
  pair1_players?: string[];
  pair2_players?: string[];
}

interface TournamentScheduleAdminProps {
  tournamentId: number;
  refreshToken?: number;
}

export default function TournamentScheduleAdmin({ tournamentId, refreshToken }: TournamentScheduleAdminProps) {
  const t = useTranslations('Tournaments.bracket');
  const tCategories = useTranslations('Tournaments.categories');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterCourt, setFilterCourt] = useState<number | null>(null);
  const [filterStage, setFilterStage] = useState<'groups' | 'playoff' | ''>('');
  const [showSchedule, setShowSchedule] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [resultForm, setResultForm] = useState({ pair1Games: '', pair2Games: '' });
  const [savingResult, setSavingResult] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState({ matchDate: '', courtNumber: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null);
  const [timeRange, setTimeRange] = useState<{ start: Date; end: Date } | null>(null);
  const [resizingMatch, setResizingMatch] = useState<{ match: Match; direction: 'top' | 'bottom' } | null>(null);
  const [filterDays, setFilterDays] = useState<string[]>([]); // Массив выбранных дней в формате YYYY-MM-DD
  const [collapsedEarlyHours, setCollapsedEarlyHours] = useState(true); // Свернуты ли ранние часы (00:00-08:00)
  const [resizingMatchState, setResizingMatchState] = useState<{
    match: Match;
    direction: 'top' | 'bottom';
    startY: number;
    startSlots: number;
    startDate: Date;
  } | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null); // ID выделенной карточки
  const [hoveredBorder, setHoveredBorder] = useState<{ matchId: number; border: 'top' | 'bottom' } | null>(null); // На какой границе наведена мышь

  const MIN_DURATION_SLOTS = 2;

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, refreshToken]);

  // Инициализация диапазона времени только один раз
  useEffect(() => {
    if (!timeRange && matches.length > 0) {
      const allDates = matches.map(m => new Date(m.match_date));
      const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      
      // Устанавливаем начало дня для минимальной даты
      minDate.setHours(0, 0, 0, 0);
      // Устанавливаем конец дня для максимальной даты
      maxDate.setHours(23, 59, 59, 999);
      
      setTimeRange({ start: minDate, end: maxDate });
    } else if (!timeRange && matches.length === 0) {
      const minDate = new Date();
      minDate.setHours(6, 0, 0, 0);
      const maxDate = new Date();
      maxDate.setHours(23, 0, 0, 0);
      setTimeRange({ start: minDate, end: maxDate });
    }
  }, [matches, timeRange]);

  // Получаем уникальные дни из матчей
  const availableDays = useMemo(() => {
    const daysSet = new Set<string>();
    matches.forEach(m => {
      const matchDate = new Date(m.match_date);
      const dayKey = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}-${String(matchDate.getDate()).padStart(2, '0')}`;
      daysSet.add(dayKey);
    });
    return Array.from(daysSet).sort();
  }, [matches]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tournament/${tournamentId}/schedule`);
      if (response.ok) {
        const data = await response.json();
        const normalizedMatches = (data.matches || []).map((match: Match) => ({
          ...match,
          duration_slots: Math.max(match.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS),
        }));
        setMatches(normalizedMatches);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Получаем уникальные категории из матчей и групп турнира
  const [allTournamentCategories, setAllTournamentCategories] = useState<string[]>([]);
  
  useEffect(() => {
    // Загружаем все категории турнира из групп
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/tournament/${tournamentId}/bracket`);
        if (response.ok) {
          const data = await response.json();
          const cats = new Set<string>();
          // Добавляем категории из bracket (структура: { bracket: { category: [...] } })
          if (data.bracket) {
            Object.keys(data.bracket).forEach(category => cats.add(category));
          }
          // Добавляем категории из матчей (на случай, если есть матчи без групп)
          matches.forEach(m => m.category && cats.add(m.category));
          setAllTournamentCategories(Array.from(cats).sort());
        }
      } catch (error) {
        console.error('Error fetching tournament categories:', error);
        // Fallback: используем только категории из matches
        const cats = new Set<string>();
        matches.forEach(m => m.category && cats.add(m.category));
        setAllTournamentCategories(Array.from(cats).sort());
      }
    };
    fetchCategories();
  }, [tournamentId, matches]);

  const categories = useMemo(() => {
    // Используем все категории турнира, если они загружены, иначе только из matches
    if (allTournamentCategories.length > 0) {
      return allTournamentCategories;
    }
    const cats = new Set<string>();
    matches.forEach(m => m.category && cats.add(m.category));
    return Array.from(cats).sort();
  }, [matches, allTournamentCategories]);

  const courts = useMemo(() => {
    const courtSet = new Set<number>();
    matches.forEach(m => m.court_number && courtSet.add(m.court_number));
    return Array.from(courtSet).sort((a, b) => a - b);
  }, [matches]);

  const gridTemplateColumnsValue = useMemo(
    () => `150px repeat(${Math.max(courts.length, 1)}, 1fr)`,
    [courts.length]
  );

  // Фильтрация и поиск
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Фильтр по дням
    if (filterDays.length > 0) {
      filtered = filtered.filter(m => {
        const matchDate = new Date(m.match_date);
        const dayKey = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}-${String(matchDate.getDate()).padStart(2, '0')}`;
        return filterDays.includes(dayKey);
      });
    }

    // Фильтр по категории
    if (filterCategory) {
      filtered = filtered.filter(m => m.category === filterCategory);
    }

    // Фильтр по этапу (Groups или Play Off)
    if (filterStage) {
      filtered = filtered.filter(m => {
        const groupName = m.group_name?.toLowerCase() || '';
        const isPlayoff = groupName.includes('match') || 
                         groupName.includes('quarterfinal') ||
                         groupName.includes('semifinal') ||
                         groupName.includes('final') ||
                         groupName.includes('playoff');
        return filterStage === 'playoff' ? isPlayoff : !isPlayoff;
      });
    }

    // Фильтр по корту
    if (filterCourt !== null) {
      filtered = filtered.filter(m => m.court_number === filterCourt);
    }

    // Поиск по именам игроков
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => {
        const pair1Names = m.pair1_players?.join(' ').toLowerCase() || '';
        const pair2Names = m.pair2_players?.join(' ').toLowerCase() || '';
        return pair1Names.includes(query) || pair2Names.includes(query);
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.match_date).getTime();
      const dateB = new Date(b.match_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return (a.court_number || 0) - (b.court_number || 0);
    });
  }, [matches, filterCategory, filterCourt, filterStage, searchQuery, filterDays]);

  // Группировка по временным слотам (15 минут) - не используется, но оставлено для совместимости

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

  const formatTimeSlot = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateSlot = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    if (isToday) {
      return `${dateStr} (${t('today')})`;
    } else if (isTomorrow) {
      return `${dateStr} (${t('tomorrow')})`;
    } else {
      return dateStr;
    }
  };

  const getCategoryLabel = (cat: string) => {
    return tCategories(cat) || cat;
  };

  const getPairLabel = (match: Match, pairIndex: 1 | 2) => {
    const players = pairIndex === 1 ? match.pair1_players : match.pair2_players;
    const pairId = pairIndex === 1 ? match.pair1_id : match.pair2_id;
    return players && players.length > 0 ? players.join(' / ') : `${t('pair')} ${pairId}`;
  };

  const selectedMatchPairs = selectedMatch
    ? [
        {
          key: 'pair1Games' as const,
          label: getPairLabel(selectedMatch, 1),
          value: resultForm.pair1Games,
        },
        {
          key: 'pair2Games' as const,
          label: getPairLabel(selectedMatch, 2),
          value: resultForm.pair2Games,
        },
      ]
    : [];

  const selectedMatchTimeInfo = selectedMatch
    ? (() => {
        const slots = Math.max(selectedMatch.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS);
        const endTime = new Date(new Date(selectedMatch.match_date).getTime() + slots * 15 * 60 * 1000);
        return {
          range: `${formatTimeSlot(selectedMatch.match_date)} — ${endTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
          dateLabel: formatDate(selectedMatch.match_date),
          courtLabel: selectedMatch.court_number ? `${t('court')} ${selectedMatch.court_number}` : '',
        };
      })()
    : null;

  const handleSaveResult = async (match: Match) => {
    if (!resultForm.pair1Games || !resultForm.pair2Games) {
      alert(t('fillResult'));
      return;
    }

    setSavingResult(true);
    try {
      const token = localStorage.getItem('auth_token');
      const pair1Games = parseInt(resultForm.pair1Games);
      const pair2Games = parseInt(resultForm.pair2Games);

      // Оптимистичное обновление
      const updatedMatches = matches.map(m => 
        m.id === match.id 
          ? { ...m, pair1_games: pair1Games, pair2_games: pair2Games }
          : m
      );
      setMatches(updatedMatches);
      setSelectedMatch(null);
      setResultForm({ pair1Games: '', pair2Games: '' });

      // Отправляем запрос в фоне
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
          pair1Games,
          pair2Games,
        }),
      });

      if (!response.ok) {
        // Откатываем изменения
        setMatches(matches);
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      // Откатываем изменения
      setMatches(matches);
      console.error('Error saving result:', error);
      alert(t('errorSavingResult'));
    } finally {
      setSavingResult(false);
    }
  };

  // Обработчики для drag-and-drop изменения длительности
  const handleResizeStart = (e: React.MouseEvent, match: Match, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    // Разрешаем изменение размера только если карточка выделена
    if (selectedCardId !== match.id) {
      return;
    }
    const currentSlots = Math.max(match.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS);
    setResizingMatchState({
      match,
      direction,
      startY: e.clientY,
      startSlots: currentSlots,
      startDate: new Date(match.match_date),
    });
  };

  useEffect(() => {
    if (!resizingMatchState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingMatchState.startY;
      const slotHeight = 80; // Высота одного 15-минутного слота в пикселях
      const deltaSlots = Math.round(deltaY / slotHeight);
      
      if (deltaSlots === 0) return;

      const { match, direction, startSlots, startDate } = resizingMatchState;
      let newSlots = startSlots;
      let newMatchDate = new Date(startDate);

      if (direction === 'top') {
        // Верхняя граница: вниз = уменьшение, вверх = увеличение
        newSlots = Math.max(MIN_DURATION_SLOTS, Math.min(8, startSlots - deltaSlots));
        const slotsDiff = newSlots - startSlots;
        // Сдвигаем начало матча, сохраняя конец
        newMatchDate.setMinutes(newMatchDate.getMinutes() - slotsDiff * 15);
      } else {
        // Нижняя граница: вниз = увеличение, вверх = уменьшение
        newSlots = Math.max(MIN_DURATION_SLOTS, Math.min(8, startSlots + deltaSlots));
      }

      // Оптимистичное обновление
      const updatedMatches = matches.map(m => 
        m.id === match.id 
          ? { ...m, duration_slots: newSlots, match_date: newMatchDate.toISOString() }
          : m
      );
      setMatches(updatedMatches);
    };

    const handleMouseUp = async () => {
      if (!resizingMatchState) return;

      const { match, startSlots, startDate } = resizingMatchState;
      const currentMatch = matches.find(m => m.id === match.id);
      if (!currentMatch) {
        setResizingMatchState(null);
        return;
      }

      const currentSlots = Math.max(currentMatch.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS);
      const newMatchDate = new Date(currentMatch.match_date);

      // Если ничего не изменилось, просто сбрасываем состояние
      if (currentSlots === startSlots && newMatchDate.getTime() === startDate.getTime()) {
        setResizingMatchState(null);
        return;
      }

      // Отправляем запрос в фоне
      try {
        const token = localStorage.getItem('auth_token');
        const year = newMatchDate.getFullYear();
        const month = String(newMatchDate.getMonth() + 1).padStart(2, '0');
        const day = String(newMatchDate.getDate()).padStart(2, '0');
        const hours = String(newMatchDate.getHours()).padStart(2, '0');
        const minutes = String(newMatchDate.getMinutes()).padStart(2, '0');
        const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        const response = await fetch(`/api/tournament/${tournamentId}/schedule/match/duration`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            matchId: match.id,
            durationSlots: currentSlots,
            matchDate: dateTimeString,
          }),
        });

        if (!response.ok) {
          // Откатываем изменения
          const originalMatch = matches.find(m => m.id === match.id);
          if (originalMatch) {
            setMatches(matches.map(m => 
              m.id === match.id ? originalMatch : m
            ));
          }
          const error = await response.json();
          alert(`${t('error')}: ${error.error}`);
        }
      } catch (error) {
        // Откатываем изменения
        const originalMatch = matches.find(m => m.id === match.id);
        if (originalMatch) {
          setMatches(matches.map(m => 
            m.id === match.id ? originalMatch : m
          ));
        }
        console.error('Error updating match duration:', error);
        alert(t('errorUpdatingMatch'));
      } finally {
        setResizingMatchState(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingMatchState, matches, tournamentId, t]);

  const handleChangeMatchDuration = async (match: Match, action: 'increase' | 'decrease', direction?: 'top' | 'bottom') => {
    const currentSlots = match.duration_slots || MIN_DURATION_SLOTS;
    const newSlots = action === 'increase' 
      ? Math.min(currentSlots + 1, 8) // Увеличиваем максимум до 8 слотов (2 часа)
      : Math.max(currentSlots - 1, MIN_DURATION_SLOTS); // Минимум 2 слота (30 минут)
    
    if (newSlots === currentSlots) return;

    let newMatchDate = new Date(match.match_date);
    
    // Для верхней границы: изменение длительности с сохранением конца матча
    if (direction === 'top') {
      if (action === 'increase') {
        // Увеличиваем длительность, сдвигая начало назад на 15 минут (конец остается на месте)
        newMatchDate.setMinutes(newMatchDate.getMinutes() - 15);
      } else if (action === 'decrease') {
        // Уменьшаем длительность, сдвигая начало вперед на 15 минут (конец остается на месте)
        newMatchDate.setMinutes(newMatchDate.getMinutes() + 15);
      }
    }
    // Для нижней границы: изменение длительности с сохранением начала матча
    // (newMatchDate не меняется, меняется только duration_slots)

    // Оптимистичное обновление
    const updatedMatches = matches.map(m => 
      m.id === match.id 
        ? { ...m, duration_slots: newSlots, match_date: newMatchDate.toISOString() }
        : m
    );
    setMatches(updatedMatches);

    // Отправляем запрос в фоне
    try {
      const token = localStorage.getItem('auth_token');
      const year = newMatchDate.getFullYear();
      const month = String(newMatchDate.getMonth() + 1).padStart(2, '0');
      const day = String(newMatchDate.getDate()).padStart(2, '0');
      const hours = String(newMatchDate.getHours()).padStart(2, '0');
      const minutes = String(newMatchDate.getMinutes()).padStart(2, '0');
      const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      const response = await fetch(`/api/tournament/${tournamentId}/schedule/match/duration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: match.id,
          durationSlots: newSlots,
          matchDate: dateTimeString, // Обновляем время начала, если изменили через верхнюю границу
        }),
      });

      if (!response.ok) {
        // Откатываем изменения
        setMatches(matches);
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      }
    } catch (error) {
      // Откатываем изменения
      setMatches(matches);
      console.error('Error updating match duration:', error);
      alert(t('errorUpdatingMatch'));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMatch || !editForm.matchDate || !editForm.courtNumber) {
      alert(t('fillAllFields'));
      return;
    }

    setSavingEdit(true);
    try {
      const token = localStorage.getItem('auth_token');
      const newDateTime = new Date(editForm.matchDate);
      const newCourtNumber = parseInt(editForm.courtNumber);

      // Сохраняем текущее состояние для отката
      const previousMatches = [...matches];

      // Оптимистичное обновление - сразу обновляем локальное состояние
      const updatedMatches = matches.map(m => 
        m.id === editingMatch.id 
          ? { ...m, match_date: newDateTime.toISOString(), court_number: newCourtNumber }
          : m
      );
      setMatches(updatedMatches);
      
      // Сохраняем выделение карточки
      const savedCardId = selectedCardId;
      
      setEditingMatch(null);
      setEditForm({ matchDate: '', courtNumber: '' });

      // Отправляем запрос в фоне
      const response = await fetch(`/api/tournament/${tournamentId}/schedule/match`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: editingMatch.id,
          matchDate: editForm.matchDate,
          courtNumber: newCourtNumber,
        }),
      });

      if (!response.ok) {
        // Если запрос не удался, откатываем изменения
        setMatches(previousMatches);
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      } else {
        // Восстанавливаем выделение карточки после успешного обновления
        if (savedCardId) {
          setSelectedCardId(savedCardId);
        }
      }
    } catch (error) {
      // Если ошибка, откатываем изменения
      setMatches(matches);
      console.error('Error updating match:', error);
      alert(t('errorUpdatingMatch'));
    } finally {
      setSavingEdit(false);
    }
  };

  // Состояния для touch-событий на мобильных
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; matchId: number; element: HTMLElement } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const handleDragStart = (match: Match) => {
    // Разрешаем перетаскивание только если карточка выделена
    if (selectedCardId !== match.id) {
      return;
    }
    setDraggedMatch(match);
  };

  // Обработчики для touch-событий на мобильных
  const handleTouchStart = (e: React.TouchEvent, match: Match) => {
    if (selectedCardId !== match.id) return;
    
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      matchId: match.id,
      element,
    });
    setIsDragging(false);
    setDraggedMatch(match);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Если движение достаточно большое, начинаем перетаскивание
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
      setDragOffset({
        x: touch.clientX - touchStart.x,
        y: touch.clientY - touchStart.y,
      });
      
      // Визуальная обратная связь - добавляем класс для стилизации
      if (touchStart.element) {
        touchStart.element.style.transform = `translate(${touch.clientX - touchStart.x}px, ${touch.clientY - touchStart.y}px)`;
        touchStart.element.style.opacity = '0.8';
        touchStart.element.style.zIndex = '1000';
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging) {
      setTouchStart(null);
      setIsDragging(false);
      setDragOffset(null);
      return;
    }

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Ищем элемент с атрибутом data-slot и data-court
    let targetElement = elementBelow;
    while (targetElement && !targetElement.hasAttribute('data-slot')) {
      targetElement = targetElement.parentElement;
    }

    if (targetElement && targetElement.hasAttribute('data-slot')) {
      const targetSlot = targetElement.getAttribute('data-slot');
      const targetCourt = parseInt(targetElement.getAttribute('data-court') || '0');
      
      if (targetSlot) {
        handleDrop(targetSlot, targetCourt);
      }
    }

    // Сбрасываем визуальные эффекты
    if (touchStart.element) {
      touchStart.element.style.transform = '';
      touchStart.element.style.opacity = '';
      touchStart.element.style.zIndex = '';
    }

    setTouchStart(null);
    setIsDragging(false);
    setDragOffset(null);
    setDraggedMatch(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetSlot: string, targetCourt: number) => {
    if (!draggedMatch) return;

    const slotDate = new Date(targetSlot);
    const newDateTime = new Date(slotDate);
    
    // Сохраняем текущее состояние для отката
    const previousMatches = [...matches];
    const savedCardId = selectedCardId;
    
    // Округляем до ближайших 15 минут для точного позиционирования
    const roundedMinutes = Math.round(newDateTime.getMinutes() / 15) * 15;
    newDateTime.setMinutes(roundedMinutes, 0, 0); // Обнуляем секунды и миллисекунды
    
    // Форматируем для datetime-local
    const year = newDateTime.getFullYear();
    const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(newDateTime.getDate()).padStart(2, '0');
    const hours = String(newDateTime.getHours()).padStart(2, '0');
    const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Оптимистичное обновление - сразу обновляем локальное состояние
    const updatedMatches = matches.map(m => 
      m.id === draggedMatch.id 
        ? { ...m, match_date: newDateTime.toISOString(), court_number: targetCourt }
        : m
    );
    setMatches(updatedMatches);
    setDraggedMatch(null);

    // Отправляем запрос в фоне
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tournament/${tournamentId}/schedule/match`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: draggedMatch.id,
          matchDate: dateTimeString,
          courtNumber: targetCourt,
        }),
      });

      if (!response.ok) {
        // Если запрос не удался, откатываем изменения
        setMatches(previousMatches);
        const error = await response.json();
        alert(`${t('error')}: ${error.error}`);
      } else {
        // Восстанавливаем выделение карточки после успешного обновления
        if (savedCardId) {
          setSelectedCardId(savedCardId);
        }
      }
    } catch (error) {
      // Если ошибка, откатываем изменения
      setMatches(previousMatches);
      console.error('Error updating match:', error);
      alert(t('errorUpdatingMatch'));
    }
  };

  const generateTimeSlots = (startDate: Date, endDate: Date, intervalMinutes: number = 15) => {
    const slots: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    return slots;
  };

  // Определяем диапазон времени для календаря
  const timeSlotsList = useMemo(() => {
  let minDate: Date;
  let maxDate: Date;
  
  if (filterDays.length > 0) {
    // Если выбраны конкретные дни, используем их
    const selectedDates = filterDays.map(d => new Date(d + 'T00:00:00'));
    minDate = new Date(Math.min(...selectedDates.map(d => d.getTime())));
    maxDate = new Date(Math.max(...selectedDates.map(d => d.getTime())));
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);
  } else if (timeRange) {
    // Используем установленный диапазон
    minDate = new Date(timeRange.start);
    maxDate = new Date(timeRange.end);
  } else if (filteredMatches.length > 0) {
    // Используем диапазон из отфильтрованных матчей
    const allDates = filteredMatches.map(m => new Date(m.match_date));
    minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);
  } else {
    // Fallback - используем текущую дату с расширенным диапазоном
    minDate = new Date();
    minDate.setHours(6, 0, 0, 0);
    maxDate = new Date();
    maxDate.setHours(23, 0, 0, 0);
  }

    return generateTimeSlots(minDate, maxDate, 15);
  }, [filterDays, timeRange, filteredMatches]);

  // Фильтруем слоты: сворачиваем ранние часы (00:00-08:00) если collapsedEarlyHours = true
  const filteredTimeSlots = useMemo(() => {
    if (!collapsedEarlyHours) return timeSlotsList;
    
    return timeSlotsList.filter(slot => {
      const hour = slot.getHours();
      return hour >= 8; // Показываем только с 08:00
    });
  }, [timeSlotsList, collapsedEarlyHours]);

  // Проверяем, есть ли слоты в диапазоне 00:00-08:00
  const hasEarlyHours = useMemo(() => {
    return timeSlotsList.some(slot => {
      const hour = slot.getHours();
      return hour >= 0 && hour < 8;
    });
  }, [timeSlotsList]);

  // Вычисляем общую высоту календаря (в пикселях)
  // Вычисляем на основе разницы между первым и последним слотом
  // Это гарантирует правильную высоту даже при пропусках времени
  const calendarHeight = useMemo(() => {
    if (filteredTimeSlots.length === 0) return 0;
    const firstSlotTime = filteredTimeSlots[0]?.getTime() || 0;
    const lastSlotTime = filteredTimeSlots[filteredTimeSlots.length - 1]?.getTime() || firstSlotTime;
    const diffMs = lastSlotTime - firstSlotTime;
    const diffMinutes = diffMs / (60 * 1000);
    // Добавляем один слот (80px) для последнего слота
    return ((diffMinutes / 15) * 80) + 80;
  }, [filteredTimeSlots]);
  
  // Вычисляем позицию и высоту для каждого матча
  const getMatchPosition = (match: Match) => {
    const matchStart = new Date(match.match_date);
    // Округляем начало матча до ближайших 15 минут для точного позиционирования
    const roundedMinutes = Math.round(matchStart.getMinutes() / 15) * 15;
    matchStart.setMinutes(roundedMinutes, 0, 0);
    
    const matchStartTime = matchStart.getTime();
    const durationSlots = Math.max(match.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS);
    
    // Находим первый слот календаря для вычисления относительной позиции
    const firstSlotTime = filteredTimeSlots[0]?.getTime() || matchStartTime;
    
    // Вычисляем разницу во времени между началом матча и первым слотом
    const diffMs = matchStartTime - firstSlotTime;
    const diffMinutes = diffMs / (60 * 1000);
    
    // Вычисляем позицию: каждый 15-минутный слот = 80px
    const top = Math.max(0, (diffMinutes / 15) * 80);
    const height = durationSlots * 80;
    
    return { top, height };
  };

  // Обработчик клика вне карточки для снятия выделения
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Проверяем, что клик не по карточке и не по её границам
      if (!target.closest('.match-card')) {
        setSelectedCardId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (loading) {
    return <div className="text-text-secondary font-poppins">{t('loadingSchedule')}</div>;
  }

  return (
    <div className="bg-background-secondary rounded-lg border border-border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-poppins font-bold text-text">
          {t('schedule')} - {t('adminPanel')}
        </h2>
        <div className="flex gap-2 items-center">
          {hasEarlyHours && (
            <button
              onClick={() => setCollapsedEarlyHours(!collapsedEarlyHours)}
              className="px-3 py-1 bg-background border border-border rounded text-sm hover:border-primary transition-colors font-poppins"
              title={collapsedEarlyHours ? t('expandEarlyHours') : t('collapseEarlyHours')}
            >
              {collapsedEarlyHours ? '↓ 00:00-08:00' : '↑ 00:00-08:00'}
            </button>
          )}
          {timeRange && (
            <>
              <button
                onClick={() => {
                  const newStart = new Date(timeRange.start);
                  newStart.setHours(newStart.getHours() - 2);
                  setTimeRange({ start: newStart, end: timeRange.end });
                }}
                className="px-3 py-1 bg-background border border-border rounded text-sm hover:border-primary transition-colors font-poppins"
                title={t('expandTimeRange')}
              >
                ← {t('expandLeft')}
              </button>
              <button
                onClick={() => {
                  const newEnd = new Date(timeRange.end);
                  newEnd.setHours(newEnd.getHours() + 2);
                  setTimeRange({ start: timeRange.start, end: newEnd });
                }}
                className="px-3 py-1 bg-background border border-border rounded text-sm hover:border-primary transition-colors font-poppins"
                title={t('expandTimeRange')}
              >
                {t('expandRight')} →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-1">
              {t('search')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
            />
          </div>
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-1">
              {t('category')}
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-1">
              {t('stage') || 'Этап'}
            </label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as 'groups' | 'playoff' | '')}
              className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
            >
              <option value="">{t('allStages') || 'Всі етапи'}</option>
              <option value="groups">{t('groups') || 'Групи'}</option>
              <option value="playoff">{t('playoff') || 'Play Off'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-1">
              {t('court')}
            </label>
            <select
              value={filterCourt === null ? '' : filterCourt}
              onChange={(e) => setFilterCourt(e.target.value === '' ? null : parseInt(e.target.value))}
              className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
            >
              <option value="">{t('allCourts')}</option>
              {courts.map(court => (
                <option key={court} value={court}>{t('court')} {court}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterCourt(null);
                setFilterStage('');
                setFilterDays([]);
              }}
              className="w-full px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
        
        {/* Фильтр по дням */}
        {availableDays.length > 0 && (
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-2">
              {t('filterByDays')}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterDays([])}
                className={`px-3 py-1 rounded text-sm font-poppins transition-colors ${
                  filterDays.length === 0
                    ? 'bg-primary text-background'
                    : 'bg-background border border-border text-text hover:border-primary'
                }`}
              >
                {t('allDays')}
              </button>
              {availableDays.map(day => {
                const date = new Date(day + 'T00:00:00');
                const isToday = date.toDateString() === new Date().toDateString();
                const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                let dayLabel = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
                if (isToday) dayLabel = `${dayLabel} (${t('today')})`;
                else if (isTomorrow) dayLabel = `${dayLabel} (${t('tomorrow')})`;
                
                return (
                  <button
                    key={day}
                    onClick={() => {
                      if (filterDays.includes(day)) {
                        setFilterDays(filterDays.filter(d => d !== day));
                      } else {
                        setFilterDays([...filterDays, day]);
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm font-poppins transition-colors ${
                      filterDays.includes(day)
                        ? 'bg-primary text-background'
                        : 'bg-background border border-border text-text hover:border-primary'
                    }`}
                  >
                    {dayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Календарь расписания */}
      {showSchedule ? (
        <div className="relative">
          {/* Кнопка сворачивания календаря (fixed справа, ниже кнопки темы) */}
          <button
            onClick={() => setShowSchedule(false)}
            className="fixed right-6 z-50 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins text-sm shadow-lg"
            style={{ top: 'calc(50% + 3rem)', transform: 'translateY(-50%)' }}
          >
            {t('hideSchedule')}
          </button>
          <div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Заголовки кортов */}
          <div className="grid gap-2 mb-2 sticky top-0 bg-background-secondary z-10 border-b border-border pb-2" style={{ gridTemplateColumns: gridTemplateColumnsValue }}>
            <div className="font-poppins font-semibold text-text p-2">{t('timeSlot')}</div>
            {courts.length > 0 ? courts.map(court => (
              <div key={court} className="font-poppins font-semibold text-text p-2 text-center">
                {t('court')} {court}
              </div>
            )) : (
              <div className="font-poppins font-semibold text-text p-2 text-center">
                {t('noCourts')}
              </div>
            )}
          </div>

          {/* Кнопка развернуть ранние часы, если они свернуты */}
          {collapsedEarlyHours && hasEarlyHours && (
            <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: gridTemplateColumnsValue }}>
              <div className="font-poppins text-text-secondary p-2 text-sm sticky left-0 bg-background-secondary border-r border-border">
                <button
                  onClick={() => setCollapsedEarlyHours(false)}
                  className="w-full text-left text-primary hover:underline font-poppins text-xs"
                >
                  ↓ {t('expandEarlyHours')} (00:00 - 08:00)
                </button>
              </div>
              {courts.map(court => (
                <div key={court} className="border border-dashed border-border rounded-lg p-2 bg-background/30"></div>
              ))}
            </div>
          )}

          {/* Календарь с абсолютным позиционированием */}
          <div className="relative" style={{ display: 'grid', gridTemplateColumns: gridTemplateColumnsValue, gap: '0.5rem' }}>
            {/* Временная шкала слева */}
            <div className="sticky left-0 bg-background-secondary border-r border-border z-20 relative" style={{ height: `${calendarHeight}px` }}>
              {filteredTimeSlots.map((slot, idx) => {
                const slotKey = slot.toISOString();
                const prevSlot = idx > 0 ? filteredTimeSlots[idx - 1] : null;
                const showDate = idx === 0 || (prevSlot && prevSlot.toDateString() !== slot.toDateString());
                      
                      // Вычисляем позицию на основе времени для согласованности с разметкой
                      const firstSlotTime = filteredTimeSlots[0]?.getTime() || slot.getTime();
                      const diffMs = slot.getTime() - firstSlotTime;
                      const diffMinutes = diffMs / (60 * 1000);
                      const topPosition = (diffMinutes / 15) * 80;
                
                return (
                  <div
                    key={idx}
                    className="border-b border-border/25 relative"
                    style={{ 
                      height: '80px',
                      position: 'absolute',
                            top: `${topPosition}px`,
                      left: 0,
                      right: 0,
                      pointerEvents: 'none'
                    }}
                  >
                    {showDate && (
                      <div className="font-semibold mb-1 text-text p-2 text-sm">
                        {formatDateSlot(slotKey)}
                      </div>
                    )}
                    <div className={`font-poppins text-text-secondary p-2 text-sm ${showDate ? '' : 'mt-6'}`}>
                      {formatTimeSlot(slotKey)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Колонки кортов с абсолютным позиционированием карточек */}
            {courts.length > 0 ? courts.map(court => {
              // Находим все матчи на этом корте
              const courtMatches = filteredMatches.filter(m => m.court_number === court);
              
              return (
                <div
                  key={court}
                  className="relative border border-border rounded-lg bg-background"
                        style={{ 
                          height: `${calendarHeight}px`,
                          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 79px, rgba(148, 163, 184, 0.1) 79px, rgba(148, 163, 184, 0.1) 80px)`,
                          backgroundSize: `100% ${calendarHeight}px`
                        }}
                  data-court={court}
                  data-slot={filteredTimeSlots[0]?.toISOString() || ''}
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedMatch) return;
                    
                    // Вычисляем время на основе точной позиции drop
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    
                    // Вычисляем точное время на основе позиции мыши
                    // Каждый 15-минутный слот = 80px
                    const slotHeight = 80;
                          const slotIndex = Math.max(0, Math.floor(y / slotHeight));
                    const positionInSlot = y % slotHeight;
                    
                    // Определяем точное время: базовое время слота + пропорциональная часть
                    if (slotIndex >= 0 && slotIndex < filteredTimeSlots.length) {
                            const baseSlot = new Date(filteredTimeSlots[slotIndex]);
                            
                            // Вычисляем смещение в минутах внутри слота (0-15 минут)
                      const minutesOffset = Math.round((positionInSlot / slotHeight) * 15);
                      
                            // Создаем целевое время
                      const targetTime = new Date(baseSlot);
                      targetTime.setMinutes(targetTime.getMinutes() + minutesOffset);
                      
                            // Округляем до ближайших 15 минут для точного позиционирования
                      const roundedMinutes = Math.round(targetTime.getMinutes() / 15) * 15;
                            targetTime.setMinutes(roundedMinutes, 0, 0); // Обнуляем секунды и миллисекунды
                      
                      handleDrop(targetTime.toISOString(), court);
                    }
                  }}
                >
                          {/* Сетка временных слотов (подложка) - рисуем для всех слотов */}
                  {filteredTimeSlots.map((slot, idx) => {
                    const slotTime = slot.getTime();
                    const slotEndTime = slotTime + 15 * 60 * 1000;
                            
                            // Вычисляем позицию на основе времени, а не индекса
                            // Это гарантирует правильное позиционирование даже при пропусках времени
                            const firstSlotTime = filteredTimeSlots[0]?.getTime() || slotTime;
                            const diffMs = slotTime - firstSlotTime;
                            const diffMinutes = diffMs / (60 * 1000);
                            const topPosition = (diffMinutes / 15) * 80;
                    
                    // Проверяем, есть ли матч, который пересекает эту линию
                    const hasMatchOnLine = courtMatches.some(match => {
                      const matchStart = new Date(match.match_date).getTime();
                      const effectiveSlots = Math.max(match.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS);
                      const matchDuration = effectiveSlots * 15 * 60 * 1000;
                      const matchEnd = matchStart + matchDuration;
                      
                      // Матч пересекает эту линию (начинается до или на линии, заканчивается после)
                      return (matchStart <= slotTime && matchEnd > slotTime) || 
                             (matchStart < slotEndTime && matchEnd >= slotEndTime) ||
                             (matchStart >= slotTime && matchEnd <= slotEndTime);
                    });
                            
                            // Определяем, является ли это началом нового дня
                            const prevSlot = idx > 0 ? filteredTimeSlots[idx - 1] : null;
                            const isNewDay = !prevSlot || prevSlot.toDateString() !== slot.toDateString();
                    
                    return (
                      <div
                                key={`slot-${slotTime}`}
                                className={`border-b absolute left-0 right-0 ${
                                  hasMatchOnLine 
                                    ? 'border-border/5' 
                                    : isNewDay 
                                      ? 'border-border/30' 
                                      : 'border-border/15'
                                }`}
                        style={{
                                  top: `${topPosition}px`,
                          height: '80px',
                                  pointerEvents: 'none',
                                  zIndex: 1
                        }}
                      />
                    );
                  })}
                  
                  {/* Карточки матчей с абсолютным позиционированием */}
                  {courtMatches.map(match => {
                    const { top, height } = getMatchPosition(match);
                    const currentSlots = Math.max(match.duration_slots || MIN_DURATION_SLOTS, MIN_DURATION_SLOTS);
                    const pair1Name = getPairLabel(match, 1);
                    const pair2Name = getPairLabel(match, 2);
                    const pair1Score = match.pair1_games;
                    const pair2Score = match.pair2_games;
                    const resultRecorded = pair1Score !== null && pair2Score !== null;
                    const pair1ScoreDisplay = pair1Score !== null ? pair1Score : '—';
                    const pair2ScoreDisplay = pair2Score !== null ? pair2Score : '—';
                    const scoreboardClass = resultRecorded
                      ? 'bg-background/80 border border-primary/30 backdrop-blur-sm shadow-inner'
                      : 'bg-yellow-500/10 border border-yellow-400/40 backdrop-blur-sm';
                    const scoreColor = resultRecorded ? 'text-primary' : 'text-text-secondary/70';
                    const startTimeLabel = formatTimeSlot(match.match_date);
                    const endTime = new Date(new Date(match.match_date).getTime() + currentSlots * 15 * 60 * 1000);
                    const endTimeLabel = endTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                    const isSelected = selectedCardId === match.id;
                    const isTopBorderHovered = hoveredBorder?.matchId === match.id && hoveredBorder?.border === 'top';
                    const isBottomBorderHovered = hoveredBorder?.matchId === match.id && hoveredBorder?.border === 'bottom';

                    return (
                      <div
                        key={match.id}
                        draggable={isSelected}
                        onDragStart={() => handleDragStart(match)}
                        onTouchStart={(e) => handleTouchStart(e, match)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                          // Предотвращаем клик, если было перетаскивание
                          if (isDragging) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          e.stopPropagation();
                          setSelectedCardId(match.id);
                        }}
                        className={`match-card absolute left-1 right-1 rounded-2xl p-3 text-xs flex flex-col relative z-10 bg-gradient-to-br from-primary/15 via-background/65 to-accent/10 border transition-all touch-none ${
                          isSelected 
                            ? 'border-primary shadow-lg shadow-primary/20 cursor-move' 
                            : 'border-primary/20 shadow-lg shadow-primary/10 cursor-pointer hover:border-primary/40'
                        } ${isDragging && touchStart?.matchId === match.id ? 'opacity-80 scale-105' : ''}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: `${height}px`
                        }}
                      >
                        {/* Верхняя граница для drag-and-drop изменения начала */}
                        <div 
                          className={`absolute -top-2 left-0 right-0 h-4 flex items-center justify-center transition-opacity z-30 ${
                            isTopBorderHovered && isSelected ? 'opacity-100' : 'opacity-0'
                          } cursor-ns-resize`}
                          onMouseEnter={() => setHoveredBorder({ matchId: match.id, border: 'top' })}
                          onMouseLeave={() => setHoveredBorder(null)}
                          onMouseDown={(e) => handleResizeStart(e, match, 'top')}
                          title={t('resizeTop')}
                        >
                          <div className="w-full h-1 bg-primary rounded-full"></div>
                          <div className="absolute left-1/2 -translate-x-1/2 text-primary text-lg font-bold">
                            ↕
                          </div>
                        </div>

                        {/* Нижняя граница для drag-and-drop изменения конца */}
                        <div 
                          className={`absolute -bottom-2 left-0 right-0 h-4 flex items-center justify-center transition-opacity z-30 ${
                            isBottomBorderHovered && isSelected ? 'opacity-100' : 'opacity-0'
                          } cursor-ns-resize`}
                          onMouseEnter={() => setHoveredBorder({ matchId: match.id, border: 'bottom' })}
                          onMouseLeave={() => setHoveredBorder(null)}
                          onMouseDown={(e) => handleResizeStart(e, match, 'bottom')}
                          title={t('resizeBottom')}
                        >
                          <div className="w-full h-1 bg-primary rounded-full"></div>
                          <div className="absolute left-1/2 -translate-x-1/2 text-primary text-lg font-bold">
                            ↕
                          </div>
                        </div>

                        {/* Результат или галочка - в правом верхнем углу */}
                        {resultRecorded && (
                          <div className="absolute top-2 right-2 z-30">
                            <div className="w-5 h-5 bg-green-500/90 rounded-full flex items-center justify-center shadow-md shadow-green-500/30">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5 h-full font-poppins text-xs">
                          <div className={`rounded-lg px-2 py-1.5 transition-colors ${scoreboardClass}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-text leading-tight truncate">{pair1Name}</span>
                              <span className={`text-sm font-orbitron ${scoreColor} flex-shrink-0`}>{pair1ScoreDisplay}</span>
                            </div>
                            <div className="border-t border-border/15 my-1"></div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-text leading-tight truncate">{pair2Name}</span>
                              <span className={`text-sm font-orbitron ${scoreColor} flex-shrink-0`}>{pair2ScoreDisplay}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[0.06em] text-text-secondary">
                            <span className="px-1.5 py-0.5 rounded-full bg-background/70 border border-border/25 font-semibold">
                              {startTimeLabel}—{endTimeLabel}
                            </span>
                            {match.category && (
                              <span className="px-1.5 py-0.5 rounded-full bg-background/60 border border-border/20 font-semibold">
                                {getCategoryLabel(match.category)}
                              </span>
                            )}
                                  {(() => {
                                    const groupName = match.group_name?.toLowerCase() || '';
                                    const isPlayoff = groupName.includes('match') || 
                                                     groupName.includes('quarterfinal') ||
                                                     groupName.includes('semifinal') ||
                                                     groupName.includes('final') ||
                                                     groupName.includes('playoff');
                                    
                                    if (isPlayoff) {
                                      let stageLabel = t('playoff') || 'Play Off';
                                      if (groupName.includes('quarterfinal')) {
                                        stageLabel = t('quarterfinals') || 'Quarterfinals';
                                      } else if (groupName.includes('semifinal')) {
                                        stageLabel = t('semifinals') || 'Semifinals';
                                      } else if (groupName.includes('final') && !groupName.includes('semifinal')) {
                                        stageLabel = t('final') || 'Final';
                                      }
                                      return (
                                        <span className="px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 font-semibold text-primary">
                                          {stageLabel}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                          </div>

                          <div className="mt-auto flex gap-1.5 text-[10px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Сохраняем выделение карточки
                              setSelectedCardId(match.id);
                              setEditingMatch(match);
                              const date = new Date(match.match_date);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              setEditForm({
                                matchDate: `${year}-${month}-${day}T${hours}:${minutes}`,
                                courtNumber: (match.court_number || 1).toString(),
                              });
                            }}
                            className="flex-1 px-2 py-1 bg-background/70 border border-border/40 rounded-full font-semibold text-text hover:border-primary/60 transition-colors"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Сохраняем выделение карточки
                              setSelectedCardId(match.id);
                              setSelectedMatch(match);
                              setResultForm({
                                pair1Games: match.pair1_games?.toString() || '',
                                pair2Games: match.pair2_games?.toString() || '',
                              });
                            }}
                            className="flex-1 px-2 py-1 bg-gradient-to-r from-primary to-accent text-background rounded-full font-semibold tracking-[0.06em] uppercase hover:opacity-90 transition-opacity"
                          >
                            {resultRecorded ? t('result') : t('addResult')}
                          </button>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }) : (
              <div className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center text-xs text-text-secondary" style={{ height: `${calendarHeight}px` }}>
                {t('noCourts')}
              </div>
            )}
          </div>
        </div>
      </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <button
            onClick={() => setShowSchedule(true)}
            className="px-6 py-3 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins font-semibold"
          >
            {t('schedule')}
          </button>
        </div>
      )}

      {/* Модальное окно для редактирования времени/корта */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('editMatch')}
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-1">
                  {t('dateTime')}
                </label>
                <input
                  type="datetime-local"
                  value={editForm.matchDate}
                  onChange={(e) => setEditForm({ ...editForm, matchDate: e.target.value })}
                  step="900"
                  className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-1">
                  {t('court')}
                </label>
                <select
                  value={editForm.courtNumber}
                  onChange={(e) => setEditForm({ ...editForm, courtNumber: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
                >
                  {courts.map(court => (
                    <option key={court} value={court}>{t('court')} {court}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins disabled:opacity-50"
              >
                {savingEdit ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => {
                  setEditingMatch(null);
                  setEditForm({ matchDate: '', courtNumber: '' });
                }}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода результата */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-background-secondary rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl shadow-primary/10">
            <h3 className="text-xl font-poppins font-bold mb-6 text-text">
              {t('enterResult')}
            </h3>

            {selectedMatchTimeInfo && (
              <div className="mb-6 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-text-secondary">
                  <span className="px-3 py-1 rounded-full bg-background border border-border/40 font-semibold">
                    {selectedMatchTimeInfo.range}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-background border border-border/40 font-semibold">
                    {selectedMatchTimeInfo.dateLabel}
                  </span>
                  {selectedMatchTimeInfo.courtLabel && (
                    <span className="px-3 py-1 rounded-full bg-background border border-border/40 font-semibold">
                      {selectedMatchTimeInfo.courtLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {selectedMatchPairs.map((pair, index) => (
                <div
                  key={pair.key}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-background/70 border border-border/40 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-text-secondary">
                      {`${t('pair')} ${index + 1}`}
                    </span>
                    <span className="text-base font-semibold text-text leading-tight">
                      {pair.label}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={pair.value}
                    onChange={(e) =>
                      setResultForm((prev) => ({ ...prev, [pair.key]: e.target.value }))
                    }
                    className="w-20 text-center text-lg font-orbitron bg-background border border-border/60 rounded-xl py-2 px-3 text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition-shadow"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSaveResult(selectedMatch)}
                disabled={savingResult}
                className="flex-1 h-11 bg-gradient-to-r from-primary to-accent text-background rounded-full font-poppins font-semibold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingResult ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setResultForm({ pair1Games: '', pair2Games: '' });
                }}
                className="h-11 px-6 bg-background-secondary text-text border border-border/50 rounded-full hover:border-primary transition-colors font-poppins font-semibold uppercase tracking-[0.12em]"
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

