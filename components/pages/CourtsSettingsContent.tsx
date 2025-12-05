'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Court {
  id: number;
  club_id: number;
  name: string;
  description?: string;
  location?: string;
  type: 'indoor' | 'outdoor' | 'covered';
  working_hours?: any;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface Club {
  id: number;
  name: string;
}

export default function CourtsSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    type: 'outdoor' as 'indoor' | 'outdoor' | 'covered',
    isActive: true,
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
      fetchCourts(selectedClubId);
    } else {
      setCourts([]);
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

  const fetchCourts = async (clubId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/admin/clubs/${clubId}/courts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourts(data.courts || []);
      } else {
        setError('Failed to load courts');
      }
    } catch (err) {
      setError('Failed to load courts');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/courts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Court created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchCourts(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create court');
      }
    } catch (err) {
      setError('Failed to create court');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId || !editingCourt) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/courts/${editingCourt.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Court updated successfully');
        setShowCreateModal(false);
        setEditingCourt(null);
        resetForm();
        fetchCourts(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update court');
      }
    } catch (err) {
      setError('Failed to update court');
    }
  };

  const handleDelete = async (courtId: number) => {
    if (!token || !selectedClubId) return;
    if (!confirm('Are you sure you want to delete this court?')) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/courts/${courtId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Court deleted successfully');
        fetchCourts(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete court');
      }
    } catch (err) {
      setError('Failed to delete court');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      type: 'outdoor',
      isActive: true,
    });
    setEditingCourt(null);
  };

  const openEditModal = (court: Court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      description: court.description || '',
      location: court.location || '',
      type: court.type,
      isActive: court.is_active,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCourt(null);
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
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('settings.clubModules.courts.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.clubModules.courts.description')}
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

      {/* Courts List */}
      {selectedClubId && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-poppins font-semibold text-text">
              Courts ({courts.length})
            </h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Court
            </button>
          </div>

          {courts.length === 0 ? (
            <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
              <p className="text-text-secondary font-poppins">No courts found. Add your first court.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="bg-background-secondary rounded-lg border border-border p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                        {court.name}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold ${
                        court.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {court.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(court)}
                        className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(court.id)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {court.description && (
                    <p className="text-text-secondary font-poppins text-sm mb-2">{court.description}</p>
                  )}
                  <div className="text-text-secondary font-poppins text-sm space-y-1">
                    <p><strong>Type:</strong> {court.type}</p>
                    {court.location && <p><strong>Location:</strong> {court.location}</p>}
                  </div>
                </div>
              ))}
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
                {editingCourt ? 'Edit Court' : 'Add Court'}
              </h3>
            </div>
            <form onSubmit={editingCourt ? handleUpdate : handleCreate} className="p-6 space-y-4">
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'indoor' | 'outdoor' | 'covered' })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                  <option value="covered">Covered</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <span className="text-text font-poppins">Active</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingCourt ? 'Update' : 'Create'}
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

