'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Holiday {
  id: number;
  club_id: number;
  name: string;
  date: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  created_at: string;
  updated_at?: string;
}

interface Club {
  id: number;
  name: string;
}

export default function HolidaysSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    isRecurring: false,
    recurringPattern: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  useEffect(() => {
    if (selectedClubId) {
      fetchHolidays(selectedClubId);
    } else {
      setHolidays([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClubId]);

  const fetchClubs = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/clubs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
        if (data.clubs && data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (clubId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/admin/clubs/${clubId}/holidays`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      } else {
        setError('Failed to load holidays');
      }
    } catch (err) {
      setError('Failed to load holidays');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recurringPattern: formData.isRecurring ? formData.recurringPattern : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Holiday created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchHolidays(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create holiday');
      }
    } catch (err) {
      setError('Failed to create holiday');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId || !editingHoliday) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/holidays/${editingHoliday.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recurringPattern: formData.isRecurring ? formData.recurringPattern : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Holiday updated successfully');
        setShowCreateModal(false);
        setEditingHoliday(null);
        resetForm();
        fetchHolidays(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update holiday');
      }
    } catch (err) {
      setError('Failed to update holiday');
    }
  };

  const handleDelete = async (holidayId: number) => {
    if (!token || !selectedClubId) return;
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/holidays/${holidayId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Holiday deleted successfully');
        fetchHolidays(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete holiday');
      }
    } catch (err) {
      setError('Failed to delete holiday');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      isRecurring: false,
      recurringPattern: '',
    });
    setEditingHoliday(null);
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.split('T')[0], // Extract date part from ISO string
      isRecurring: holiday.is_recurring,
      recurringPattern: holiday.recurring_pattern || '',
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingHoliday(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-text-secondary font-poppins">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 pt-20 pl-4">
      <div className="mb-8">
        <Link
          href={`/${locale}/admin/settings`}
          className="text-text-secondary hover:text-primary transition-colors mb-4 inline-block"
        >
          ← {t('settings.backToSettings') || 'Back to Settings'}
        </Link>
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('settings.clubModules.holidays.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.clubModules.holidays.description')}
        </p>
      </div>

      {/* Club Selection */}
      {clubs.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            Select Club
          </label>
          <select
            value={selectedClubId || ''}
            onChange={(e) => setSelectedClubId(parseInt(e.target.value))}
            className="w-full md:w-auto px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 font-poppins">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 font-poppins">
          {error}
        </div>
      )}

      {/* Holidays List */}
      {selectedClubId && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-poppins font-semibold text-text">
              Holidays ({holidays.length})
            </h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Holiday
            </button>
          </div>

          {holidays.length === 0 ? (
            <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
              <p className="text-text-secondary font-poppins">No holidays found. Add your first holiday.</p>
            </div>
          ) : (
            <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Recurring</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="border-b border-border hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 text-text font-poppins">{holiday.name}</td>
                      <td className="px-6 py-4 text-text-secondary font-poppins">
                        {new Date(holiday.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins">
                        {holiday.is_recurring ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold bg-blue-500/20 text-blue-400">
                            {holiday.recurring_pattern || 'Recurring'}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(holiday)}
                            className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(holiday.id)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && selectedClubId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-2xl font-poppins font-bold gradient-text">
                {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
              </h3>
            </div>
            <form onSubmit={editingHoliday ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Name *
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
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <span className="text-text font-poppins">Recurring Holiday</span>
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Recurring Pattern
                  </label>
                  <select
                    value={formData.recurringPattern}
                    onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingHoliday ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-background border border-border text-text font-poppins font-semibold rounded-lg hover:bg-background-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

