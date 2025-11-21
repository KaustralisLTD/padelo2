'use client';

import { useEffect, useState, FormEvent, type SVGProps } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TournamentRegistrationSettings,
  RegistrationCustomField,
  getDefaultRegistrationSettings,
  normalizeRegistrationSettings,
} from '@/lib/registration-settings';

interface EventScheduleItem {
  title: string;
  date: string;
  time: string;
  description?: string;
}

interface Tournament {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  location?: string;
  locationAddress?: string;
  locationCoordinates?: { lat: number; lng: number };
  eventSchedule?: EventScheduleItem[];
  maxParticipants?: number;
  priceSingleCategory?: number;
  priceDoubleCategory?: number;
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'demo' | 'archived' | 'soon';
  createdAt: string;
  updatedAt?: string;
  registrationsTotal?: number;
  registrationsConfirmed?: number;
  registrationSettings?: TournamentRegistrationSettings;
  demoParticipantsCount?: number | null;
  customCategories?: Record<string, string>; // key: category code (e.g., "male1"), value: category name (e.g., "Мужская 1")
  bannerImageName?: string | null;
  bannerImageData?: string | null;
}

export default function AdminTournamentsContent() {
  const t = useTranslations('Admin');
  const tTournaments = useTranslations('Tournaments');
  const locale = useLocale();
  const router = useRouter();
  const [generatingDemoParticipants, setGeneratingDemoParticipants] = useState(false);

  const createDefaultFormData = () => ({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    location: '',
    locationAddress: '',
    locationLat: '',
    locationLng: '',
    eventSchedule: [] as EventScheduleItem[],
    maxParticipants: '',
    priceSingleCategory: '',
    priceDoubleCategory: '',
    status: 'draft' as Tournament['status'],
    registrationSettings: getDefaultRegistrationSettings(),
    customCategories: {
      male1: 'Male 1',
      male2: 'Male 2',
      female1: 'Female 1',
      female2: 'Female 2',
      mixed1: 'Mixed 1',
      mixed2: 'Mixed 2',
    } as Record<string, string>,
    bannerImageName: null as string | null,
    bannerImageData: null as string | null,
  });

  const parseDemoParticipantsInput = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return null;
    const numericValue =
      typeof value === 'number' ? value : Number.parseInt(String(value).trim(), 10);
    if (!Number.isFinite(numericValue)) return null;
    return numericValue;
  };

  const isValidDemoCount = (count: number | null) =>
    typeof count === 'number' && count >= 2 && count % 2 === 0;

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState(createDefaultFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const registrationSettings = normalizeRegistrationSettings(formData.registrationSettings);
  const customFields = registrationSettings.customFields;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Verify admin access and fetch tournaments
    fetch('/api/auth/login', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== 'superadmin') {
          router.push(`/${locale}/dashboard`);
        } else {
          fetchTournaments();
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
  }, [locale, router]);

  const fetchTournaments = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/tournaments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminTournamentsContent] Fetched tournaments:', data);
        
        // Детальное логирование статусов турниров
        if (data.tournaments && Array.isArray(data.tournaments)) {
          data.tournaments.forEach((tournament: any) => {
            console.log('[AdminTournamentsContent] Tournament status check:', {
              id: tournament.id,
              name: tournament.name,
              status: tournament.status,
              statusType: typeof tournament.status,
              statusValue: JSON.stringify(tournament.status),
            });
          });
        }
        
        setTournaments(data.tournaments || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AdminTournamentsContent] Failed to load tournaments:', response.status, errorData);
        setError(errorData.error || 'Failed to load tournaments');
      }
    } catch (err) {
      console.error('[AdminTournamentsContent] Error fetching tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const createDemoParticipantsOnServer = async (tournamentId: number, count: number, authToken: string) => {
    const response = await fetch(`/api/tournament/${tournamentId}/demo-participants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count }),
    });

    if (!response.ok) {
      const demoError = await response.json().catch(() => ({ error: 'Failed to create demo participants' }));
      throw new Error(demoError.error || 'Failed to create demo participants');
    }

    return response.json();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) return;

    try {
      const response = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : undefined,
          location: formData.location || undefined,
          locationAddress: formData.locationAddress || undefined,
          locationCoordinates: formData.locationLat && formData.locationLng
            ? { lat: parseFloat(formData.locationLat), lng: parseFloat(formData.locationLng) }
            : undefined,
          eventSchedule: formData.eventSchedule.length > 0 ? formData.eventSchedule : undefined,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          priceSingleCategory: formData.priceSingleCategory ? parseFloat(formData.priceSingleCategory) : undefined,
          priceDoubleCategory: formData.priceDoubleCategory ? parseFloat(formData.priceDoubleCategory) : undefined,
          status: formData.status,
          registrationSettings: formData.registrationSettings,
          customCategories: formData.customCategories,
          bannerImageName: formData.bannerImageName || undefined,
          bannerImageData: formData.bannerImageData || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Tournament created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchTournaments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create tournament');
      }
    } catch (err) {
      setError('Failed to create tournament');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !editingTournament) return;

    try {
      const response = await fetch('/api/admin/tournaments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTournament.id,
          name: formData.name,
          description: formData.description || undefined,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : undefined,
          location: formData.location || undefined,
          locationAddress: formData.locationAddress || undefined,
          locationCoordinates: formData.locationLat && formData.locationLng
            ? { lat: parseFloat(formData.locationLat), lng: parseFloat(formData.locationLng) }
            : undefined,
          eventSchedule: formData.eventSchedule.length > 0 ? formData.eventSchedule : undefined,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          priceSingleCategory: formData.priceSingleCategory ? parseFloat(formData.priceSingleCategory) : undefined,
          priceDoubleCategory: formData.priceDoubleCategory ? parseFloat(formData.priceDoubleCategory) : undefined,
          status: formData.status,
          registrationSettings: formData.registrationSettings,
          customCategories: formData.customCategories,
          bannerImageName: formData.bannerImageName || undefined,
          bannerImageData: formData.bannerImageData || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Tournament updated successfully');
        fetchTournaments();
        closeModal();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update tournament');
      }
    } catch (err) {
      setError('Failed to update tournament');
    }
  };


  const handleArchive = async (id: number) => {
    if (
      !token ||
      !confirm('Отправить турнир в архив? Его всегда можно будет снова открыть.')
    )
      return;

    try {
      const response = await fetch(`/api/admin/tournaments?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Турнир перемещён в архив');
        fetchTournaments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Не удалось переместить турнир в архив');
      }
    } catch (err) {
      setError('Не удалось переместить турнир в архив');
    }
  };

  const handleCopyTournament = async (tournament: Tournament) => {
    if (!token) return;

    try {
      setError(null);
      setSuccess(null);

      // Копируем все данные турнира, но со статусом Draft
      const response = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${tournament.name} (Copy)`,
          description: tournament.description || undefined,
          startDate: new Date(tournament.startDate).toISOString(),
          endDate: new Date(tournament.endDate).toISOString(),
          registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString() : undefined,
          location: tournament.location || undefined,
          locationAddress: tournament.locationAddress || undefined,
          locationCoordinates: tournament.locationCoordinates || undefined,
          eventSchedule: tournament.eventSchedule || undefined,
          maxParticipants: tournament.maxParticipants || undefined,
          priceSingleCategory: tournament.priceSingleCategory || undefined,
          priceDoubleCategory: tournament.priceDoubleCategory || undefined,
          status: 'draft', // Всегда Draft для копии
          registrationSettings: normalizeRegistrationSettings(tournament.registrationSettings),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Tournament copied successfully');
        fetchTournaments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to copy tournament');
      }
    } catch (err) {
      setError('Failed to copy tournament');
    }
  };

  const resetForm = () => {
    setFormData(createDefaultFormData());
  };

  const updateRegistrationSettingsState = (
    updater: (current: TournamentRegistrationSettings) => TournamentRegistrationSettings
  ) => {
    setFormData((prev) => {
      const current = normalizeRegistrationSettings(prev.registrationSettings);
      const next = updater(current);
      return {
        ...prev,
        registrationSettings: normalizeRegistrationSettings(next),
      };
    });
  };

  const updateCustomField = (
    id: string,
    mutator: (field: RegistrationCustomField) => RegistrationCustomField | null
  ) => {
    updateRegistrationSettingsState((current) => {
      const normalized = normalizeRegistrationSettings(current);
      const nextFields = normalized.customFields
        .map((field) => {
          if (field.id !== id) return field;
          const updated = mutator(field);
          return updated ?? null;
        })
        .filter(Boolean) as RegistrationCustomField[];

      return {
        ...normalized,
        customFields: nextFields,
      };
    });
  };

  const addCustomField = () => {
    updateRegistrationSettingsState((current) => {
      const normalized = normalizeRegistrationSettings(current);
      const newField: RegistrationCustomField = {
        id: `customField_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        label: '',
        enabled: true,
        required: false,
      };
      return {
        ...normalized,
        customFields: [...normalized.customFields, newField],
      };
    });
  };

  const removeCustomField = (id: string) => {
    updateCustomField(id, () => null);
  };

  const iconButtonBase =
    'p-2 rounded-md border border-transparent text-text-secondary hover:text-primary hover:border-primary transition-colors';

  const dangerButtonClasses = 'hover:text-red-300 hover:border-red-400';

  const TableIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );

  const CopyIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M4 16V5a2 2 0 0 1 2-2h11" />
    </svg>
  );

  const EditIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 21h4l11-11a2.5 2.5 0 0 0-3.5-3.5L4.5 17.5V21" />
      <path d="M13 6l5 5" />
    </svg>
  );

  const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );

  const UsersIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const ActionIconButton = ({
    label,
    onClick,
    href,
    Icon,
    variant = 'default',
  }: {
    label: string;
    onClick?: () => void;
    href?: string;
    Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
    variant?: 'default' | 'danger';
  }) => {
    const className =
      iconButtonBase + (variant === 'danger' ? ` ${dangerButtonClasses}` : '');
    const content = (
      <span title={label} className="inline-flex">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={className}
          aria-label={label}
          title={label}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label={label}
        title={label}
      >
        {content}
      </button>
    );
  };

  // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Get local date and time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openEditModal = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      startDate: formatDateForInput(tournament.startDate),
      endDate: formatDateForInput(tournament.endDate),
      registrationDeadline: tournament.registrationDeadline ? formatDateForInput(tournament.registrationDeadline) : '',
      location: tournament.location || '',
      locationAddress: tournament.locationAddress || '',
      locationLat: tournament.locationCoordinates?.lat?.toString() || '',
      locationLng: tournament.locationCoordinates?.lng?.toString() || '',
      eventSchedule: tournament.eventSchedule || [],
      maxParticipants: tournament.maxParticipants?.toString() || '',
      priceSingleCategory: tournament.priceSingleCategory?.toString() || '',
      priceDoubleCategory: tournament.priceDoubleCategory?.toString() || '',
      status: tournament.status,
      registrationSettings: normalizeRegistrationSettings(tournament.registrationSettings),
      customCategories: (tournament.customCategories || {
        male1: 'Male 1',
        male2: 'Male 2',
        female1: 'Female 1',
        female2: 'Female 2',
        mixed1: 'Mixed 1',
        mixed2: 'Mixed 2',
      }) as Record<string, string>,
      bannerImageName: tournament.bannerImageName || null,
      bannerImageData: tournament.bannerImageData || null,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTournament(null);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Tournament['status']) => {
    const colors: Record<Tournament['status'], string> = {
      draft: 'bg-gray-500',
      open: 'bg-green-500',
      closed: 'bg-red-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-purple-500',
      demo: 'bg-yellow-500',
      archived: 'bg-gray-600',
      soon: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: Tournament['status'] | string | undefined | null): string => {
    if (!status) {
      return 'Unknown';
    }
    
    // Нормализуем статус (убираем пробелы, приводим к нижнему регистру)
    const normalizedStatus = String(status).trim().toLowerCase();
    
    const labels: Record<string, string> = {
      draft: 'Draft',
      open: 'Open',
      closed: 'Closed',
      'in_progress': 'In Progress',
      'in-progress': 'In Progress',
      completed: 'Completed',
      demo: 'Demo',
      archived: 'Archived',
      soon: 'Soon',
    };
    
    return labels[normalizedStatus] || labels[status as string] || String(status);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
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
            href={`/${locale}/dashboard`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {t('backToDashboard')}
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
              {t('tournaments.title')}
            </h1>
            <p className="text-xl text-text-secondary font-poppins">
              {t('tournaments.description')}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('tournaments.createTournament')}
          </button>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm font-poppins">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins">
            {error}
          </div>
        )}

        {/* Tournaments Table */}
        {tournaments.length === 0 ? (
          <div className="bg-background-secondary p-12 rounded-lg border border-border text-center">
            <p className="text-text-secondary font-poppins text-lg mb-4">
              {t('tournaments.noTournaments')}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('tournaments.createTournament')}
            </button>
          </div>
        ) : (
          <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.name')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.startDate')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.endDate')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.location')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.registrationTotal')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.registrationPaid')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('tournaments.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-poppins font-semibold text-text">{tournament.name}</div>
                        {tournament.description && (
                          <div className="text-sm text-text-secondary font-poppins mt-1">
                            {tournament.description.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        {formatDate(tournament.startDate)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        {formatDate(tournament.endDate)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        {tournament.location || '-'}
                      </td>
                    <td className="px-6 py-4 text-text font-poppins text-sm">
                      {tournament.registrationsTotal ?? 0}
                    </td>
                    <td className="px-6 py-4 text-text font-poppins text-sm">
                      {tournament.registrationsConfirmed ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        {editingStatusId === tournament.id ? (
                          <select
                            value={tournament.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value as Tournament['status'];
                              try {
                                const response = await fetch('/api/admin/tournaments', {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    id: tournament.id,
                                    status: newStatus,
                                  }),
                                });
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  setTournaments(tournaments.map(t => 
                                    t.id === tournament.id ? { ...t, status: newStatus } : t
                                  ));
                                  setEditingStatusId(null);
                                  setSuccess(t('tournaments.statusUpdated') || 'Status updated successfully');
                                  setTimeout(() => setSuccess(null), 3000);
                                } else {
                                  const errorData = await response.json();
                                  setError(errorData.error || 'Failed to update status');
                                  setTimeout(() => setError(null), 3000);
                                }
                              } catch (err: any) {
                                setError(err.message || 'Failed to update status');
                                setTimeout(() => setError(null), 3000);
                              }
                            }}
                            onBlur={() => setEditingStatusId(null)}
                            autoFocus
                            className={`px-3 py-1 rounded-full text-xs font-poppins font-semibold text-white border-2 border-primary ${getStatusColor(tournament.status)} focus:outline-none focus:ring-2 focus:ring-primary`}
                            style={{ appearance: 'none', backgroundImage: 'none' }}
                          >
                            <option value="draft" className="bg-gray-500">Draft</option>
                            <option value="open" className="bg-green-500">Open</option>
                            <option value="closed" className="bg-red-500">Closed</option>
                            <option value="in_progress" className="bg-blue-500">In Progress</option>
                            <option value="completed" className="bg-purple-500">Completed</option>
                            <option value="demo" className="bg-yellow-500">Demo</option>
                            <option value="archived" className="bg-gray-600">Archived</option>
                            <option value="soon" className="bg-orange-500">Soon</option>
                          </select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingStatusId(tournament.id)}
                            className={`inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold text-white ${getStatusColor(tournament.status)} hover:opacity-80 transition-opacity cursor-pointer`}
                            title={t('tournaments.clickToEditStatus') || 'Click to edit status'}
                          >
                            {getStatusLabel(tournament.status)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <ActionIconButton
                            label={t('tournaments.bracket')}
                            href={`/${locale}/tournament/${tournament.id}/bracket`}
                            Icon={TableIcon}
                          />
                          <ActionIconButton
                            label={t('tournaments.participants')}
                            href={`/${locale}/admin/tournaments/${tournament.id}/participants`}
                            Icon={UsersIcon}
                          />
                          <ActionIconButton
                            label={t('tournaments.copy')}
                            onClick={() => handleCopyTournament(tournament)}
                            Icon={CopyIcon}
                          />
                          <ActionIconButton
                            label={t('tournaments.edit')}
                            onClick={() => openEditModal(tournament)}
                            Icon={EditIcon}
                          />
                          <ActionIconButton
                            label={t('tournaments.delete')}
                            onClick={() => handleArchive(tournament.id)}
                            Icon={TrashIcon}
                            variant="danger"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-2xl font-poppins font-bold gradient-text">
                  {editingTournament ? t('tournaments.editTournament') : t('tournaments.createTournament')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-text-secondary hover:text-text transition-colors p-2 rounded-lg hover:bg-background"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={editingTournament ? handleUpdate : handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('tournaments.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('tournaments.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('tournaments.startDate')} *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('tournaments.endDate')} *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('tournaments.registrationDeadline')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('tournaments.location')}
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                {/* Адрес с координатами */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-lg font-poppins font-semibold text-text mb-3">
                    {t('tournaments.address')}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('tournaments.address')}
                      </label>
                      <textarea
                        value={formData.locationAddress}
                        onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                        rows={2}
                        placeholder="Полный адрес проведения турнира"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('tournaments.latitude')}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.locationLat}
                          onChange={(e) => setFormData({ ...formData, locationLat: e.target.value })}
                          placeholder="50.4501"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('tournaments.longitude')}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.locationLng}
                          onChange={(e) => setFormData({ ...formData, locationLng: e.target.value })}
                          placeholder="30.5234"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-text-tertiary font-poppins">
                      {t('tournaments.coordinatesHint')}
                    </p>
                  </div>
                </div>

                {/* Расписание событий */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-poppins font-semibold text-text">
                      {t('tournaments.eventSchedule')}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        eventSchedule: [...formData.eventSchedule, { title: '', date: '', time: '', description: '' }]
                      })}
                      className="px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors font-poppins text-sm"
                    >
                      + {t('tournaments.addEvent')}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.eventSchedule.map((event, index) => (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.borderColor = '';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.borderColor = '';
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          if (draggedIndex !== index) {
                            const updated = [...formData.eventSchedule];
                            const [removed] = updated.splice(draggedIndex, 1);
                            updated.splice(index, 0, removed);
                            setFormData({ ...formData, eventSchedule: updated });
                          }
                        }}
                        className="p-4 bg-background rounded-lg border border-border cursor-move hover:border-primary transition-colors"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                            <span className="text-sm font-poppins font-semibold text-text">
                              {t('tournaments.eventNumber')} {index + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              eventSchedule: formData.eventSchedule.filter((_, i) => i !== index)
                            })}
                            className="text-red-500 hover:text-red-700 font-poppins text-sm"
                          >
                            {t('tournaments.removeEvent')}
                          </button>
                        </div>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder={t('tournaments.eventTitlePlaceholder')}
                            value={event.title}
                            onChange={(e) => {
                              const updated = [...formData.eventSchedule];
                              updated[index].title = e.target.value;
                              setFormData({ ...formData, eventSchedule: updated });
                            }}
                            className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="date"
                              value={event.date}
                              onChange={(e) => {
                                const updated = [...formData.eventSchedule];
                                updated[index].date = e.target.value;
                                setFormData({ ...formData, eventSchedule: updated });
                              }}
                              className="px-4 py-2 bg-background-secondary border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                            />
                            <input
                              type="time"
                              value={event.time}
                              onChange={(e) => {
                                const updated = [...formData.eventSchedule];
                                updated[index].time = e.target.value;
                                setFormData({ ...formData, eventSchedule: updated });
                              }}
                              className="px-4 py-2 bg-background-secondary border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <textarea
                            placeholder={t('tournaments.eventDescriptionPlaceholder')}
                            value={event.description || ''}
                            onChange={(e) => {
                              const updated = [...formData.eventSchedule];
                              updated[index].description = e.target.value;
                              setFormData({ ...formData, eventSchedule: updated });
                            }}
                            rows={2}
                            className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                    {formData.eventSchedule.length === 0 && (
                      <p className="text-sm text-text-secondary font-poppins text-center py-4">
                        {t('tournaments.noEvents')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('tournaments.maxParticipants')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('tournaments.priceSingleCategory')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.priceSingleCategory}
                      onChange={(e) => setFormData({ ...formData, priceSingleCategory: e.target.value })}
                      placeholder="30.00"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-text-tertiary font-poppins mt-1">
                      {t('tournaments.priceSingleCategoryDesc')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('tournaments.priceDoubleCategory')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.priceDoubleCategory}
                      onChange={(e) => setFormData({ ...formData, priceDoubleCategory: e.target.value })}
                      placeholder="25.00"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-text-tertiary font-poppins mt-1">
                      {t('tournaments.priceDoubleCategoryDesc')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-lg font-poppins font-semibold text-text">
                    {t('tournaments.registrationSettings')}
                  </h4>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer transition-colors hover:border-primary">
                      <input
                        type="checkbox"
                        checked={registrationSettings.tshirtField.enabled}
                        onChange={() =>
                          updateRegistrationSettingsState((current) => ({
                            ...current,
                            tshirtField: {
                              ...current.tshirtField,
                              enabled: !current.tshirtField.enabled,
                              // если выключаем, убираем обязательность
                              required: current.tshirtField.enabled ? false : current.tshirtField.required,
                            },
                          }))
                        }
                        className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                      />
                      <div>
                        <p className="text-sm font-poppins text-text">
                          {t('tournaments.registrationTshirtEnabled')}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {t('tournaments.registrationTshirtLabel')}
                        </p>
                      </div>
                    </label>

                    {registrationSettings.tshirtField.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <label className="flex items-center gap-2 text-sm font-poppins text-text">
                          <input
                            type="checkbox"
                            checked={registrationSettings.tshirtField.required}
                            onChange={() =>
                              updateRegistrationSettingsState((current) => ({
                                ...current,
                                tshirtField: {
                                  ...current.tshirtField,
                                  required: !current.tshirtField.required,
                                },
                              }))
                            }
                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                          />
                          {t('tournaments.registrationTshirtRequired')}
                        </label>
                        <div>
                          <label className="block text-sm font-poppins text-text-secondary mb-2">
                            {t('tournaments.registrationTshirtLabel')}
                          </label>
                          <input
                            type="text"
                            value={registrationSettings.tshirtField.label}
                            onChange={(e) =>
                              updateRegistrationSettingsState((current) => ({
                                ...current,
                                tshirtField: {
                                  ...current.tshirtField,
                                  label: e.target.value,
                                },
                              }))
                            }
                            placeholder={t('tournaments.registrationTshirtLabel')}
                            className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-background border border-border rounded-lg space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-poppins font-semibold text-text">
                          {t('tournaments.registrationCustomFieldTitle')}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {t('tournaments.registrationCustomFieldHint')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addCustomField}
                        className="px-3 py-1.5 text-xs font-poppins font-semibold rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
                      >
                        {t('tournaments.registrationCustomFieldAdd')}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {customFields.length === 0 && (
                        <p className="text-sm text-text-secondary font-poppins">
                          {t('tournaments.registrationCustomFieldEmpty')}
                        </p>
                      )}

                      {customFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-3 bg-background-secondary rounded-lg border border-border space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-poppins font-semibold text-text">
                                {t('tournaments.registrationCustomFieldTitle')} #{index + 1}
                              </p>
                              <p className="text-xs text-text-tertiary">
                                {t('tournaments.registrationCustomFieldHint')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-sm font-poppins text-text">
                                <input
                                  type="checkbox"
                                  checked={field.enabled}
                                  onChange={() =>
                                    updateCustomField(field.id, (currentField) => ({
                                      ...currentField,
                                      enabled: !currentField.enabled,
                                      required: currentField.enabled ? false : currentField.required,
                                    }))
                                  }
                                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                />
                                {t('tournaments.registrationCustomFieldEnabled')}
                              </label>
                              <button
                                type="button"
                                onClick={() => removeCustomField(field.id)}
                                className="text-xs text-red-400 hover:text-red-300 font-poppins"
                              >
                                {t('tournaments.registrationCustomFieldRemove')}
                              </button>
                            </div>
                          </div>

                          {field.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-poppins text-text-secondary mb-2">
                                  {t('tournaments.registrationCustomFieldLabel')}
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) =>
                                    updateCustomField(field.id, (currentField) => ({
                                      ...currentField,
                                      label: e.target.value,
                                    }))
                                  }
                                  placeholder={t('tournaments.registrationCustomFieldLabel')}
                                  className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                                />
                              </div>
                              <label className="flex items-center gap-2 text-sm font-poppins text-text">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={() =>
                                    updateCustomField(field.id, (currentField) => ({
                                      ...currentField,
                                      required: !currentField.required,
                                    }))
                                  }
                                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                />
                                {t('tournaments.registrationCustomFieldRequired')}
                              </label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer transition-colors hover:border-primary">
                    <input
                      type="checkbox"
                      checked={registrationSettings.partner.required}
                      onChange={() =>
                        updateRegistrationSettingsState((current) => ({
                          ...current,
                          partner: {
                            ...current.partner,
                            required: !current.partner.required,
                          },
                        }))
                      }
                      className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-poppins text-text">
                        {t('tournaments.registrationPartnerRequired')}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {t('tournaments.registrationPartnerHint')}
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('tournaments.status')} *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Tournament['status'] })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="demo">Demo</option>
                    <option value="archived">Archived</option>
                    <option value="soon">Soon</option>
                  </select>
                </div>

                {/* Tournament Banner */}
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('tournaments.bannerImage')} <span className="text-text-tertiary text-xs">({t('tournaments.optional')})</span>
                  </label>
                  {formData.bannerImageData ? (
                    <div className="mb-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border mb-2">
                        <img
                          src={formData.bannerImageData}
                          alt="Tournament banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerImageName: null, bannerImageData: null })}
                        className="text-sm text-red-400 hover:text-red-300 font-poppins"
                      >
                        {t('tournaments.removeBanner')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert(t('tournaments.bannerSizeError') || 'Banner size must be less than 5MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                setFormData({
                                  ...formData,
                                  bannerImageName: file.name,
                                  bannerImageData: result,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <span className="inline-block px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity">
                          {t('tournaments.chooseBanner') || 'Choose Banner'}
                        </span>
                      </label>
                      <p className="text-xs text-text-tertiary mt-2">
                        {t('tournaments.bannerHint') || 'Maximum 5MB. JPG, PNG formats.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Categories Management */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <h4 className="text-lg font-poppins font-semibold text-text mb-2">
                      {t('tournaments.categoriesManagement')}
                    </h4>
                    <p className="text-sm text-text-tertiary mb-4">
                      {t('tournaments.categoriesDescription')}
                    </p>
                  </div>

                  {/* Existing Categories */}
                  <div className="space-y-3">
                    {Object.entries(formData.customCategories || {}).map(([code, name]) => (
                      <div key={code} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                        <div className="flex-1">
                          <label className="block text-xs font-poppins text-text-tertiary mb-1">
                            {code}
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                customCategories: {
                                  ...formData.customCategories,
                                  [code]: e.target.value,
                                },
                              });
                            }}
                            placeholder={t('tournaments.categoryNamePlaceholder')}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newCategories = { ...formData.customCategories };
                            delete newCategories[code];
                            setFormData({
                              ...formData,
                              customCategories: newCategories,
                            });
                          }}
                          className="px-3 py-2 text-sm font-poppins font-semibold rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          title={t('tournaments.removeCategory')}
                        >
                          {t('tournaments.removeCategory')}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Category */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = `category${Date.now()}`;
                        setFormData({
                          ...formData,
                          customCategories: {
                            ...formData.customCategories,
                            [newCode]: '',
                          },
                        });
                      }}
                      className="px-4 py-2 text-sm font-poppins font-semibold rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
                    >
                      {t('tournaments.addCategory')}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border-2 border-border text-text-secondary font-poppins font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {t('tournaments.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {editingTournament ? t('tournaments.update') : t('tournaments.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
