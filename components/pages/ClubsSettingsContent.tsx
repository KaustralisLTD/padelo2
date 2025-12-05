'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Club {
  id: number;
  name: string;
  address?: string;
  description?: string;
  location?: string;
  working_hours?: any;
  created_at: string;
  updated_at?: string;
}

export default function ClubsSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    location: '',
    workingHours: {} as any,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchClubs();
    checkUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const checkUserRole = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user?.role || null);
      }
    } catch (err) {
      console.error('Failed to check user role');
    }
  };

  const fetchClubs = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/clubs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      } else {
        setError('Failed to load clubs');
      }
    } catch (err) {
      setError('Failed to load clubs');
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
      const response = await fetch('/api/admin/clubs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Club created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchClubs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create club');
      }
    } catch (err) {
      setError('Failed to create club');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !editingClub) return;

    try {
      const response = await fetch(`/api/admin/clubs/${editingClub.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Club updated successfully');
        setShowCreateModal(false);
        setEditingClub(null);
        resetForm();
        fetchClubs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update club');
      }
    } catch (err) {
      setError('Failed to update club');
    }
  };

  const handleDelete = async (clubId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Club deleted successfully');
        fetchClubs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete club');
      }
    } catch (err) {
      setError('Failed to delete club');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      location: '',
      workingHours: {},
    });
    setEditingClub(null);
  };

  const openEditModal = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      address: club.address || '',
      description: club.description || '',
      location: club.location || '',
      workingHours: club.working_hours || {},
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingClub(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-text-secondary font-poppins">Loading...</p>
      </div>
    );
  }

  const isSuperAdmin = userRole === 'superadmin';

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
          {t('settings.companyAdmin.clubs.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.companyAdmin.clubs.description')}
        </p>
      </div>

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

      {/* Clubs List */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-poppins font-semibold text-text">
          Clubs ({clubs.length})
        </h2>
        {isSuperAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Add Club
          </button>
        )}
      </div>

      {clubs.length === 0 ? (
        <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary font-poppins">No clubs found. {isSuperAdmin && 'Add your first club.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-background-secondary rounded-lg border border-border p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                    {club.name}
                  </h3>
                  {club.location && (
                    <p className="text-text-secondary font-poppins text-sm mb-1">
                      📍 {club.location}
                    </p>
                  )}
                  {club.address && (
                    <p className="text-text-secondary font-poppins text-sm">
                      {club.address}
                    </p>
                  )}
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(club)}
                      className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(club.id)}
                      className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {club.description && (
                <p className="text-text-secondary font-poppins text-sm line-clamp-3 mb-4">
                  {club.description}
                </p>
              )}
              <div className="text-xs text-text-tertiary font-poppins">
                Created: {new Date(club.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-2xl font-poppins font-bold gradient-text">
                {editingClub ? 'Edit Club' : 'Add Club'}
              </h3>
            </div>
            <form onSubmit={editingClub ? handleUpdate : handleCreate} className="p-6 space-y-4">
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
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingClub ? 'Update' : 'Create'}
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

