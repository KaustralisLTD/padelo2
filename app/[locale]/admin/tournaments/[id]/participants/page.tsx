'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  partnerName: string | null;
  partnerEmail: string | null;
  categories: string[];
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
}

export default function TournamentParticipantsPage() {
  const t = useTranslations('Admin');
  const tTournaments = useTranslations('Tournaments');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const tournamentId = parseInt(params.id as string, 10);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Participant>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchTournament();
    fetchParticipants();
  }, [tournamentId, token]);

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
          setCustomCategories(tournament.customCategories || {
            male1: 'Male 1',
            male2: 'Male 2',
            female1: 'Female 1',
            female2: 'Female 2',
            mixed1: 'Mixed 1',
            mixed2: 'Mixed 2',
          });
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
        setParticipants(data.registrations || []);
      } else {
        setError(t('tournaments.participantsLoadError'));
      }
    } catch (err) {
      setError(t('tournaments.participantsLoadError'));
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
      categories: participant.categories,
    });
  };

  const handleSave = async () => {
    if (!token || !editingParticipant) return;

    try {
      setError(null);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${editingParticipant.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setSuccess(t('tournaments.participantUpdated'));
        fetchParticipants();
        setEditingParticipant(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || t('tournaments.participantUpdateError'));
      }
    } catch (err) {
      setError(t('tournaments.participantUpdateError'));
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
        setSuccess(t('tournaments.paymentStatusUpdated'));
        fetchParticipants();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || t('tournaments.paymentStatusUpdateError'));
      }
    } catch (err) {
      setError(t('tournaments.paymentStatusUpdateError'));
    }
  };

  const handleCategoryChange = async (participantId: number, newCategory: string) => {
    if (!token || !newCategory) return;

    try {
      setError(null);
      const response = await fetch(`/api/tournament/${tournamentId}/registrations/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: [newCategory],
        }),
      });

      if (response.ok) {
        setSuccess(t('tournaments.participantCategoryUpdated'));
        fetchParticipants();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || t('tournaments.participantCategoryUpdateError'));
      }
    } catch (err) {
      setError(t('tournaments.participantCategoryUpdateError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-text-secondary">{t('tournaments.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href={`/${locale}/admin/tournaments`}
              className="text-text-secondary hover:text-primary transition-colors mb-2 inline-block"
            >
              ← {t('tournaments.backToTournaments')}
            </Link>
            <h1 className="text-3xl font-poppins font-bold gradient-text">
              {t('tournaments.participants')} {tournamentName && `- ${tournamentName}`}
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500">
            {success}
          </div>
        )}

        <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.participantName')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.participantEmail')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.participantPhone')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.participantCategory')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.participantPartner')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.tshirtSize')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.paymentStatus')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-poppins font-semibold text-text-secondary">
                    {t('tournaments.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                      {t('tournaments.noParticipants')}
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr key={participant.id} className="border-b border-border hover:bg-background/50">
                      <td className="px-4 py-3 text-sm text-text">
                        {participant.firstName} {participant.lastName}
                        {participant.isDemo && (
                          <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">
                            Demo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{participant.email}</td>
                      <td className="px-4 py-3 text-sm text-text">{participant.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={participant.categories?.[0] || ''}
                          onChange={(e) => handleCategoryChange(participant.id, e.target.value)}
                          className="px-3 py-1 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-primary"
                        >
                          {Object.entries(customCategories).map(([code, name]) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {participant.partnerName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {participant.tshirtSize || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={participant.paymentStatus || 'pending'}
                          onChange={(e) =>
                            handlePaymentStatusChange(
                              participant.id,
                              e.target.value as 'pending' | 'paid' | 'refunded'
                            )
                          }
                          className="px-3 py-1 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="pending">{t('tournaments.paymentPending')}</option>
                          <option value="paid">{t('tournaments.paymentPaid')}</option>
                          <option value="refunded">{t('tournaments.paymentRefunded')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleEdit(participant)}
                          className="px-3 py-1 bg-primary text-background rounded hover:opacity-90 transition-opacity text-sm"
                        >
                          {t('tournaments.edit')}
                        </button>
                      </td>
                    </tr>
                  ))
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
                  {t('tournaments.editParticipant')}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
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
                      {t('tournaments.firstName')} *
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
                      {t('tournaments.lastName')} *
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
                    {t('tournaments.participantEmail')} *
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
                      {t('tournaments.participantPhone')}
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
                      {t('tournaments.telegram')}
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
                    {t('tournaments.tshirtSize')}
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
                    {t('tournaments.participantCategory')}
                  </label>
                  <select
                    value={editFormData.categories?.[0] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, categories: e.target.value ? [e.target.value] : [] })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  >
                    {Object.entries(customCategories).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {editFormData.partnerName && (
                  <>
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-lg font-poppins font-semibold text-text mb-4">
                        {t('tournaments.partnerInfo')}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('tournaments.partnerName')}
                        </label>
                        <input
                          type="text"
                          value={editFormData.partnerName || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, partnerName: e.target.value })}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('tournaments.partnerEmail')}
                        </label>
                        <input
                          type="email"
                          value={editFormData.partnerEmail || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, partnerEmail: e.target.value })}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('tournaments.partnerPhone')}
                        </label>
                        <input
                          type="tel"
                          value={editFormData.partnerPhone || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, partnerPhone: e.target.value })}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('tournaments.partnerTshirtSize')}
                        </label>
                        <select
                          value={editFormData.partnerTshirtSize || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, partnerTshirtSize: e.target.value })}
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
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('tournaments.message')}
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
                    {t('tournaments.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {t('tournaments.save')}
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

