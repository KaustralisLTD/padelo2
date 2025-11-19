'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'demo';
  createdAt: string;
  updatedAt?: string;
}

export default function AdminTournamentsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
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
    demoParticipantsCount: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const createdTournament = data.tournament;
        
        // Если это demo турнир и указано количество участников, создаем демо-участников
        if (formData.status === 'demo' && formData.demoParticipantsCount) {
          const participantsCount = parseInt(formData.demoParticipantsCount);
          if (participantsCount >= 2 && participantsCount % 2 === 0) {
            try {
              const demoResponse = await fetch(`/api/tournament/${createdTournament.id}/demo-participants`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  count: participantsCount,
                }),
              });
              
              if (demoResponse.ok) {
                setSuccess('Tournament created successfully with demo participants');
                // Перенаправляем на страницу Bracket
                router.push(`/${locale}/tournament/${createdTournament.id}/bracket`);
              } else {
                const demoError = await demoResponse.json();
                setError(demoError.error || 'Failed to create demo participants');
              }
            } catch (demoErr) {
              console.error('[AdminTournamentsContent] Error creating demo participants:', demoErr);
              setError('Failed to create demo participants');
            }
          }
        } else {
          setSuccess('Tournament created successfully');
        }
        
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

  const handleDelete = async (id: number) => {
    if (!token || !confirm('Are you sure you want to delete this tournament?')) return;

    try {
      const response = await fetch(`/api/admin/tournaments?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Tournament deleted successfully');
        fetchTournaments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete tournament');
      }
    } catch (err) {
      setError('Failed to delete tournament');
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
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      location: '',
      locationAddress: '',
      locationLat: '',
      locationLng: '',
      eventSchedule: [],
      maxParticipants: '',
      priceSingleCategory: '',
      priceDoubleCategory: '',
      status: 'draft',
      demoParticipantsCount: '',
    });
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
      demoParticipantsCount: '',
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
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: Tournament['status']) => {
    const labels: Record<Tournament['status'], string> = {
      draft: 'Draft',
      open: 'Open',
      closed: 'Closed',
      in_progress: 'In Progress',
      completed: 'Completed',
      demo: 'Demo',
    };
    return labels[status] || status;
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
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-poppins">
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
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold text-white ${getStatusColor(tournament.status)}`}
                        >
                          {getStatusLabel(tournament.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/${locale}/tournament/${tournament.id}/bracket`}
                            className="text-blue-400 hover:text-blue-300 font-poppins text-sm transition-colors"
                          >
                            {t('tournaments.bracket')}
                          </Link>
                          <button
                            onClick={() => handleCopyTournament(tournament)}
                            className="text-green-400 hover:text-green-300 font-poppins text-sm transition-colors"
                            title="Copy tournament"
                          >
                            {t('tournaments.copy')}
                          </button>
                          <button
                            onClick={() => openEditModal(tournament)}
                            className="text-primary hover:text-accent font-poppins text-sm transition-colors"
                          >
                            {t('tournaments.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(tournament.id)}
                            className="text-red-400 hover:text-red-300 font-poppins text-sm transition-colors"
                          >
                            {t('tournaments.delete')}
                          </button>
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
                  </select>
                </div>

                {/* Демо-участники - только для demo турниров */}
                {formData.status === 'demo' && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('tournaments.demoParticipantsCount')}
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="2"
                        value={formData.demoParticipantsCount || ''}
                        onChange={(e) => setFormData({ ...formData, demoParticipantsCount: e.target.value })}
                        placeholder={t('tournaments.demoParticipantsCountPlaceholder')}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-text-tertiary font-poppins mt-1">
                        {t('tournaments.demoParticipantsCountHint')}
                      </p>
                    </div>
                  </div>
                )}

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
