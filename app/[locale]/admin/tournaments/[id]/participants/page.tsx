'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ExportButton from '@/components/ExportButton';

interface CategoryPartner {
  name: string;
  email: string;
  phone?: string;
  tshirtSize?: string;
}

interface Participant {
  id: number;
  userId: string | null;
  orderNumber?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  partnerName: string | null;
  partnerEmail: string | null;
  categories: string[];
  categoryPartners?: Record<string, CategoryPartner>; // Партнеры для каждой категории
  confirmed: boolean;
  token: string;
  createdAt: string;
  isDemo: boolean;
  tshirtSize?: string;
  telegram?: string;
  message?: string;
  partnerTshirtSize?: string;
  partnerPhone?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentDate?: string;
  locale?: string;
  parentUserId?: string | null; // ID родителя для детей
  parentName?: string | null; // Имя родителя для детей
  registrationType?: 'participant' | 'guest'; // Тип регистрации
  adultsCount?: number | null; // Для гостей - количество взрослых
  childrenCount?: number | null; // Для гостей - количество детей
  guestChildren?: Array<{ age: number }> | null; // Для гостей - возраст детей
}

export default function TournamentParticipantsPage() {
  const t = useTranslations('Admin');
  const tTournaments = useTranslations('Tournaments');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const tournamentId = parseInt(params.id as string, 10);

  const getLocalizedDefaultCategories = useCallback(() => ({
    male1: tTournaments('categories.male1'),
    male2: tTournaments('categories.male2'),
    female1: tTournaments('categories.female1'),
    female2: tTournaments('categories.female2'),
    mixed1: tTournaments('categories.mixed1'),
    mixed2: tTournaments('categories.mixed2'),
  }), [tTournaments]);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<Record<string, string>>(() => getLocalizedDefaultCategories());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Participant>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [emailParticipant, setEmailParticipant] = useState<Participant | null>(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Фильтры и поиск
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterHasPartner, setFilterHasPartner] = useState<'all' | 'yes' | 'no'>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'pending' | 'paid' | 'refunded'>('all');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

  const categoryEntries = Object.entries(customCategories);

  // Функция для получения цвета категории
  const getCategoryColor = (code: string): string => {
    const colorMap: Record<string, string> = {
      male1: '#3b82f6',    // blue
      male2: '#8b5cf6',    // purple
      female1: '#ec4899',  // pink
      female2: '#f59e0b',  // amber
      mixed1: '#10b981',   // emerald
      mixed2: '#ef4444',   // red
      Guest: '#6b7280',    // gray
    };
    return colorMap[code] || '#6b7280';
  };

  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<number | null>(null);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  
  // Состояния для выбора партнера (из списка или вручную) для каждой категории
  const [partnerManualMode, setPartnerManualMode] = useState<Record<string, boolean>>({});
  const [selectedPartnerRegistrationId, setSelectedPartnerRegistrationId] = useState<Record<string, string>>({});
  
  // Состояния для множественного выбора участников
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; participantId: number | null; name: string }>({
    isOpen: false,
    participantId: null,
    name: '',
  });

  // Функция для копирования в буфер обмена
  const copyToClipboard = async (text: string, fieldId: string) => {
    if (!text || text === '—' || text === '-') return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Компонент для отображения поля с иконкой копирования
  const CopyableField = ({ 
    value, 
    fieldId, 
    children, 
    className = '' 
  }: { 
    value: string | null | undefined; 
    fieldId: string; 
    children?: React.ReactNode;
    className?: string;
  }) => {
    const displayValue = value || '—';
    const isCopied = copiedField === fieldId;
    const canCopy = value && value !== '—' && value !== '-';

    return (
      <div className={`flex items-center gap-1.5 group ${className}`}>
        <span 
          className={canCopy ? 'cursor-pointer hover:text-primary transition-colors' : ''}
          onClick={() => canCopy && copyToClipboard(value!, fieldId)}
        >
          {children || displayValue}
        </span>
        {canCopy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(value!, fieldId);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary/20 rounded"
            title={isCopied ? tTournaments('copied') || 'Скопировано' : tTournaments('copy') || 'Копировать'}
          >
            {isCopied ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-text-secondary hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

  const renderCategorySelector = (
    participant: Participant,
    onToggle: (category: string) => void
  ) => {
    // Добавляем категорию Guest к списку категорий
    const allCategoryEntries = [
      ...categoryEntries,
      ['Guest', tTournaments('categories.Guest') || 'Guest']
    ];

    if (allCategoryEntries.length === 0) {
      return <span className="text-xs text-text-secondary">-</span>;
    }

    const selectedCategories = participant.categories || [];
    const isOpen = openCategoryDropdown === participant.id;

    return (
      <div className="relative">
        {/* Кликабельный элемент с выбранными категориями */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenCategoryDropdown(isOpen ? null : participant.id);
          }}
          className="w-full px-3 py-2 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg text-text text-xs font-medium hover:from-primary/30 hover:to-primary/20 transition-all duration-200 flex items-center justify-between gap-2 group"
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedCategories.length > 0 ? (
              selectedCategories.map((cat) => {
                const categoryName = customCategories[cat] || (cat === 'Guest' ? (tTournaments('categories.Guest') || 'Guest') : cat);
                return (
                  <span
                    key={cat}
                    className="px-2 py-0.5 bg-primary/40 text-primary rounded-md font-semibold text-[10px] uppercase tracking-wide"
                  >
                    {categoryName}
                  </span>
                );
              })
            ) : (
              <span className="text-text-secondary italic">Выберите категории</span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Выпадающее меню с галочками */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenCategoryDropdown(null)}
            />
            <div className="absolute z-20 mt-1 w-64 bg-background-secondary border border-border rounded-lg shadow-xl p-2 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {allCategoryEntries.map(([code, name]) => {
                  const isSelected = selectedCategories.includes(code);
                  return (
                    <label
                      key={code}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background cursor-pointer transition-colors group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            onToggle(code);
                          }}
                          className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary checked:border-primary transition-all"
                          style={{
                            backgroundImage: isSelected
                              ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")"
                              : 'none',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-primary' : 'text-text'}`}>
                        {name}
                      </span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Объявляем функции загрузки данных до useEffect, который их использует
  const fetchTournament = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const tournament = data.tournaments?.find((t: any) => t.id === tournamentId);
        if (tournament) {
          setTournamentName(tournament.name);
          setCustomCategories(tournament.customCategories || getLocalizedDefaultCategories());
        }
      }
    } catch (err) {
      console.error('Error fetching tournament:', err);
    }
  }, [token, tournamentId, getLocalizedDefaultCategories]);

  const fetchParticipants = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const formattedParticipants: Participant[] = (data.registrations || []).map((participant: any, index: number) => ({
          ...participant,
          userId: participant.userId ?? participant.user_id ?? null,
          orderNumber: participant.orderNumber ?? participant.order_number ?? index + 1,
          categories: participant.categories || [],
          categoryPartners: participant.categoryPartners || participant.category_partners || {},
          registrationType: participant.registrationType || 'participant',
          adultsCount: participant.adultsCount ?? null,
          childrenCount: participant.childrenCount ?? null,
          guestChildren: participant.guestChildren ?? null,
        }));
        setParticipants(formattedParticipants);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching participants:', errorData);
        setError(errorData.error || tTournaments('participantsLoadError'));
      }
    } catch (err: any) {
      console.error('Error fetching participants:', err);
      setError(err.message || tTournaments('participantsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [token, tournamentId, tTournaments]);

  useEffect(() => {
    // Устанавливаем token только на клиенте, чтобы избежать проблем с гидратацией
    if (typeof window !== 'undefined') {
      // Проверяем localStorage
      let foundToken = localStorage.getItem('auth_token');
      
      // Если нет в localStorage, проверяем cookies
      if (!foundToken) {
        const cookies = document.cookie.split('; ');
        const authCookie = cookies.find(row => row.startsWith('auth_token='));
        if (authCookie) {
          const cookieToken = authCookie.split('=')[1];
          if (cookieToken) {
            foundToken = cookieToken;
            // Сохраняем в localStorage для удобства
            localStorage.setItem('auth_token', cookieToken);
          }
        }
      }
      
      if (foundToken) {
        setToken(foundToken);
      }
      setTokenChecked(true);
    }
  }, []);

  useEffect(() => {
    // Не проверяем доступ, пока токен не проверен
    if (!tokenChecked) {
      console.log('[Participants] Token check not completed yet, waiting...');
      return;
    }

    // Если токен не найден после проверки, редиректим на логин
    if (!token) {
      console.log('[Participants] No token found after check, redirecting to login');
      setLoading(false);
      setError('Authentication required');
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 0);
      return;
    }

    if (isNaN(tournamentId)) {
      setError('Invalid tournament ID');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Проверяем доступ к турниру
      try {
        console.log('[Participants] Starting auth check with token:', token.substring(0, 10) + '...');
        const authResponse = await fetch('/api/auth/login', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Отправляем cookies автоматически
        });
        
        if (!authResponse.ok) {
          console.error('[Participants] Auth check failed:', authResponse.status);
          setLoading(false);
          setError('Authentication failed');
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 0);
          return;
        }

        const authData = await authResponse.json();
        console.log('[Participants] Auth data:', { hasSession: !!authData.session, role: authData.session?.role });
        
        if (!authData.session) {
          console.error('[Participants] No session found');
          setLoading(false);
          setError('No active session');
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 0);
          return;
        }

        const role = authData.session.role;
        // Superadmin имеет доступ ко всем турнирам
        if (role === 'superadmin') {
          console.log('[Participants] Superadmin access granted, loading data...');
          try {
            await fetchTournament();
            await fetchParticipants();
            console.log('[Participants] Data loaded successfully');
          } catch (err) {
            console.error('[Participants] Error loading data:', err);
            setError('Failed to load tournament data');
            setLoading(false);
          }
          return;
        }

        // Для других ролей проверяем доступ к конкретному турниру
        console.log('[Participants] Checking tournament access for role:', role);
        const accessResponse = await fetch(`/api/admin/tournaments/${tournamentId}/check-access`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Отправляем cookies автоматически
        });

        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          if (accessData.hasAccess) {
            console.log('[Participants] Tournament access granted, loading data...');
            try {
              await fetchTournament();
              await fetchParticipants();
              console.log('[Participants] Data loaded successfully');
            } catch (err) {
              console.error('[Participants] Error loading data:', err);
              setError('Failed to load tournament data');
              setLoading(false);
            }
          } else {
            console.log('[Participants] Tournament access denied');
            setError('You do not have access to this tournament');
            setLoading(false);
            setTimeout(() => {
              router.push(`/${locale}/admin/tournaments`);
            }, 2000);
          }
        } else {
          console.error('[Participants] Failed to verify tournament access:', accessResponse.status);
          setError('Failed to verify tournament access');
          setLoading(false);
        }
      } catch (error) {
        console.error('[Participants] Error loading tournament data:', error);
        setError('Failed to load tournament data');
        setLoading(false);
      }
    };

    loadData();
  }, [token, tokenChecked, tournamentId, locale, router, fetchTournament, fetchParticipants]);

  // Close category filter dropdown when clicking outside
  useEffect(() => {
    if (!categoryFilterOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const categoryFilterElement = target.closest('[data-category-filter]');
      
      if (!categoryFilterElement) {
        setCategoryFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryFilterOpen]);

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setEditFormData({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      phone: participant.phone,
      telegram: participant.telegram || '',
      tshirtSize: participant.tshirtSize || '',
      message: participant.message || '',
      partnerName: participant.partnerName || '',
      partnerEmail: participant.partnerEmail || '',
      partnerTshirtSize: participant.partnerTshirtSize || '',
      partnerPhone: participant.partnerPhone || '',
      paymentStatus: participant.paymentStatus || 'pending',
      categories: participant.categories || [],
      categoryPartners: participant.categoryPartners || {},
      userId: participant.userId || null,
      registrationType: participant.registrationType || 'participant',
      adultsCount: participant.adultsCount || null,
      childrenCount: participant.childrenCount || null,
      guestChildren: participant.guestChildren || null,
    });
    
    // Инициализируем режимы выбора партнера для каждой категории
    const initialManualMode: Record<string, boolean> = {};
    const initialSelectedIds: Record<string, string> = {};
    (participant.categories || []).forEach(category => {
      // Если партнер уже есть, проверяем есть ли он в списке участников
      const partner = (participant.categoryPartners || {})[category];
      if (partner && partner.email) {
        // Проверяем, есть ли участник с таким email
        const foundParticipant = participants.find(p => p.email === partner.email && p.id !== participant.id);
        if (foundParticipant) {
          initialManualMode[category] = false;
          initialSelectedIds[category] = foundParticipant.id.toString();
        } else {
          initialManualMode[category] = true;
        }
      } else {
        initialManualMode[category] = false;
      }
    });
    setPartnerManualMode(initialManualMode);
    setSelectedPartnerRegistrationId(initialSelectedIds);
  };

  const handleSave = async () => {
    if (!token || !editingParticipant) return;

    try {
      setError(null);
      const payload = {
        ...editFormData,
        categories: editFormData.categories || [],
        categoryPartners: editFormData.categoryPartners || {},
        adultsCount: editFormData.adultsCount,
        childrenCount: editFormData.childrenCount,
        guestChildren: editFormData.guestChildren,
      };

      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${editingParticipant.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(tTournaments('participantUpdated'));
        fetchParticipants();
        setEditingParticipant(null);
        setEditFormData({});
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || tTournaments('participantUpdateError'));
      }
    } catch (err) {
      setError(tTournaments('participantUpdateError'));
    }
  };

  const handlePaymentStatusChange = async (participantId: number, newStatus: 'pending' | 'paid' | 'refunded') => {
    if (!token) return;

    try {
      setError(null);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: newStatus,
          paymentDate: newStatus === 'paid' ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        setSuccess(tTournaments('paymentStatusUpdated'));
        fetchParticipants();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || tTournaments('paymentStatusUpdateError'));
      }
    } catch (err) {
      setError(tTournaments('paymentStatusUpdateError'));
    }
  };

  const handleSendEmail = async () => {
    if (!token || !selectedEmailTemplate) return;

    try {
      setSendingEmail(true);
      setError(null);
      
      // Определяем список участников для отправки
      let participantIds: number[] = [];
      if (emailParticipant?.id) {
        participantIds = [emailParticipant.id];
      } else if (selectedParticipants.size > 0) {
        participantIds = Array.from(selectedParticipants);
      } else {
        setError(t('participants.noParticipantSelected') || 'No participant selected');
        return;
      }

      // Отправляем email всем выбранным участникам
      const promises = participantIds.map(async (participantId) => {
        const participant = participants.find(p => p.id === participantId);
        const participantLocale = participant?.locale || locale;

        const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants/${participantId}/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template: selectedEmailTemplate,
            locale: participantLocale,
          }),
        });

        const data = await response.json();
        return { response, data, participantId, ok: response.ok };
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));

      if (successful > 0) {
        setSuccess(t('participants.emailSentTo', { count: successful }) || `Email sent to ${successful} participant(s)`);
        if (failed.length > 0) {
          // Проверяем первую ошибку для детального сообщения
          const firstFailed = failed.find(r => r.status === 'fulfilled');
          if (firstFailed && firstFailed.status === 'fulfilled') {
            const { data } = firstFailed.value;
            let errorMessage = data.error || t('participants.emailSendError') || 'Failed to send email';
            
            if (data.message) {
              errorMessage = data.message;
            } else if (data.missingFields && Array.isArray(data.missingFields)) {
              const missingFieldsText = t('participants.templateRequiresAdditionalData') || 'Template requires additional data';
              const missingFieldsList = t('participants.missingFields') || 'Missing fields';
              const requiredDataStructure = t('participants.requiredDataStructure') || 'Required data structure';
              errorMessage = `${missingFieldsText}:\n\n${missingFieldsList}:\n${data.missingFields.map((field: string) => `  • ${field}`).join('\n')}`;
              if (data.requiredData) {
                errorMessage += `\n\n${requiredDataStructure}:\n${JSON.stringify(data.requiredData, null, 2)}`;
              }
            }
            
            setError(t('participants.failedToSendTo', { count: failed.length }) + ':\n' + errorMessage);
          } else {
            setError(`Не удалось отправить ${failed.length} участнику(ам)`);
          }
        }
        setShowEmailModal(false);
        setEmailParticipant(null);
        setSelectedEmailTemplate('');
        setSelectedParticipants(new Set());
        setIsSelectAll(false);
        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 5000);
      } else {
        // Все отправки провалились
        const firstResult = results.find(r => r.status === 'fulfilled');
        if (firstResult && firstResult.status === 'fulfilled') {
          const { data } = firstResult.value;
          let errorMessage = data.error || t('participants.emailSendError') || 'Failed to send email';
          
          if (data.message) {
            errorMessage = data.message;
          } else if (data.missingFields && Array.isArray(data.missingFields)) {
            const missingFieldsText = t('participants.templateRequiresAdditionalData') || 'Template requires additional data';
            const missingFieldsList = t('participants.missingFields') || 'Missing fields';
            const requiredDataStructure = t('participants.requiredDataStructure') || 'Required data structure';
            errorMessage = `${missingFieldsText}:\n\n${missingFieldsList}:\n${data.missingFields.map((field: string) => `  • ${field}`).join('\n')}`;
            if (data.requiredData) {
              errorMessage += `\n\n${requiredDataStructure}:\n${JSON.stringify(data.requiredData, null, 2)}`;
            }
          }
          
          setError(errorMessage);
        } else {
          setError(t('participants.emailSendError') || 'Failed to send email');
        }
      }
    } catch (err) {
      setError(t('participants.emailSendError') || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCategoryToggle = async (participantId: number, category: string) => {
    if (!token) return;

    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    const currentCategories = participant.categories || [];
    const isSelected = currentCategories.includes(category);
    const updatedCategories = isSelected
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    try {
      setError(null);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: updatedCategories,
        }),
      });

      if (response.ok) {
        setSuccess(tTournaments('participantCategoryUpdated'));
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId ? { ...p, categories: updatedCategories } : p
          )
        );
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || tTournaments('participantCategoryUpdateError'));
      }
    } catch (err) {
      setError(tTournaments('participantCategoryUpdateError'));
    }
  };

  // Групповые действия
  const handleBulkMarkAsPaid = async () => {
    if (!token || selectedParticipants.size === 0) return;

    try {
      setError(null);
      const participantIds = Array.from(selectedParticipants);
      
      // Отмечаем всех выбранных участников как оплачено
      const promises = participantIds.map(participantId =>
        fetch(`/api/tournament/${tournamentId}/registrations/${participantId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentStatus: 'paid',
            paymentDate: new Date().toISOString(),
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        setSuccess(`Успешно обновлено: ${successful} участник(ов)`);
        if (failed > 0) {
          setError(`Не удалось обновить: ${failed} участник(ов)`);
        }
        setSelectedParticipants(new Set());
        setIsSelectAll(false);
        fetchParticipants();
        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 3000);
      } else {
        setError('Не удалось обновить статус оплаты');
      }
    } catch (err) {
      setError('Ошибка при обновлении статуса оплаты');
    }
  };

  const handleDeleteClick = (participantId: number, firstName: string, lastName: string) => {
    setDeleteConfirm({
      isOpen: true,
      participantId,
      name: `${firstName} ${lastName}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteConfirm.participantId) return;

    try {
      setError(null);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${deleteConfirm.participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const deletedTranslation = tTournaments('participantDeleted');
        // Если перевод не найден (возвращается ключ), используем fallback
        const deletedMessage = deletedTranslation && deletedTranslation.startsWith('Tournaments.participantDeleted')
          ? 'Participant deleted successfully.'
          : deletedTranslation || 'Participant deleted successfully.';
        setSuccess(deletedMessage);
        // Снимаем выделение после удаления
        setSelectedParticipants(prev => {
          const newSet = new Set(prev);
          newSet.delete(deleteConfirm.participantId!);
          return newSet;
        });
        setIsSelectAll(false);
        fetchParticipants();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || tTournaments('participantDeleteError') || 'Ошибка при удалении участника');
      }
    } catch (err) {
      setError(tTournaments('participantDeleteError') || 'Ошибка при удалении участника');
    } finally {
      setDeleteConfirm({ isOpen: false, participantId: null, name: '' });
    }
  };

  const handleEditCategoryToggle = (category: string) => {
    setEditFormData((prev) => {
      const current = prev.categories || [];
      const next = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      
      // При удалении категории удаляем и партнера для этой категории
      const updatedPartners = { ...(prev.categoryPartners as Record<string, CategoryPartner> || {}) };
      if (!next.includes(category)) {
        delete updatedPartners[category];
      } else if (!updatedPartners[category]) {
        // При добавлении категории создаем пустого партнера, если его нет
        updatedPartners[category] = {
          name: '',
          email: '',
          phone: '',
          tshirtSize: '',
        };
      }
      
      return { ...prev, categories: next, categoryPartners: updatedPartners };
    });
  };

  if (loading) {
    return (
      <div className="w-full px-3 py-6">
        <div className="text-center py-12 text-text-secondary">{tTournaments('loading')}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full px-3 pr-6 pb-12">
        <div className="mb-6">
          <Link
            href={`/${locale}/admin/tournaments`}
            className="text-text-secondary hover:text-primary transition-colors mb-4 inline-block"
          >
            ← {tTournaments('backToTournaments')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-poppins font-bold gradient-text">
                {tTournaments('participants')} {tournamentName && `- ${tournamentName}`}
              </h1>
              {participants.length > 0 && (
                <p className="text-text-tertiary mt-2">
                  {tTournaments('totalParticipants', { count: participants.length })}
                </p>
              )}
            </div>
            <button
              onClick={async () => {
                setLoading(true);
                await fetchParticipants();
                setLoading(false);
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-poppins font-medium"
              title={tTournaments('refresh') || 'Refresh'}
            >
              <svg 
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{tTournaments('refresh') || 'Refresh'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-5 backdrop-blur-sm shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-text font-poppins font-bold text-base mb-2 flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Требуется дополнительная информация
                  </span>
                </h3>
                <pre className="text-text-secondary font-mono text-sm leading-relaxed whitespace-pre-wrap break-words bg-background/50 rounded-lg p-4 border border-border/50">
                  {error}
                </pre>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-text font-poppins font-semibold text-lg">{success}</p>
            </div>
          </div>
        )}

        {/* Фильтры и поиск */}
        <div className="mb-6 bg-background-secondary rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Поиск по имени */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {tTournaments('search')}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tTournaments('searchPlaceholder')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Фильтр по наличию партнера */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {tTournaments('filterPartner')}
              </label>
              <select
                value={filterHasPartner}
                onChange={(e) => setFilterHasPartner(e.target.value as 'all' | 'yes' | 'no')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">{tTournaments('filterAll')}</option>
                <option value="yes">{tTournaments('filterHasPartner')}</option>
                <option value="no">{tTournaments('filterNoPartner')}</option>
              </select>
            </div>

            {/* Фильтр по статусу оплаты */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {tTournaments('paymentStatus')}
              </label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value as 'all' | 'pending' | 'paid' | 'refunded')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">{tTournaments('filterAll')}</option>
                <option value="pending">{tTournaments('paymentPending')}</option>
                <option value="paid">{tTournaments('paymentPaid')}</option>
                <option value="refunded">{tTournaments('paymentRefunded')}</option>
              </select>
            </div>

            {/* Фильтр по категориям */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {tTournaments('filterCategory')}
              </label>
              <div className="relative" data-category-filter>
                <div 
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => setCategoryFilterOpen(!categoryFilterOpen)}
                  data-category-filter
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Цветные индикаторы выбранных категорий */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {filterCategories.length === 0 ? (
                        <>
                          <span className="text-text text-xs font-medium">{tTournaments('filterCategory')}</span>
                          <span className="text-text-secondary text-xs">({tTournaments('filterAll')})</span>
                        </>
                      ) : (
                        <>
                          <span className="text-text text-xs font-medium">{tTournaments('filterCategory')}</span>
                          {filterCategories.slice(0, 6).map((code) => (
                            <div
                              key={code}
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryColor(code) }}
                              title={customCategories[code] || (code === 'Guest' ? (tTournaments('categories.Guest') || 'Guest') : code)}
                            />
                          ))}
                        </>
                      )}
                    </div>
                    {/* Счетчик выбранных категорий */}
                    {filterCategories.length > 0 && (
                      <span className="text-xs font-medium text-text-secondary bg-background-secondary px-2 py-0.5 rounded-full flex-shrink-0">
                        {filterCategories.length}/{categoryEntries.length + 1}
                      </span>
                    )}
                  </div>
                  <svg 
                    className={`w-4 h-4 text-text-secondary flex-shrink-0 ml-2 transition-transform ${categoryFilterOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {categoryFilterOpen && (
                  <div
                    className="absolute z-50 w-full mt-1 bg-background-secondary border border-border rounded-lg shadow-xl max-h-72 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    data-category-filter
                  >
                    <div className="p-1.5 space-y-0.5">
                      {[
                        ...categoryEntries,
                        ['Guest', tTournaments('categories.Guest') || 'Guest']
                      ].map(([code, name]) => {
                        const isSelected = filterCategories.includes(code);
                        const categoryColor = getCategoryColor(code);
                        return (
                          <label
                            key={code}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-background cursor-pointer transition-colors group"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterCategories([...filterCategories, code]);
                                } else {
                                  setFilterCategories(filterCategories.filter(c => c !== code));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-2 border-primary/50 bg-background text-primary focus:ring-1 focus:ring-primary/50 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary checked:border-primary transition-all flex-shrink-0"
                              style={{
                                backgroundImage: isSelected
                                  ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")"
                                  : 'none',
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                              }}
                            />
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryColor }}
                            />
                            <span className={`text-xs font-medium flex-1 ${isSelected ? 'text-primary' : 'text-text'}`}>
                              {name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка сброса фильтров */}
          {(searchQuery || filterHasPartner !== 'all' || filterPaymentStatus !== 'all' || filterCategories.length > 0) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterHasPartner('all');
                  setFilterPaymentStatus('all');
                  setFilterCategories([]);
                }}
                className="px-4 py-2 bg-background border border-border rounded-lg text-text text-sm hover:bg-background-hover transition-colors"
              >
                {tTournaments('clearFilters')}
              </button>
            </div>
          )}
        </div>

        <div className="bg-background-secondary rounded-lg border border-border">
          <div className="overflow-x-auto w-full">
            {/* Панель групповых действий */}
            {selectedParticipants.size > 0 && (
              <div className="mb-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-text font-poppins font-bold text-base">
                        {t('participants.selectedParticipants') || 'Selected Participants'}: {selectedParticipants.size}
                      </h3>
                      <p className="text-text-secondary text-sm">{t('participants.selectActionForSelected') || 'Select action for selected participants'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleBulkMarkAsPaid}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-poppins font-semibold text-sm hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('participants.markAsPaid') || 'Mark as Paid'}
                    </button>
                    <button
                      onClick={() => {
                        // Открываем модальное окно для отправки email выбранным участникам
                        setShowEmailModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-poppins font-semibold text-sm hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('participants.sendEmail') || 'Send Email'} ({selectedParticipants.size})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedParticipants(new Set());
                        setIsSelectAll(false);
                      }}
                      className="px-4 py-2 bg-background-secondary border border-border text-text rounded-lg font-poppins font-semibold text-sm hover:bg-background transition-colors"
                    >
                      {t('participants.cancelSelection') || 'Cancel Selection'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Export button */}
            <div className="p-4 border-b border-border flex justify-end">
              <ExportButton
                data={participants.map((participant, index) => ({
                  '#': participant.orderNumber || index + 1,
                  'User ID': participant.userId || '-',
                  'Name': `${participant.firstName} ${participant.lastName}`,
                  'Email': participant.email || '-',
                  'Phone': participant.phone || '-',
                  'Categories': participant.categories?.join(', ') || '-',
                  'Payment Status': participant.paymentStatus || '-',
                  'Registered At': participant.createdAt ? new Date(participant.createdAt).toLocaleString(locale) : '-',
                }))}
                columns={[
                  { key: '#', label: '#' },
                  { key: 'User ID', label: 'User ID' },
                  { key: 'Name', label: 'Name' },
                  { key: 'Email', label: 'Email' },
                  { key: 'Phone', label: 'Phone' },
                  { key: 'Categories', label: 'Categories' },
                  { key: 'Payment Status', label: 'Payment Status' },
                  { key: 'Registered At', label: 'Registered At' },
                ]}
                filename={`participants-${tournamentName || 'tournament'}`}
                metadata={{
                  fileId: `EXP-${tournamentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  tournamentName: tournamentName || `Tournament #${tournamentId}`,
                  documentType: tTournaments('participants') || 'Tournament Participants Table',
                  exportedAt: new Date().toISOString(), // Используем ISO формат для избежания проблем с гидратацией
                  exportedBy: 'Admin',
                  userMessage: participants
                    .filter(p => p.message)
                    .map(p => `${p.firstName} ${p.lastName} (${p.email}): ${p.message}`)
                    .join('; ') || undefined,
                  totalParticipants: participants.length,
                  confirmedParticipants: participants.filter(p => p.confirmed).length,
                }}
              />
            </div>

            <table className="w-full border-collapse min-w-[1400px]">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap w-12">
                    <input
                      type="checkbox"
                      checked={isSelectAll}
                      onChange={(e) => {
                        setIsSelectAll(e.target.checked);
                        if (e.target.checked) {
                          const allIds = participants.map(p => p.id);
                          setSelectedParticipants(new Set(allIds));
                        } else {
                          setSelectedParticipants(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary checked:border-primary transition-all"
                      style={{
                        backgroundImage: isSelectAll
                          ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")"
                          : 'none',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[60px]">
                    {tTournaments('participantOrder')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap w-24">
                    {tTournaments('participantUserId')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[150px]">
                    {tTournaments('participantName')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[180px]">
                    {tTournaments('participantEmail')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[120px]">
                    {tTournaments('participantPhone')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[180px]">
                    {tTournaments('participantCategory')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[150px]">
                    {tTournaments('participantPartner')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[100px]">
                    {tTournaments('tshirtSize')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[130px]">
                    {tTournaments('paymentStatus')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap min-w-[100px]">
                    {tTournaments('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-text-secondary">
                      {tTournaments('noParticipants')}
                    </td>
                  </tr>
                ) : (
                  (() => {
                    // Фильтрация участников
                    let filtered = participants;
                    
                    // Поиск по имени участника, партнера, email и телефону
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      filtered = filtered.filter(p => {
                        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                        const partnerName = (p.partnerName || '').toLowerCase();
                        const email = (p.email || '').toLowerCase();
                        const phone = (p.phone || '').toLowerCase();
                        const categoryPartners = Object.values(p.categoryPartners || {}).map(cp => cp.name.toLowerCase()).join(' ');
                        const categoryPartnersEmails = Object.values(p.categoryPartners || {}).map(cp => (cp.email || '').toLowerCase()).join(' ');
                        const categoryPartnersPhones = Object.values(p.categoryPartners || {}).map(cp => (cp.phone || '').toLowerCase()).join(' ');
                        return fullName.includes(query) || 
                               partnerName.includes(query) || 
                               email.includes(query) || 
                               phone.includes(query) ||
                               categoryPartners.includes(query) ||
                               categoryPartnersEmails.includes(query) ||
                               categoryPartnersPhones.includes(query);
                      });
                    }
                    
                    // Фильтр по наличию партнера
                    if (filterHasPartner === 'yes') {
                      filtered = filtered.filter(p => 
                        p.partnerName || 
                        (p.categoryPartners && Object.keys(p.categoryPartners).length > 0)
                      );
                    } else if (filterHasPartner === 'no') {
                      filtered = filtered.filter(p => 
                        !p.partnerName && 
                        (!p.categoryPartners || Object.keys(p.categoryPartners).length === 0)
                      );
                    }
                    
                    // Фильтр по статусу оплаты
                    if (filterPaymentStatus !== 'all') {
                      filtered = filtered.filter(p => p.paymentStatus === filterPaymentStatus);
                    }
                    
                    // Фильтр по категориям
                    if (filterCategories.length > 0) {
                      filtered = filtered.filter(p => 
                        p.categories && p.categories.some(cat => filterCategories.includes(cat))
                      );
                    }
                    
                    // Проверка на дубликаты
                    const duplicateCheck = (p: Participant) => {
                      const duplicates = participants.filter(other => 
                        other.id !== p.id && (
                          (other.firstName === p.firstName && other.lastName === p.lastName && other.email === p.email) ||
                          (other.phone && p.phone && other.phone === p.phone) ||
                          (other.email === p.email)
                        )
                      );
                      return duplicates.length > 0;
                    };
                    
                    return filtered.map((participant) => {
                      const isDuplicate = duplicateCheck(participant);
                      const isSelected = selectedParticipants.has(participant.id);
                      return (
                    <tr 
                      key={participant.id} 
                      className={`border-b border-border hover:bg-background/50 transition-colors ${isDuplicate ? 'bg-red-500/10 border-red-500/50' : ''} ${isSelected ? 'bg-primary/10 border-primary/30' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelected = new Set(selectedParticipants);
                            if (e.target.checked) {
                              newSelected.add(participant.id);
                            } else {
                              newSelected.delete(participant.id);
                            }
                            setSelectedParticipants(newSelected);
                            setIsSelectAll(newSelected.size === participants.length);
                          }}
                          className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary checked:border-primary transition-all"
                          style={{
                            backgroundImage: isSelected
                              ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")"
                              : 'none',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-text text-center">
                        {participant.orderNumber ?? '—'}
                      </td>
                      <td className="px-2 py-2 text-xs font-mono text-text">
                        <CopyableField 
                          value={participant.userId} 
                          fieldId={`userId-${participant.id}`}
                        >
                          {participant.userId ? (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold truncate block max-w-[80px]">
                              {participant.userId.substring(0, 6)}...
                            </span>
                          ) : (
                            <span className="text-text-secondary text-[10px]">—</span>
                          )}
                        </CopyableField>
                      </td>
                      <td className="px-3 py-2 text-xs text-text">
                        <CopyableField 
                          value={`${participant.firstName} ${participant.lastName}${participant.parentName ? ` (${participant.parentName}, ${participant.userId || 'N/A'})` : ''}`}
                          fieldId={`name-${participant.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {participant.firstName} {participant.lastName}
                              {participant.parentName && (
                                <span className="text-xs text-text-tertiary ml-2">
                                  ({participant.parentName}, ID: {participant.parentUserId || 'N/A'})
                                </span>
                              )}
                            </span>
                            {participant.isDemo && (
                              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xs whitespace-nowrap">
                                Demo
                              </span>
                            )}
                            {participant.message && participant.message.trim() && (
                              <div className="relative group">
                                <div className="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center cursor-help hover:bg-primary/30 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                  </svg>
                                </div>
                                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-background-secondary border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <div className="text-xs font-poppins text-text-secondary mb-1 font-semibold">
                                    {tTournaments('message') || 'Сообщение от участника'}:
                                  </div>
                                  <div className="text-xs font-poppins text-text whitespace-pre-wrap break-words">
                                    {participant.message}
                                  </div>
                                  <div className="absolute bottom-0 left-4 transform translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CopyableField>
                      </td>
                      <td className="px-3 py-2 text-xs text-text break-all">
                        <CopyableField 
                          value={participant.email} 
                          fieldId={`email-${participant.id}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-text whitespace-nowrap">
                        <CopyableField 
                          value={participant.phone} 
                          fieldId={`phone-${participant.id}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-text">
                        {renderCategorySelector(participant, (category) =>
                          handleCategoryToggle(participant.id, category)
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-text">
                        {participant.registrationType === 'guest' ? (
                          // Отображение информации о гостях
                          <div className="space-y-1">
                            {participant.adultsCount && participant.adultsCount > 0 && (
                              <div className="text-text-secondary">
                                <span className="font-semibold">{participant.adultsCount}</span> {participant.adultsCount === 1 ? (tTournaments('form.adults')?.toLowerCase() || 'adult') : (tTournaments('form.adults') || 'adults')}
                              </div>
                            )}
                            {participant.childrenCount && participant.childrenCount > 0 && (
                              <div className="text-text-secondary">
                                <span className="font-semibold">{participant.childrenCount}</span> {participant.childrenCount === 1 ? (tTournaments('form.children')?.toLowerCase() || 'child') : (tTournaments('form.children') || 'children')}
                                {participant.guestChildren && Array.isArray(participant.guestChildren) && participant.guestChildren.length > 0 && (
                                  <span className="text-text-tertiary ml-1">
                                    ({participant.guestChildren.map((child: any) => child.age).filter((age: number) => age > 0).join(', ')} {tTournaments('form.yearsOld') || 'years old'})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : participant.categories && participant.categories.length > 0 ? (
                          <div className="space-y-1">
                            {participant.categories.map((cat) => {
                              const partner = participant.categoryPartners?.[cat];
                              const partnerName = partner?.name || participant.partnerName || '—';
                              const categoryName = customCategories[cat] || (cat === 'Guest' ? (tTournaments('categories.Guest') || 'Guest') : cat);
                              // Проверка на одинакового партнера в разных категориях
                              const samePartnerInOtherCategories = participant.categories.filter(
                                otherCat => otherCat !== cat && 
                                (participant.categoryPartners?.[otherCat]?.name === partnerName || 
                                 (otherCat === participant.categories[0] && participant.partnerName === partnerName))
                              ).length > 0;
                              
                              return (
                                <div key={cat} className={`flex items-center gap-2 ${samePartnerInOtherCategories && partnerName !== '—' ? 'bg-red-500/20 border border-red-500 rounded px-2 py-1' : ''}`}>
                                  <span className="text-[10px] font-semibold text-primary/70 uppercase">
                                    {categoryName}:
                                  </span>
                                  <CopyableField 
                                    value={partnerName} 
                                    fieldId={`partner-${participant.id}-${cat}`}
                                    className="flex-1"
                                  />
                                  {samePartnerInOtherCategories && partnerName !== '—' && (
                                    <span className="text-[9px] text-red-500 font-semibold" title={tTournaments('samePartnerError') || 'Один партнер не может быть в разных категориях'}>
                                      ⚠
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <CopyableField 
                            value={participant.partnerName} 
                            fieldId={`partner-${participant.id}`}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-text whitespace-nowrap">{participant.tshirtSize || '-'}</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePaymentStatusChange(participant.id, 'pending')}
                            className={`p-1.5 rounded transition-colors ${
                              participant.paymentStatus === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-background-secondary text-text-secondary hover:bg-yellow-500/10 hover:text-yellow-400'
                            }`}
                            title={tTournaments('paymentPending')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePaymentStatusChange(participant.id, 'paid')}
                            className={`p-1.5 rounded transition-colors ${
                              participant.paymentStatus === 'paid'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-background-secondary text-text-secondary hover:bg-green-500/10 hover:text-green-400'
                            }`}
                            title={tTournaments('paymentPaid')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePaymentStatusChange(participant.id, 'refunded')}
                            className={`p-1.5 rounded transition-colors ${
                              participant.paymentStatus === 'refunded'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-background-secondary text-text-secondary hover:bg-red-500/10 hover:text-red-400'
                            }`}
                            title={tTournaments('paymentRefunded')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEmailParticipant(participant);
                              setSelectedEmailTemplate('');
                              setShowEmailModal(true);
                            }}
                            className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors"
                            title={t('participants.sendEmail') || 'Send Email'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(participant)}
                            className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                            title={tTournaments('edit')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(participant.id, participant.firstName, participant.lastName)}
                            className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                            title={tTournaments('delete')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingParticipant && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-2xl font-poppins font-bold gradient-text">
                  {tTournaments('editParticipant')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingParticipant(null);
                    setEditFormData({});
                  }}
                  className="text-text-secondary hover:text-text transition-colors p-2 rounded-lg hover:bg-background"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {tTournaments('participantUserId')}
                    </label>
                    <div className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-mono text-xs break-all overflow-wrap-anywhere">
                      {editingParticipant.userId || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {tTournaments('participantOrder')}
                    </label>
                    <div className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text">
                      {editingParticipant.orderNumber ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {tTournaments('firstName')} *
                    </label>
                    <input
                      type="text"
                      value={editFormData.firstName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {tTournaments('lastName')} *
                    </label>
                    <input
                      type="text"
                      value={editFormData.lastName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {tTournaments('participantEmail')} *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {tTournaments('participantPhone')}
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {tTournaments('telegram')}
                    </label>
                    <input
                      type="text"
                      value={editFormData.telegram || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, telegram: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {tTournaments('tshirtSize')}
                  </label>
                  <select
                    value={editFormData.tshirtSize || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tshirtSize: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  >
                    <option value="">-</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {tTournaments('participantCategory')}
                  </label>
                  {editingParticipant && renderCategorySelector(
                    { ...editingParticipant, categories: editFormData.categories || [] } as Participant,
                    handleEditCategoryToggle
                  )}
                </div>

                {/* Форма редактирования для гостей */}
                {editingParticipant?.registrationType === 'guest' && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-lg font-poppins font-semibold text-text mb-4">
                      {tTournaments('form.guestInfo') || 'Guest Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {tTournaments('form.adultsCount') || 'Number of Adults'} * (max 10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          required
                          value={editFormData.adultsCount || 1}
                          onChange={(e) => setEditFormData({ ...editFormData, adultsCount: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {tTournaments('form.childrenCount') || 'Number of Children'} (max 10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={editFormData.childrenCount || 0}
                          onChange={(e) => {
                            const count = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                            setEditFormData({ 
                              ...editFormData, 
                              childrenCount: count,
                              guestChildren: count > 0 && (!editFormData.guestChildren || editFormData.guestChildren.length !== count)
                                ? Array.from({ length: count }, (_, i) => editFormData.guestChildren?.[i] || { age: 0 })
                                : editFormData.guestChildren
                            });
                          }}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    {editFormData.childrenCount && editFormData.childrenCount > 0 && editFormData.guestChildren && Array.isArray(editFormData.guestChildren) && (
                      <div className="mt-4">
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {tTournaments('form.childrenAges') || 'Children Ages'} *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Array.from({ length: editFormData.childrenCount }, (_, index) => {
                            const guestChildrenArray = editFormData.guestChildren as Array<{ age: number }>;
                            return (
                              <div key={index}>
                                <label className="block text-xs font-poppins text-text-secondary mb-1">
                                  {tTournaments('form.child') || 'Child'} {index + 1} - {tTournaments('form.age') || 'Age'}
                                </label>
                                <select
                                  required
                                  value={guestChildrenArray[index]?.age || ''}
                                  onChange={(e) => {
                                    const newGuestChildren = [...guestChildrenArray];
                                    newGuestChildren[index] = { age: parseInt(e.target.value) || 0 };
                                    setEditFormData({ ...editFormData, guestChildren: newGuestChildren });
                                  }}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm font-poppins focus:outline-none focus:border-primary"
                                >
                                  <option value="">{tTournaments('form.selectAge') || 'Select age'}</option>
                                  {Array.from({ length: 14 }, (_, i) => i + 1).map((age) => (
                                    <option key={age} value={age}>
                                      {age} {tTournaments('form.yearsOld') || 'years old'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Партнеры для каждой категории */}
                {(editFormData.categories || []).length > 0 && editingParticipant?.registrationType !== 'guest' && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-lg font-poppins font-semibold text-text mb-4">
                      {tTournaments('partnerInfo') || 'Partner Information'} {tTournaments('byCategories') || 'by categories'}
                    </h4>
                    <div className="space-y-4">
                      {(editFormData.categories || []).map((category) => {
                        const categoryName = customCategories[category] || (category === 'Guest' ? (tTournaments('categories.Guest') || 'Guest') : category);
                        const partner = (editFormData.categoryPartners as Record<string, CategoryPartner>)?.[category] || {
                          name: editFormData.partnerName || '',
                          email: editFormData.partnerEmail || '',
                          phone: editFormData.partnerPhone || '',
                          tshirtSize: editFormData.partnerTshirtSize || '',
                        };
                        
                        const isManualMode = partnerManualMode[category] || false;
                        const selectedId = selectedPartnerRegistrationId[category] || '';
                        
                        return (
                          <div key={category} className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="text-sm font-poppins font-semibold text-primary mb-3 uppercase">
                              {categoryName}
                            </h5>
                            
                            {/* Переключатель режима выбора партнера */}
                            <div className="mb-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPartnerManualMode({ ...partnerManualMode, [category]: false });
                                  setSelectedPartnerRegistrationId({ ...selectedPartnerRegistrationId, [category]: '' });
                                  // Очищаем данные партнера при переключении
                                  const updatedPartners = {
                                    ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                    [category]: { name: '', email: '', phone: '', tshirtSize: '' },
                                  };
                                  setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                }}
                                className={`px-3 py-1.5 text-xs font-poppins rounded-lg transition-colors ${
                                  !isManualMode
                                    ? 'bg-primary text-background'
                                    : 'bg-background-secondary text-text border border-border'
                                }`}
                              >
                                {tTournaments('selectFromParticipants') || 'Выбрать из участников'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPartnerManualMode({ ...partnerManualMode, [category]: true });
                                  setSelectedPartnerRegistrationId({ ...selectedPartnerRegistrationId, [category]: '' });
                                  // Очищаем данные партнера при переключении
                                  const updatedPartners = {
                                    ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                    [category]: { name: '', email: '', phone: '', tshirtSize: '' },
                                  };
                                  setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                }}
                                className={`px-3 py-1.5 text-xs font-poppins rounded-lg transition-colors ${
                                  isManualMode
                                    ? 'bg-primary text-background'
                                    : 'bg-background-secondary text-text border border-border'
                                }`}
                              >
                                {tTournaments('enterManually') || 'Ввести вручную'}
                              </button>
                            </div>

                            {!isManualMode ? (
                              // Выбор из списка участников
                              <div className="mb-4">
                                <label className="block text-xs font-poppins text-text-secondary mb-1">
                                  {tTournaments('selectPartner') || 'Выбрать партнера'}
                                </label>
                                <select
                                  value={selectedId}
                                  onChange={(e) => {
                                    const selectedParticipantId = e.target.value;
                                    setSelectedPartnerRegistrationId({ ...selectedPartnerRegistrationId, [category]: selectedParticipantId });
                                    
                                    if (selectedParticipantId) {
                                      const selectedParticipant = participants.find(p => p.id.toString() === selectedParticipantId);
                                      if (selectedParticipant) {
                                        const updatedPartners = {
                                          ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                          [category]: {
                                            name: `${selectedParticipant.firstName} ${selectedParticipant.lastName}`,
                                            email: selectedParticipant.email,
                                            phone: selectedParticipant.phone || '',
                                            tshirtSize: selectedParticipant.tshirtSize || '',
                                          },
                                        };
                                        setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                      }
                                    } else {
                                      const updatedPartners = {
                                        ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                        [category]: { name: '', email: '', phone: '', tshirtSize: '' },
                                      };
                                      setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm font-poppins focus:outline-none focus:border-primary"
                                >
                                  <option value="">{tTournaments('selectPartner') || 'Выбрать партнера'}</option>
                                  {participants
                                    .filter(p => p.id !== editingParticipant?.id)
                                    .map((p) => (
                                      <option key={p.id} value={p.id.toString()}>
                                        {p.firstName} {p.lastName} ({p.email})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            ) : (
                              // Ручной ввод
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                                    {tTournaments('partnerName')}
                                  </label>
                                  <input
                                    type="text"
                                    value={partner.name || ''}
                                    onChange={(e) => {
                                      const updatedPartners = {
                                        ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                        [category]: { ...partner, name: e.target.value },
                                      };
                                      setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                    }}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm font-poppins focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                                    {tTournaments('partnerEmail')}
                                  </label>
                                  <input
                                    type="email"
                                    value={partner.email || ''}
                                    onChange={(e) => {
                                      const updatedPartners = {
                                        ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                        [category]: { ...partner, email: e.target.value },
                                      };
                                      setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                    }}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm font-poppins focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                                    {tTournaments('partnerPhone')}
                                  </label>
                                  <input
                                    type="tel"
                                    value={partner.phone || ''}
                                    onChange={(e) => {
                                      const updatedPartners = {
                                        ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                        [category]: { ...partner, phone: e.target.value },
                                      };
                                      setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                    }}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm font-poppins focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-poppins text-text-secondary mb-1">
                                    {tTournaments('partnerTshirtSize')}
                                  </label>
                                  <select
                                    value={partner.tshirtSize || ''}
                                    onChange={(e) => {
                                      const updatedPartners = {
                                        ...(editFormData.categoryPartners as Record<string, CategoryPartner> || {}),
                                        [category]: { ...partner, tshirtSize: e.target.value },
                                      };
                                      setEditFormData({ ...editFormData, categoryPartners: updatedPartners });
                                    }}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text text-sm font-poppins focus:outline-none focus:border-primary"
                                  >
                                    <option value="">-</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {tTournaments('message')}
                  </label>
                  <textarea
                    value={editFormData.message || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingParticipant(null)}
                    className="px-6 py-3 border-2 border-border text-text-secondary font-poppins font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {tTournaments('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {tTournaments('save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Email Modal */}
        {showEmailModal && (emailParticipant || selectedParticipants.size > 0) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-md w-full">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-poppins font-bold gradient-text">
                    {t('participants.sendEmail') || 'Send Email'}
                  </h3>
                  {selectedParticipants.size > 0 && (
                    <p className="text-sm text-text-secondary mt-1">
                      {t('participants.willBeSentTo', { count: selectedParticipants.size }) || `Will be sent to ${selectedParticipants.size} participant(s)`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailParticipant(null);
                    setSelectedEmailTemplate('');
                  }}
                  className="text-text-secondary hover:text-text transition-colors p-2 rounded-lg hover:bg-background"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {emailParticipant && emailParticipant.id && !selectedParticipants.has(emailParticipant.id) ? (
                  <div>
                    <p className="text-sm text-text-secondary font-poppins mb-2">
                      {t('participants.sendEmailTo') || 'Send email to:'}
                    </p>
                    <p className="text-text font-poppins font-semibold">
                      {emailParticipant.firstName} {emailParticipant.lastName}
                    </p>
                    <p className="text-text-secondary font-poppins text-sm">
                      {emailParticipant.email}
                    </p>
                  </div>
                ) : selectedParticipants.size > 0 ? (
                  <div>
                    <p className="text-sm text-text-secondary font-poppins mb-2">
                      {t('participants.sendEmailTo') || 'Send email to:'}
                    </p>
                    <p className="text-text font-poppins font-semibold">
                      {t('participants.selectedCount', { count: selectedParticipants.size }) || `${selectedParticipants.size} selected participants`}
                    </p>
                    <p className="text-text-secondary font-poppins text-sm">
                      {t('participants.emailWillBeSentToEach') || 'Email will be sent to each selected participant in their language'}
                    </p>
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('participants.selectEmailTemplate') || 'Select Email Template'}
                  </label>
                  <select
                    value={selectedEmailTemplate}
                    onChange={(e) => setSelectedEmailTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  >
                    <option value="">{t('participants.selectTemplate') || '-- Select Template --'}</option>
                    
                    {/* Регистрация и подтверждение */}
                    <optgroup label={t('participants.categoryRegistration') || '📋 Registration & Confirmation'}>
                      <option value="email_verification">{t('participants.templateEmailVerification') || 'Email Verification'}</option>
                      <option value="welcome">{t('participants.templateWelcome') || 'Welcome to PadelO₂.com'}</option>
                      <option value="tournament_registration">{t('participants.templateTournamentRegistration') || 'Tournament Registration - We got your registration'}</option>
                      <option value="tournament_confirmed">{t('participants.templateTournamentConfirmed') || 'Tournament Registration - Confirmed'}</option>
                      <option value="tournament_waiting_list">{t('participants.templateWaitingList') || 'Tournament Registration - Waiting List'}</option>
                      <option value="tournament_spot_confirmed">{t('participants.templateSpotConfirmed') || 'Tournament Spot Confirmed (from waiting list)'}</option>
                    </optgroup>

                    {/* Оплата */}
                    <optgroup label={t('participants.categoryPayment') || '💳 Payment'}>
                      <option value="payment_received">{t('participants.templatePaymentReceived') || 'Payment Received / Tournament Entry Paid'}</option>
                      <option value="payment_failed">{t('participants.templatePaymentFailed') || 'Payment Failed / Retry'}</option>
                    </optgroup>

                    {/* Расписание и напоминания */}
                    <optgroup label={t('participants.categorySchedule') || '📅 Schedule & Reminders'}>
                      <option value="tournament_schedule_published">{t('participants.templateSchedulePublished') || 'Tournament Schedule Published'}</option>
                      <option value="match_reminder_1day">{t('participants.templateMatchReminder1Day') || 'Match Reminder - 1 Day Before'}</option>
                      <option value="match_reminder_sameday">{t('participants.templateMatchReminderSameDay') || 'Match Reminder - Same Day'}</option>
                      <option value="schedule_change">{t('participants.templateScheduleChange') || 'Change in Schedule / Court Change'}</option>
                    </optgroup>

                    {/* Результаты и пост-ивенты */}
                    <optgroup label={t('participants.categoryResults') || '🏆 Results & Post-Event'}>
                      <option value="group_stage_results">{t('participants.templateGroupStageResults') || 'Group Stage Results / Qualification Results'}</option>
                      <option value="finals_winners">{t('participants.templateFinalsWinners') || 'Finals & Winners - Congrats'}</option>
                      <option value="post_tournament_recap">{t('participants.templatePostTournamentRecap') || 'Post-Tournament Recap & Photos'}</option>
                      <option value="tournament_feedback">{t('participants.templateTournamentFeedback') || 'Tournament Feedback / NPS'}</option>
                    </optgroup>

                    {/* Отмена/перенос */}
                    <optgroup label={t('participants.categoryCancellation') || '⚠️ Cancellation & Postponement'}>
                      <option value="tournament_cancelled">{t('participants.templateTournamentCancelled') || 'Tournament Cancelled / Postponed'}</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailParticipant(null);
                      setSelectedEmailTemplate('');
                    }}
                    className="px-6 py-3 border-2 border-border text-text-secondary font-poppins font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {tTournaments('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={!selectedEmailTemplate || sendingEmail}
                    className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? (t('participants.sending') || 'Sending...') : (t('participants.send') || 'Send')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title={tTournaments('delete') || 'Delete Participant'}
          message={tTournaments('confirmDeleteParticipant', { name: deleteConfirm.name }) || `Are you sure you want to delete participant ${deleteConfirm.name}? This action cannot be undone.`}
          confirmText={tTournaments('delete') || 'Delete'}
          cancelText={tTournaments('cancel') || 'Cancel'}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm({ isOpen: false, participantId: null, name: '' })}
          variant="danger"
        />
      </div>
    </div>
  );
}

