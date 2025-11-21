'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
}

export default function TournamentParticipantsPage() {
  const t = useTranslations('Admin');
  const tTournaments = useTranslations('Tournaments');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const tournamentId = parseInt(params.id as string, 10);

  const getLocalizedDefaultCategories = () => ({
    male1: tTournaments('categories.male1'),
    male2: tTournaments('categories.male2'),
    female1: tTournaments('categories.female1'),
    female2: tTournaments('categories.female2'),
    mixed1: tTournaments('categories.mixed1'),
    mixed2: tTournaments('categories.mixed2'),
  });

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
  
  // Фильтры и поиск
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterHasPartner, setFilterHasPartner] = useState<'all' | 'yes' | 'no'>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'pending' | 'paid' | 'refunded'>('all');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

  const categoryEntries = Object.entries(customCategories);

  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<number | null>(null);
  
  // Состояния для выбора партнера (из списка или вручную) для каждой категории
  const [partnerManualMode, setPartnerManualMode] = useState<Record<string, boolean>>({});
  const [selectedPartnerRegistrationId, setSelectedPartnerRegistrationId] = useState<Record<string, string>>({});

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
    if (categoryEntries.length === 0) {
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
                const categoryName = customCategories[cat] || cat;
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
                {categoryEntries.map(([code, name]) => {
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    if (isNaN(tournamentId)) {
      setError('Invalid tournament ID');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      await fetchTournament();
      await fetchParticipants();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, token]);

  // Close category filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.getElementById('category-filter-dropdown');
      const trigger = target.closest('.category-filter-trigger');
      
      if (dropdown && !dropdown.contains(target) && !trigger) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTournament = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  };

  const fetchParticipants = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedParticipants: Participant[] = (data.registrations || []).map((participant: any, index: number) => ({
          ...participant,
          userId: participant.userId ?? participant.user_id ?? null,
          orderNumber: participant.orderNumber ?? participant.order_number ?? index + 1,
          categories: participant.categories || [],
          categoryPartners: participant.categoryPartners || participant.category_partners || {},
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
  };

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
    if (!token || !emailParticipant || !selectedEmailTemplate) return;

    try {
      setSendingEmail(true);
      setError(null);
      
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants/${emailParticipant.id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedEmailTemplate,
          locale: emailParticipant.locale || locale,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t('participants.emailSent') || 'Email sent successfully');
        setEmailParticipant(null);
        setSelectedEmailTemplate('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || t('participants.emailSendError') || 'Failed to send email');
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

  const handleDelete = async (participantId: number, firstName: string, lastName: string) => {
    if (!token) return;

    const confirmMessage = tTournaments('confirmDeleteParticipant', { 
      name: `${firstName} ${lastName}` 
    }) || `Вы уверены, что хотите удалить участника ${firstName} ${lastName}? Это действие нельзя отменить.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess(tTournaments('participantDeleted') || 'Участник успешно удален');
        fetchParticipants();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || tTournaments('participantDeleteError') || 'Ошибка при удалении участника');
      }
    } catch (err) {
      setError(tTournaments('participantDeleteError') || 'Ошибка при удалении участника');
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-text-secondary">{tTournaments('loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28">
      <div className="container mx-auto px-4 pb-12 max-w-7xl">
        <div className="mb-6">
          <Link
            href={`/${locale}/admin/tournaments`}
            className="text-text-secondary hover:text-primary transition-colors mb-4 inline-block"
          >
            ← {tTournaments('backToTournaments')}
          </Link>
          <h1 className="text-3xl font-poppins font-bold gradient-text">
            {tTournaments('participants')} {tournamentName && `- ${tournamentName}`}
          </h1>
          {participants.length > 0 && (
            <p className="text-text-tertiary mt-2">
              {tTournaments('totalParticipants', { count: participants.length })}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-danger rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-text font-poppins font-semibold text-lg">{error}</p>
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
              <div className="relative">
                <div 
                  className="category-filter-trigger w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-pointer min-h-[42px] flex items-center justify-between"
                  onClick={() => {
                    const dropdown = document.getElementById('category-filter-dropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                >
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {filterCategories.length === 0 ? (
                      <span className="text-text-secondary">{tTournaments('filterAll')}</span>
                    ) : (
                      filterCategories.map((code) => {
                        const categoryName = customCategories[code] || code;
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-primary/20 text-primary rounded-md text-xs font-poppins font-medium"
                          >
                            {categoryName}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCategories(filterCategories.filter(c => c !== code));
                              }}
                              className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <svg 
                    className="w-5 h-5 text-text-secondary flex-shrink-0 ml-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div
                  id="category-filter-dropdown"
                  className="hidden absolute z-50 w-full mt-1 bg-background-secondary border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 space-y-1">
                    {categoryEntries.map(([code, name]) => {
                      const isSelected = filterCategories.includes(code);
                      return (
                        <label
                          key={code}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-background cursor-pointer transition-colors group"
                        >
                          <div className="relative flex items-center">
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

        <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1400px]">
              <thead>
                <tr className="border-b border-border bg-background">
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
                    <td colSpan={10} className="px-4 py-8 text-center text-text-secondary">
                      {tTournaments('noParticipants')}
                    </td>
                  </tr>
                ) : (
                  (() => {
                    // Фильтрация участников
                    let filtered = participants;
                    
                    // Поиск по имени участника и партнера
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      filtered = filtered.filter(p => {
                        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                        const partnerName = (p.partnerName || '').toLowerCase();
                        const categoryPartners = Object.values(p.categoryPartners || {}).map(cp => cp.name.toLowerCase()).join(' ');
                        return fullName.includes(query) || partnerName.includes(query) || categoryPartners.includes(query);
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
                      return (
                    <tr 
                      key={participant.id} 
                      className={`border-b border-border hover:bg-background/50 ${isDuplicate ? 'bg-red-500/10 border-red-500/50' : ''}`}
                    >
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
                          value={`${participant.firstName} ${participant.lastName}`} 
                          fieldId={`name-${participant.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{participant.firstName} {participant.lastName}</span>
                            {participant.isDemo && (
                              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xs whitespace-nowrap">
                                Demo
                              </span>
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
                        {participant.categories && participant.categories.length > 0 ? (
                          <div className="space-y-1">
                            {participant.categories.map((cat) => {
                              const partner = participant.categoryPartners?.[cat];
                              const partnerName = partner?.name || participant.partnerName || '—';
                              const categoryName = customCategories[cat] || cat;
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
                            onClick={() => handleDelete(participant.id, participant.firstName, participant.lastName)}
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

                {/* Партнеры для каждой категории */}
                {(editFormData.categories || []).length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-lg font-poppins font-semibold text-text mb-4">
                      {tTournaments('partnerInfo')} {tTournaments('byCategories')}
                    </h4>
                    <div className="space-y-4">
                      {(editFormData.categories || []).map((category) => {
                        const categoryName = customCategories[category] || category;
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
        {emailParticipant && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-md w-full">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-2xl font-poppins font-bold gradient-text">
                  {t('participants.sendEmail') || 'Send Email'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
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
                    <option value="tournament_registration">{t('participants.templateTournamentRegistration') || 'Tournament Registration - We got your registration'}</option>
                    <option value="tournament_confirmed">{t('participants.templateTournamentConfirmed') || 'Tournament Registration - Confirmed'}</option>
                    <option value="welcome">{t('participants.templateWelcome') || 'Welcome to PadelO₂.com'}</option>
                    <option value="email_verification">{t('participants.templateEmailVerification') || 'Email Verification'}</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
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
      </div>
    </div>
  );
}

