'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Club {
  id: number;
  name: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface ClubAccess {
  id: number;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  user_role: string;
}

export default function AdminsSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [accesses, setAccesses] = useState<ClubAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    role: 'admin' as 'admin' | 'manager' | 'staff' | 'coach',
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
    fetchUsers();
    checkUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  useEffect(() => {
    if (selectedClubId) {
      fetchClubAccess(selectedClubId);
    } else {
      setAccesses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClubId]);

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

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const fetchClubAccess = async (clubId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/admin/clubs/${clubId}/access`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccesses(data.accesses || []);
      } else {
        setError('Failed to load club access');
      }
    } catch (err) {
      setError('Failed to load club access');
    }
  };

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Access assigned successfully');
        setShowAssignModal(false);
        resetForm();
        fetchClubAccess(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to assign access');
      }
    } catch (err) {
      setError('Failed to assign access');
    }
  };

  const handleRemove = async (userId: string, role: string) => {
    if (!token || !selectedClubId) return;
    if (!confirm('Are you sure you want to remove this access?')) return;

    try {
      const response = await fetch(
        `/api/admin/clubs/${selectedClubId}/access?userId=${userId}&role=${role}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setSuccess('Access removed successfully');
        fetchClubAccess(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove access');
      }
    } catch (err) {
      setError('Failed to remove access');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      role: 'admin',
    });
  };

  const closeModal = () => {
    setShowAssignModal(false);
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
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('settings.companyAdmin.manageAdmins.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.companyAdmin.manageAdmins.description')}
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

      {/* Admins List */}
      {selectedClubId && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-poppins font-semibold text-text">
              Club Administrators ({accesses.length})
            </h2>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAssignModal(true);
                }}
                className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Assign Access
              </button>
            )}
          </div>

          {accesses.length === 0 ? (
            <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
              <p className="text-text-secondary font-poppins">No administrators assigned. {isSuperAdmin && 'Assign access to users.'}</p>
            </div>
          ) : (
            <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">User</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Club Role</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">User Role</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accesses.map((access) => (
                    <tr key={access.id} className="border-b border-border hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 text-text font-poppins">
                        {access.first_name} {access.last_name}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins">
                        {access.email}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold bg-blue-500/20 text-blue-400 capitalize">
                          {access.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold bg-purple-500/20 text-purple-400 capitalize">
                          {access.user_role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleRemove(access.user_id, access.role)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            title="Remove Access"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Assign Modal */}
      {showAssignModal && isSuperAdmin && selectedClubId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-2xl font-poppins font-bold gradient-text">
                Assign Club Access
              </h3>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  User *
                </label>
                <select
                  required
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Club Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="coach">Coach</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Assign
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

