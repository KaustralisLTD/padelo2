'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StaffAccess {
  id: number;
  userId: string;
  tournamentId: number;
  canManageGroups: boolean;
  canManageMatches: boolean;
  canViewRegistrations: boolean;
  canManageUsers: boolean;
  canManageLogs: boolean;
  canManageTournaments: boolean;
  canSendEmails: boolean;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  tournamentName?: string;
  userRole?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Tournament {
  id: number;
  name: string;
  status: string;
}

export default function AdminStaffContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [accessList, setAccessList] = useState<StaffAccess[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccess, setEditingAccess] = useState<StaffAccess | null>(null);
  const [clubs, setClubs] = useState<Array<{ id: number; name: string }>>([]);
  const [accessType, setAccessType] = useState<'club' | 'tournament'>('tournament');
  const [formData, setFormData] = useState({
    userId: '',
    userRole: '' as 'admin' | 'manager' | 'staff' | 'coach' | '',
    tournamentIds: [] as number[],
    clubIds: [] as number[],
    canManageGroups: true,
    canManageMatches: true,
    canViewRegistrations: true,
    canManageUsers: false,
    canManageLogs: false,
    canManageTournaments: false,
    canSendEmails: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Фильтрация и поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTournament, setFilterTournament] = useState<number | ''>('');
  const [filterUser, setFilterUser] = useState<string | ''>('');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyFromUserId, setCopyFromUserId] = useState<string | ''>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Verify admin access and fetch data
    fetch('/api/auth/login', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== 'superadmin') {
          router.push(`/${locale}/dashboard`);
        } else {
          fetchData();
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const fetchData = async () => {
    if (!token) return;
    
    try {
      // Загружаем доступы, пользователей и турниры
      const response = await fetch('/api/admin/staff?includeDetails=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccessList(data.access || []);
        setUsers(data.users || []);
        setTournaments(data.tournaments || []);
      } else {
        setError('Failed to load staff access');
      }

      // Загружаем клубы
      const clubsResponse = await fetch('/api/admin/clubs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        setClubs(clubsData.clubs || []);
      }
    } catch (err) {
      setError('Failed to load staff access');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) return;

    if (!formData.userId) {
      setError('Please select a user');
      return;
    }

    if (accessType === 'tournament' && formData.tournamentIds.length === 0) {
      setError('Please select at least one tournament');
      return;
    }

    if (accessType === 'club' && formData.clubIds.length === 0) {
      setError('Please select at least one club');
      return;
    }

    if (!formData.userRole) {
      setError('Please select a role');
      return;
    }

    try {
      // Обновляем роль пользователя, если она указана
      if (formData.userRole) {
        const user = users.find(u => u.id === formData.userId);
        // Обновляем роль, даже если она уже установлена, чтобы убедиться, что она сохранена в БД
        const updateRoleResponse = await fetch(`/api/admin/users/${formData.userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: formData.userRole }),
        });

        if (!updateRoleResponse.ok) {
          const errorData = await updateRoleResponse.json();
          setError(errorData.error || 'Failed to update user role');
          return;
        }
        
        console.log(`[Staff Access] Updated user role to ${formData.userRole} for user ${formData.userId}`);
        
        // Обновляем локальное состояние пользователя
        if (user) {
          user.role = formData.userRole as any;
        }
      }

      // Создаем доступы в зависимости от типа
      const accessPromises: Promise<Response>[] = [];
      
      if (accessType === 'tournament') {
        // Создаем доступы для каждого выбранного турнира
        accessPromises.push(...formData.tournamentIds.map(tournamentId =>
          fetch('/api/admin/staff', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: formData.userId,
              tournamentId,
              userRole: formData.userRole, // Передаем роль в запрос
              canManageGroups: formData.canManageGroups,
              canManageMatches: formData.canManageMatches,
              canViewRegistrations: formData.canViewRegistrations,
              canManageUsers: formData.canManageUsers,
              canManageLogs: formData.canManageLogs,
              canManageTournaments: formData.canManageTournaments,
              canSendEmails: formData.canSendEmails,
            }),
          })
        ));
      } else if (accessType === 'club') {
        // Создаем доступы для каждого выбранного клуба
        accessPromises.push(...formData.clubIds.map(clubId =>
          fetch(`/api/admin/clubs/${clubId}/access`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: formData.userId,
              role: formData.userRole,
            }),
          })
        ));
      }

      const responses = await Promise.all(accessPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const failed = responses.filter((r, index) => !r.ok);
      if (failed.length > 0) {
        setError(`Failed to create access for ${failed.length} tournament(s)`);
        return;
      }

      setSuccess(`Staff access created successfully for ${formData.tournamentIds.length} tournament(s)`);
      setShowCreateModal(false);
      resetForm();
      fetchData();
      
      // Обновляем список пользователей, чтобы отобразить новую роль
      // Это нужно, чтобы страница /admin/users показывала актуальную роль
      if (typeof window !== 'undefined') {
        // Отправляем событие для обновления данных на других страницах
        window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
          detail: { userId: formData.userId, newRole: formData.userRole } 
        }));
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create staff access');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !editingAccess) return;

    try {
      // Обновляем роль пользователя, если она указана
      if (formData.userRole) {
        const user = users.find(u => u.id === editingAccess.userId);
        // Обновляем роль, даже если она уже установлена, чтобы убедиться, что она сохранена в БД
        const updateRoleResponse = await fetch(`/api/admin/users/${editingAccess.userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: formData.userRole }),
        });

        if (!updateRoleResponse.ok) {
          const errorData = await updateRoleResponse.json();
          setError(errorData.error || 'Failed to update user role');
          return;
        }
        
        console.log(`[Staff Access] Updated user role to ${formData.userRole} for user ${editingAccess.userId}`);
        
        // Обновляем локальное состояние пользователя
        if (user) {
          user.role = formData.userRole as any;
        }
      }

      // Обновляем доступ для текущего турнира
      const response = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingAccess.userId,
          tournamentId: editingAccess.tournamentId,
          canManageGroups: formData.canManageGroups,
          canManageMatches: formData.canManageMatches,
          canViewRegistrations: formData.canViewRegistrations,
          canManageUsers: formData.canManageUsers,
          canManageLogs: formData.canManageLogs,
          canManageTournaments: formData.canManageTournaments,
          canSendEmails: formData.canSendEmails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Staff access updated successfully');
        setEditingAccess(null);
        resetForm();
        fetchData();
        
        // Обновляем список пользователей, чтобы отобразить новую роль
        if (typeof window !== 'undefined' && formData.userRole) {
          window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
            detail: { userId: editingAccess.userId, newRole: formData.userRole } 
          }));
        }
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update staff access');
      }
    } catch (err) {
      setError('Failed to update staff access');
    }
  };

  const handleDelete = async (userId: string, tournamentId: number) => {
    if (!token || !confirm('Are you sure you want to remove this staff access?')) return;

    try {
      const response = await fetch(`/api/admin/staff?userId=${userId}&tournamentId=${tournamentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Staff access removed successfully');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to remove staff access');
      }
    } catch (err) {
      setError('Failed to remove staff access');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      userRole: '',
      tournamentIds: [],
      clubIds: [],
      canManageGroups: true,
      canManageMatches: true,
      canViewRegistrations: true,
      canManageUsers: false,
      canManageLogs: false,
      canManageTournaments: false,
      canSendEmails: false,
    });
  };

  const openEditModal = (access: StaffAccess) => {
    setEditingAccess(access);
    const user = users.find(u => u.id === access.userId);
    setFormData({
      userId: access.userId,
      userRole: (user?.role as any) || '',
      tournamentIds: [access.tournamentId],
      clubIds: [],
      canManageGroups: access.canManageGroups,
      canManageMatches: access.canManageMatches,
      canViewRegistrations: access.canViewRegistrations,
      canManageUsers: access.canManageUsers,
      canManageLogs: access.canManageLogs,
      canManageTournaments: access.canManageTournaments,
      canSendEmails: access.canSendEmails,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingAccess(null);
    resetForm();
  };

  // Показываем всех пользователей (включая superadmin для назначения ролей)
  const availableUsers = users;

  // Фильтрация списка доступов
  const filteredAccessList = accessList.filter((access) => {
    const matchesSearch = !searchQuery || 
      access.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      access.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      access.tournamentName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTournament = !filterTournament || access.tournamentId === filterTournament;
    const matchesUser = !filterUser || access.userId === filterUser;

    return matchesSearch && matchesTournament && matchesUser;
  });

  // Статистика
  const stats = {
    totalAccess: accessList.length,
    uniqueUsers: new Set(accessList.map(a => a.userId)).size,
    uniqueTournaments: new Set(accessList.map(a => a.tournamentId)).size,
    usersWithAccess: accessList.reduce((acc, access) => {
      if (!acc[access.userId]) {
        acc[access.userId] = {
          userId: access.userId,
          userName: access.userName || 'Unknown',
          userEmail: access.userEmail || 'Unknown',
          tournamentCount: 0,
          permissions: {
            canManageGroups: false,
            canManageMatches: false,
            canViewRegistrations: false,
            canManageUsers: false,
            canManageLogs: false,
            canManageTournaments: false,
            canSendEmails: false,
          }
        };
      }
      acc[access.userId].tournamentCount++;
      acc[access.userId].permissions.canManageGroups = acc[access.userId].permissions.canManageGroups || access.canManageGroups;
      acc[access.userId].permissions.canManageMatches = acc[access.userId].permissions.canManageMatches || access.canManageMatches;
      acc[access.userId].permissions.canViewRegistrations = acc[access.userId].permissions.canViewRegistrations || access.canViewRegistrations;
      acc[access.userId].permissions.canManageUsers = acc[access.userId].permissions.canManageUsers || access.canManageUsers;
      acc[access.userId].permissions.canManageLogs = acc[access.userId].permissions.canManageLogs || access.canManageLogs;
      acc[access.userId].permissions.canManageTournaments = acc[access.userId].permissions.canManageTournaments || access.canManageTournaments;
      acc[access.userId].permissions.canSendEmails = acc[access.userId].permissions.canSendEmails || access.canSendEmails;
      return acc;
    }, {} as Record<string, any>),
  };

  const handleCopyAccess = async () => {
    if (!token || !copyFromUserId || !formData.userId) {
      setError('Please select both users');
      return;
    }

    if (copyFromUserId === formData.userId) {
      setError('Cannot copy access to the same user');
      return;
    }

    try {
      // Получаем доступы исходного пользователя
      const sourceAccesses = accessList.filter(a => a.userId === copyFromUserId);
      
      if (sourceAccesses.length === 0) {
        setError('Source user has no access to copy');
        return;
      }

      // Создаем доступы для целевого пользователя
      let successCount = 0;
      let errorCount = 0;

      for (const sourceAccess of sourceAccesses) {
        try {
          const response = await fetch('/api/admin/staff', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: formData.userId,
              tournamentId: sourceAccess.tournamentId,
              canManageGroups: sourceAccess.canManageGroups,
              canManageMatches: sourceAccess.canManageMatches,
              canViewRegistrations: sourceAccess.canViewRegistrations,
              canManageUsers: sourceAccess.canManageUsers,
              canManageLogs: sourceAccess.canManageLogs,
              canManageTournaments: sourceAccess.canManageTournaments,
              canSendEmails: sourceAccess.canSendEmails,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully copied ${successCount} access${successCount > 1 ? 'es' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
        setShowCopyModal(false);
        setCopyFromUserId('');
        fetchData();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to copy access');
      }
    } catch (err) {
      setError('Failed to copy access');
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-text-secondary font-poppins">{t('loading')}</p>
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
              {t('staff.title')}
            </h1>
            <p className="text-xl text-text-secondary font-poppins">
              {t('staff.description')}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('staff.assignAccess')}
          </button>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-text font-poppins font-semibold">{success}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-text font-poppins font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background-secondary p-4 rounded-lg border border-border">
            <div className="text-text-secondary font-poppins text-sm mb-1">{t('staff.stats.totalAccess')}</div>
            <div className="text-2xl font-poppins font-bold text-text">{stats.totalAccess}</div>
          </div>
          <div className="bg-background-secondary p-4 rounded-lg border border-border">
            <div className="text-text-secondary font-poppins text-sm mb-1">{t('staff.stats.uniqueUsers')}</div>
            <div className="text-2xl font-poppins font-bold text-text">{stats.uniqueUsers}</div>
          </div>
          <div className="bg-background-secondary p-4 rounded-lg border border-border">
            <div className="text-text-secondary font-poppins text-sm mb-1">{t('staff.stats.uniqueTournaments')}</div>
            <div className="text-2xl font-poppins font-bold text-text">{stats.uniqueTournaments}</div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-background-secondary p-4 rounded-lg border border-border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('staff.search')}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('staff.searchPlaceholder')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('staff.filterByTournament')}
              </label>
              <select
                value={filterTournament}
                onChange={(e) => setFilterTournament(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">{t('staff.allTournaments')}</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('staff.filterByUser')}
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value || '')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">{t('staff.allUsers')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTournament('');
                setFilterUser('');
              }}
              className="px-4 py-2 bg-background border border-border rounded-lg text-text-secondary hover:text-text font-poppins text-sm transition-colors"
            >
              {t('staff.clearFilters')}
            </button>
            <button
              onClick={() => setShowCopyModal(true)}
              className="px-4 py-2 bg-primary/20 text-primary border border-primary rounded-lg hover:bg-primary/30 font-poppins text-sm transition-colors"
            >
              {t('staff.copyAccess')}
            </button>
          </div>
        </div>

        {/* Staff Access Table */}
        {accessList.length === 0 ? (
          <div className="bg-background-secondary p-12 rounded-lg border border-border text-center">
            <p className="text-text-secondary font-poppins text-lg mb-4">
              {t('staff.noAccess')}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('staff.assignAccess')}
            </button>
          </div>
        ) : (
          <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('staff.user')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('staff.tournament')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('staff.permissions')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('staff.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAccessList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-secondary font-poppins">
                        {t('staff.noResults')}
                      </td>
                    </tr>
                  ) : (
                    filteredAccessList.map((access) => (
                    <tr key={`${access.userId}-${access.tournamentId}`} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-poppins font-semibold text-text">
                          {access.userName || 'Unknown'}
                        </div>
                        <div className="text-sm text-text-secondary font-poppins">
                          {access.userEmail || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-poppins text-text">
                          {access.tournamentName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {access.canManageGroups && (
                            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-poppins rounded">
                              {t('staff.canManageGroups')}
                            </span>
                          )}
                          {access.canManageMatches && (
                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs font-poppins rounded">
                              {t('staff.canManageMatches')}
                            </span>
                          )}
                          {access.canViewRegistrations && (
                            <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-poppins rounded">
                              {t('staff.canViewRegistrations')}
                            </span>
                          )}
                          {access.canManageUsers && (
                            <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-poppins rounded">
                              {t('staff.canManageUsers')}
                            </span>
                          )}
                          {access.canManageLogs && (
                            <span className="inline-block px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-poppins rounded">
                              {t('staff.canManageLogs')}
                            </span>
                          )}
                          {access.canManageTournaments && (
                            <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-poppins rounded">
                              {t('staff.canManageTournaments')}
                            </span>
                          )}
                          {access.canSendEmails && (
                            <span className="inline-block px-2 py-1 bg-pink-500/20 text-pink-400 text-xs font-poppins rounded">
                              {t('staff.canSendEmails')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openEditModal(access)}
                            className="text-primary hover:text-accent font-poppins text-sm transition-colors"
                          >
                            {t('staff.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(access.userId, access.tournamentId)}
                            className="text-red-400 hover:text-red-300 font-poppins text-sm transition-colors"
                          >
                            {t('staff.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border">
                <h3 className="text-2xl font-poppins font-bold gradient-text">
                  {editingAccess ? t('staff.editAccess') : t('staff.assignAccess')}
                </h3>
              </div>
              <form onSubmit={editingAccess ? handleUpdate : handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('staff.user')} *
                  </label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        userId: e.target.value,
                        userRole: (selectedUser?.role || '') as 'admin' | 'manager' | 'staff' | 'coach' | ''
                      });
                    }}
                    disabled={!!editingAccess}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
                  >
                    <option value="">{t('staff.selectUser')}</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Выбор типа доступа */}
                {!editingAccess && (
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      Access Type *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="accessType"
                          value="tournament"
                          checked={accessType === 'tournament'}
                          onChange={(e) => {
                            setAccessType('tournament');
                            setFormData({ ...formData, clubIds: [] });
                          }}
                          className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                        <span className="text-text font-poppins">Tournament</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="accessType"
                          value="club"
                          checked={accessType === 'club'}
                          onChange={(e) => {
                            setAccessType('club');
                            setFormData({ ...formData, tournamentIds: [] });
                          }}
                          className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                        <span className="text-text font-poppins">Club</span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Role {!editingAccess && '*'}
                  </label>
                  <select
                    required={!editingAccess}
                    value={formData.userRole}
                    onChange={(e) => setFormData({ ...formData, userRole: (e.target.value || '') as 'admin' | 'manager' | 'staff' | 'coach' | '' })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>

                {/* Выбор турниров */}
                {accessType === 'tournament' && (
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('staff.tournament')} {!editingAccess && '*'}
                    </label>
                    {editingAccess ? (
                      <div className="px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins opacity-60">
                        {tournaments.find(t => t.id === editingAccess.tournamentId)?.name || 'Unknown'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-background">
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={formData.tournamentIds.length === tournaments.length && tournaments.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, tournamentIds: tournaments.map(t => t.id) });
                              } else {
                                setFormData({ ...formData, tournamentIds: [] });
                              }
                            }}
                            className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                          />
                          <span className="text-text font-poppins font-semibold">{t('staff.selectAllTournaments')}</span>
                        </label>
                        {tournaments.map((tournament) => (
                          <label key={tournament.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.tournamentIds.includes(tournament.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, tournamentIds: [...formData.tournamentIds, tournament.id] });
                                } else {
                                  setFormData({ ...formData, tournamentIds: formData.tournamentIds.filter(id => id !== tournament.id) });
                                }
                              }}
                              className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                            />
                            <span className="text-text font-poppins">{tournament.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Выбор клубов */}
                {accessType === 'club' && (
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      Club {!editingAccess && '*'}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-background">
                      <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={formData.clubIds.length === clubs.length && clubs.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, clubIds: clubs.map(c => c.id) });
                            } else {
                              setFormData({ ...formData, clubIds: [] });
                            }
                          }}
                          className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                        <span className="text-text font-poppins font-semibold">Select All Clubs</span>
                      </label>
                      {clubs.map((club) => (
                        <label key={club.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.clubIds.includes(club.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, clubIds: [...formData.clubIds, club.id] });
                              } else {
                                setFormData({ ...formData, clubIds: formData.clubIds.filter(id => id !== club.id) });
                              }
                            }}
                            className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                          />
                          <span className="text-text font-poppins">{club.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="block text-sm font-poppins font-semibold text-text mb-3">
                    {t('staff.permissions')}
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageGroups}
                      onChange={(e) => setFormData({ ...formData, canManageGroups: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canManageGroups')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageMatches}
                      onChange={(e) => setFormData({ ...formData, canManageMatches: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canManageMatches')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canViewRegistrations}
                      onChange={(e) => setFormData({ ...formData, canViewRegistrations: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canViewRegistrations')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageUsers}
                      onChange={(e) => setFormData({ ...formData, canManageUsers: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canManageUsers')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageLogs}
                      onChange={(e) => setFormData({ ...formData, canManageLogs: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canManageLogs')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageTournaments}
                      onChange={(e) => setFormData({ ...formData, canManageTournaments: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canManageTournaments')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canSendEmails}
                      onChange={(e) => setFormData({ ...formData, canSendEmails: e.target.checked })}
                      className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                    <span className="text-text font-poppins">{t('staff.canSendEmails')}</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border-2 border-border text-text-secondary font-poppins font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {t('staff.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {editingAccess ? t('staff.update') : t('staff.assign')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Copy Access Modal */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-md w-full">
              <div className="p-6 border-b border-border">
                <h3 className="text-2xl font-poppins font-bold gradient-text">
                  {t('staff.copyAccess')}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('staff.copyFrom')} *
                  </label>
                  <select
                    required
                    value={copyFromUserId}
                    onChange={(e) => setCopyFromUserId(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">{t('staff.selectUser')}</option>
                    {users.filter(u => {
                      const userAccesses = accessList.filter(a => a.userId === u.id);
                      return userAccesses.length > 0;
                    }).map((user) => {
                      const userAccesses = accessList.filter(a => a.userId === user.id);
                      return (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({userAccesses.length} {t('staff.accesses')})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('staff.copyTo')} *
                  </label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">{t('staff.selectUser')}</option>
                    {users.filter(u => u.id !== copyFromUserId).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleCopyAccess}
                    className="flex-1 px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins"
                  >
                    {t('staff.copy')}
                  </button>
                  <button
                    onClick={() => {
                      setShowCopyModal(false);
                      setCopyFromUserId('');
                    }}
                    className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
                  >
                    {t('staff.cancel')}
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
