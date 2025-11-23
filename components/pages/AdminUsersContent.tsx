'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'staff' | 'participant' | 'manager' | 'coach' | 'tournament_admin';
  createdAt: string;
  emailVerified?: boolean;
}

export default function AdminUsersContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'bookings' | 'matches' | 'wallet' | 'events' | 'trainings' | 'profile'>('list');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'participant' as 'superadmin' | 'staff' | 'participant' | 'manager' | 'coach' | 'tournament_admin',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [emailUser, setEmailUser] = useState<User | null>(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Данные для вкладок
  const [bookings, setBookings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Copy to clipboard function
  const copyToClipboard = async (value: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // CopyableField component
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
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary"
            title={isCopied ? 'Copied!' : 'Copy'}
          >
            {isCopied ? (
              <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

  // Icon components
  const ViewIcon = (props: any) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EditIcon = (props: any) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const TrashIcon = (props: any) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  // ActionIconButton component
  const ActionIconButton = ({
    label,
    onClick,
    Icon,
    variant = 'default',
  }: {
    label: string;
    onClick?: () => void;
    Icon: (props: any) => JSX.Element;
    variant?: 'default' | 'danger';
  }) => {
    const baseClasses = "p-2 rounded transition-colors inline-flex items-center justify-center";
    const defaultClasses = "bg-primary/20 text-primary hover:bg-primary/30";
    const dangerClasses = "bg-red-500/20 text-red-400 hover:bg-red-500/30";
    const className = baseClasses + (variant === 'danger' ? ` ${dangerClasses}` : ` ${defaultClasses}`);

    return (
      <button
        onClick={onClick}
        className={className}
        title={label}
        type="button"
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </button>
    );
  };

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Verify admin access and fetch users
    fetch('/api/auth/login', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== 'superadmin') {
          router.push(`/${locale}/dashboard`);
        } else {
          fetchUsers();
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  // Загрузка данных при смене вкладки
  useEffect(() => {
    if (selectedUserId && activeTab !== 'list') {
      fetchTabData(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, activeTab, token]);

  const fetchTabData = async (tab: string) => {
    if (!token || !selectedUserId) return;
    
    setLoadingTab(true);
    try {
      switch (tab) {
        case 'bookings':
          const bookingsRes = await fetch(`/api/admin/users/${selectedUserId}/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            setBookings(bookingsData.bookings || []);
          }
          break;
        case 'matches':
          const matchesRes = await fetch(`/api/admin/users/${selectedUserId}/matches`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (matchesRes.ok) {
            const matchesData = await matchesRes.json();
            setMatches(matchesData.matches || []);
          }
          break;
        case 'wallet':
          const walletRes = await fetch(`/api/admin/users/${selectedUserId}/wallet`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (walletRes.ok) {
            const walletData = await walletRes.json();
            setWallet(walletData.wallet || null);
            setWalletTransactions(walletData.transactions || []);
          }
          break;
        case 'events':
          const eventsRes = await fetch(`/api/admin/users/${selectedUserId}/events`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setEvents(eventsData.events || []);
          }
          break;
        case 'trainings':
          const trainingsRes = await fetch(`/api/admin/users/${selectedUserId}/trainings`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (trainingsRes.ok) {
            const trainingsData = await trainingsRes.json();
            setTrainings(trainingsData.trainings || []);
          }
          break;
        case 'profile':
          const profileRes = await fetch(`/api/admin/users/${selectedUserId}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setProfile(profileData);
          }
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
    } finally {
      setLoadingTab(false);
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
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User created successfully');
        setShowCreateModal(false);
        setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'participant' });
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !editingUser) return;

    try {
      const updateData: any = { id: editingUser.id };
      if (formData.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;
      if (formData.firstName) updateData.firstName = formData.firstName;
      if (formData.lastName) updateData.lastName = formData.lastName;
      if (formData.role) updateData.role = formData.role;

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User updated successfully');
        setEditingUser(null);
        setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'participant' });
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  };

  const handleSendEmail = async () => {
    if (!token || !selectedEmailTemplate || !emailUser) return;

    try {
      setSendingEmail(true);
      setError(null);
      
      const userLocale = locale; // Можно получить из пользователя, если есть preferred_language

      const response = await fetch(`/api/admin/users/${emailUser.id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedEmailTemplate,
          locale: userLocale,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Email sent successfully to ${emailUser.email}`);
        setShowEmailModal(false);
        setEmailUser(null);
        setSelectedEmailTemplate('');
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        let errorMessage = data.error || 'Failed to send email';
        if (data.message) {
          errorMessage = data.message;
        } else if (data.missingFields && Array.isArray(data.missingFields)) {
          errorMessage = `${errorMessage}:\n\nMissing fields:\n${data.missingFields.map((field: string) => `  • ${field}`).join('\n')}`;
        }
        setError(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'participant' });
    setError(null);
    setShowEmailModal(false);
    setEmailUser(null);
    setSelectedEmailTemplate('');
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
            {t('users.title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins">
            {t('users.description')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchUsers();
            }}
            disabled={loading}
            className="px-6 py-3 bg-background-secondary border border-border text-text font-orbitron font-semibold rounded-lg hover:bg-background hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={t('users.refresh') || 'Refresh'}
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('users.refresh') || 'Refresh'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('users.createUser')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-5 backdrop-blur-sm">
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

      {success && (
        <div className="mb-4 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg p-5 backdrop-blur-sm">
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

      {/* Вкладки */}
      <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedUserId(null);
            }}
            className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
              activeTab === 'list'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {t('users.list')}
          </button>
          {selectedUserId && (
            <>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
                  activeTab === 'bookings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t('users.bookings')}
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
                  activeTab === 'matches'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t('users.matches')}
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
                  activeTab === 'wallet'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t('users.wallet')}
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
                  activeTab === 'events'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t('users.events')}
              </button>
              <button
                onClick={() => setActiveTab('trainings')}
                className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
                  activeTab === 'trainings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t('users.trainings')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {t('users.profile')}
              </button>
            </>
          )}
        </div>

      {/* Контент вкладок */}
      {activeTab === 'list' && (
        <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-2 py-4 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap w-16">
                    #
                  </th>
                  <th className="px-2 py-4 text-left text-xs font-poppins font-semibold text-text-secondary whitespace-nowrap w-24">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-text font-orbitron font-semibold">
                    <div className="flex items-center gap-2">
                      {t('users.email')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-text font-orbitron font-semibold">{t('users.name')}</th>
                  <th className="px-6 py-4 text-left text-text font-orbitron font-semibold">{t('users.role')}</th>
                  <th className="px-6 py-4 text-left text-text font-orbitron font-semibold">{t('users.createdAt')}</th>
                  <th className="px-6 py-4 text-left text-text font-orbitron font-semibold">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className="border-b border-border hover:bg-background/50 transition-colors">
                    <td className="px-2 py-4 text-xs text-text-secondary font-poppins text-center">
                      {index + 1}
                    </td>
                    <td className="px-2 py-4 text-xs text-text-secondary font-poppins">
                      <CopyableField value={user.id} fieldId={`userId-${user.id}`}>
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold truncate block max-w-[80px]">
                          {user.id.substring(0, 6)}...
                        </span>
                      </CopyableField>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-poppins">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold cursor-help ${
                            user.emailVerified
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                          title={user.emailVerified ? 'Verified' : 'Unverified'}
                        >
                          {user.emailVerified ? 'V' : 'U'}
                        </span>
                        <CopyableField value={user.email} fieldId={`email-${user.id}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-poppins">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-poppins font-semibold ${
                        user.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'staff' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                      {new Date(user.createdAt).toLocaleString(locale, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <ActionIconButton
                          label={t('users.view')}
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setActiveTab('profile');
                          }}
                          Icon={ViewIcon}
                        />
                        <ActionIconButton
                          label={t('users.edit')}
                          onClick={() => openEditModal(user)}
                          Icon={EditIcon}
                        />
                        <ActionIconButton
                          label={t('users.delete')}
                          onClick={() => handleDelete(user.id)}
                          Icon={TrashIcon}
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-text-secondary font-poppins">
                {t('users.noUsers')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Вкладки для выбранного пользователя */}
      {selectedUserId && activeTab !== 'list' && (
        <div className="bg-background-secondary rounded-lg border border-border p-6">
            {loadingTab ? (
              <div className="text-center py-8">
                <p className="text-text-secondary font-poppins">{t('loading')}</p>
              </div>
            ) : (
              <>
                {activeTab === 'bookings' && (
                  <div>
                    <h3 className="text-xl font-poppins font-bold mb-4 text-text">{t('users.bookings')}</h3>
                    {bookings.length === 0 ? (
                      <p className="text-text-secondary font-poppins">{t('users.noBookings')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-background border-b border-border">
                            <tr>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.bookingTournament')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.bookingCategories')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.bookingStatus')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.bookingDate')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr key={booking.id} className="border-b border-border hover:bg-background/50">
                                <td className="p-4 text-text font-poppins">{booking.tournamentName}</td>
                                <td className="p-4 text-text-secondary font-poppins">
                                  {Array.isArray(booking.categories) ? booking.categories.join(', ') : booking.categories}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-poppins ${
                                    booking.confirmed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {booking.confirmed ? t('users.confirmed') : t('users.pending')}
                                  </span>
                                </td>
                                <td className="p-4 text-text-secondary font-poppins text-sm">
                                  {new Date(booking.createdAt).toLocaleDateString(locale)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'matches' && (
                  <div>
                    <h3 className="text-xl font-poppins font-bold mb-4 text-text">{t('users.matches')}</h3>
                    {matches.length === 0 ? (
                      <p className="text-text-secondary font-poppins">{t('users.noMatches')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-background border-b border-border">
                            <tr>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.matchTournament')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.matchPair1')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.matchPair2')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.matchScore')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.matchDate')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matches.map((match) => (
                              <tr key={match.id} className="border-b border-border hover:bg-background/50">
                                <td className="p-4 text-text font-poppins">{match.tournamentName}</td>
                                <td className="p-4 text-text-secondary font-poppins">{match.pair1Player || '-'}</td>
                                <td className="p-4 text-text-secondary font-poppins">{match.pair2Player || '-'}</td>
                                <td className="p-4 text-text font-poppins">
                                  {match.pair1Games !== null && match.pair2Games !== null 
                                    ? `${match.pair1Games} - ${match.pair2Games}`
                                    : t('users.noScore')}
                                </td>
                                <td className="p-4 text-text-secondary font-poppins text-sm">
                                  {match.matchDate ? new Date(match.matchDate).toLocaleString(locale) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'wallet' && (
                  <div>
                    <h3 className="text-xl font-poppins font-bold mb-4 text-text">{t('users.wallet')}</h3>
                    {wallet && (
                      <div className="mb-6 p-4 bg-background rounded-lg border border-border">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-text-secondary font-poppins text-sm">{t('users.walletBalance')}</p>
                            <p className="text-2xl font-poppins font-bold text-text">
                              {wallet.balance.toFixed(2)} {wallet.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <h4 className="text-lg font-poppins font-semibold mb-4 text-text">{t('users.transactions')}</h4>
                    {walletTransactions.length === 0 ? (
                      <p className="text-text-secondary font-poppins">{t('users.noTransactions')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-background border-b border-border">
                            <tr>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.transactionType')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.transactionAmount')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.transactionStatus')}</th>
                              <th className="text-left p-4 font-poppins font-semibold text-text">{t('users.transactionDate')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {walletTransactions.map((transaction) => (
                              <tr key={transaction.id} className="border-b border-border hover:bg-background/50">
                                <td className="p-4 text-text font-poppins">{transaction.type}</td>
                                <td className={`p-4 font-poppins font-semibold ${
                                  transaction.type === 'deposit' || transaction.type === 'refund' 
                                    ? 'text-green-400' 
                                    : 'text-red-400'
                                }`}>
                                  {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                                  {transaction.amount.toFixed(2)} {transaction.currency}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-poppins ${
                                    transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {transaction.status}
                                  </span>
                                </td>
                                <td className="p-4 text-text-secondary font-poppins text-sm">
                                  {new Date(transaction.createdAt).toLocaleString(locale)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'events' && (
                  <div>
                    <h3 className="text-xl font-poppins font-bold mb-4 text-text">{t('users.events')}</h3>
                    {events.length === 0 ? (
                      <p className="text-text-secondary font-poppins">{t('users.noEvents')}</p>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="p-4 bg-background rounded-lg border border-border">
                            <h4 className="text-lg font-poppins font-semibold text-text mb-2">{event.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary font-poppins">
                              <div>
                                <span className="font-semibold">{t('users.eventStartDate')}:</span> {event.startDate ? new Date(event.startDate).toLocaleDateString(locale) : '-'}
                              </div>
                              <div>
                                <span className="font-semibold">{t('users.eventEndDate')}:</span> {event.endDate ? new Date(event.endDate).toLocaleDateString(locale) : '-'}
                              </div>
                              <div>
                                <span className="font-semibold">{t('users.eventLocation')}:</span> {event.location || '-'}
                              </div>
                              <div>
                                <span className="font-semibold">{t('users.eventStatus')}:</span> {event.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'trainings' && (
                  <div>
                    <h3 className="text-xl font-poppins font-bold mb-4 text-text">{t('users.trainings')}</h3>
                    {trainings.length === 0 ? (
                      <p className="text-text-secondary font-poppins">{t('users.noTrainings')}</p>
                    ) : (
                      <div className="space-y-4">
                        {trainings.map((training) => (
                          <div key={training.id} className="p-4 bg-background rounded-lg border border-border">
                            <p className="text-text font-poppins">{training.name || training.id}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'profile' && profile && (
                  <div>
                    <h3 className="text-xl font-poppins font-bold mb-4 text-text">{t('users.profile')}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-text-secondary font-poppins text-sm mb-1">{t('users.email')}</p>
                        <p className="text-text font-poppins font-semibold">{profile.profile.email}</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-text-secondary font-poppins text-sm mb-1">{t('users.name')}</p>
                        <p className="text-text font-poppins font-semibold">
                          {profile.profile.firstName} {profile.profile.lastName}
                        </p>
                      </div>
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-text-secondary font-poppins text-sm mb-1">{t('users.role')}</p>
                        <p className="text-text font-poppins font-semibold">{profile.profile.role}</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-text-secondary font-poppins text-sm mb-1">{t('users.phone')}</p>
                        <p className="text-text font-poppins font-semibold">{profile.profile.phone || '-'}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-border">
                      <h4 className="text-lg font-poppins font-semibold mb-4 text-text">{t('users.statistics')}</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-text-secondary font-poppins text-sm">{t('users.totalRegistrations')}</p>
                          <p className="text-2xl font-poppins font-bold text-text">{profile.stats.totalRegistrations}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary font-poppins text-sm">{t('users.confirmedRegistrations')}</p>
                          <p className="text-2xl font-poppins font-bold text-text">{profile.stats.confirmedRegistrations}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary font-poppins text-sm">{t('users.totalMatches')}</p>
                          <p className="text-2xl font-poppins font-bold text-text">{profile.stats.totalMatches}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      )}

      {/* Create/Edit Modal */}
        {(showCreateModal || editingUser) && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-background-secondary border border-border rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-orbitron font-bold gradient-text">
                  {editingUser ? t('users.editUser') : t('users.createUser')}
                </h3>
                <button
                  onClick={closeModals}
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('users.email')}
                  </label>
                  <input
                    type="email"
                    required={!editingUser}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('users.password')} {editingUser && '(leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('users.firstName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('users.lastName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('users.role')}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="participant">Participant</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="coach">Coach</option>
                    <option value="tournament_admin">Tournament Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                {editingUser && !editingUser.emailVerified && (
                  <div className="pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!token || !editingUser) return;
                        try {
                          const response = await fetch(`/api/admin/users/${editingUser.id}/verify-email`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setSuccess('Email verified successfully');
                            fetchUsers();
                            closeModals();
                          } else {
                            setError(data.error || 'Failed to verify email');
                          }
                        } catch (err) {
                          setError('Failed to verify email');
                        }
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-text border border-cyan-500/30 font-poppins rounded-lg hover:from-cyan-500/30 hover:to-purple-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verify Email Manually
                    </button>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 px-4 py-2 border border-gray-700 text-text-secondary font-poppins rounded-lg hover:border-primary transition-colors"
                  >
                    {t('users.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {editingUser ? t('users.update') : t('users.create')}
                  </button>
                </div>
              </form>
            </div>
        </div>
      )}

      {/* Send Email Modal */}
        {showEmailModal && emailUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border max-w-md w-full">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-poppins font-bold gradient-text">
                    {t('users.sendEmail') || 'Send Email'}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {t('users.sendEmailTo') || 'Send email to:'} {emailUser.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailUser(null);
                    setSelectedEmailTemplate('');
                  }}
                  className="text-text-secondary hover:text-text transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm font-poppins whitespace-pre-line">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('users.selectEmailTemplate') || 'Select Email Template'}
                  </label>
                  <select
                    value={selectedEmailTemplate}
                    onChange={(e) => setSelectedEmailTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  >
                    <option value="">{t('users.selectTemplate') || '-- Select Template --'}</option>
                    
                    {/* Account Management */}
                    <optgroup label={t('users.categoryAccount') || '🔐 Account Management'}>
                      <option value="email_verification">{t('users.templateEmailVerification') || 'Email Verification'}</option>
                      <option value="welcome">{t('users.templateWelcome') || 'Welcome to PadelO₂.com'}</option>
                      <option value="password_reset">{t('users.templatePasswordReset') || 'Password Reset'}</option>
                      <option value="password_changed">{t('users.templatePasswordChanged') || 'Password Changed'}</option>
                      <option value="change_email_old">{t('users.templateChangeEmailOld') || 'Change Email - Old Address'}</option>
                      <option value="change_email_new">{t('users.templateChangeEmailNew') || 'Change Email - New Address'}</option>
                      <option value="account_deleted">{t('users.templateAccountDeleted') || 'Account Deleted'}</option>
                    </optgroup>

                    {/* Tournament Templates - Note */}
                    <optgroup label={t('users.categoryTournament') || '🏆 Tournament Templates (use tournament participants page)'}>
                      <option value="tournament_registration" disabled>{t('users.templateTournamentRegistration') || 'Tournament Registration'}</option>
                      <option value="tournament_confirmed" disabled>{t('users.templateTournamentConfirmed') || 'Tournament Confirmed'}</option>
                      <option value="tournament_waiting_list" disabled>{t('users.templateWaitingList') || 'Waiting List'}</option>
                      <option value="tournament_spot_confirmed" disabled>{t('users.templateSpotConfirmed') || 'Spot Confirmed'}</option>
                      <option value="payment_received" disabled>{t('users.templatePaymentReceived') || 'Payment Received'}</option>
                      <option value="payment_failed" disabled>{t('users.templatePaymentFailed') || 'Payment Failed'}</option>
                      <option value="tournament_schedule_published" disabled>{t('users.templateSchedulePublished') || 'Schedule Published'}</option>
                      <option value="match_reminder_1day" disabled>{t('users.templateMatchReminder1Day') || 'Match Reminder - 1 Day'}</option>
                      <option value="match_reminder_sameday" disabled>{t('users.templateMatchReminderSameDay') || 'Match Reminder - Same Day'}</option>
                      <option value="schedule_change" disabled>{t('users.templateScheduleChange') || 'Schedule Change'}</option>
                      <option value="group_stage_results" disabled>{t('users.templateGroupStageResults') || 'Group Stage Results'}</option>
                      <option value="finals_winners" disabled>{t('users.templateFinalsWinners') || 'Finals & Winners'}</option>
                      <option value="post_tournament_recap" disabled>{t('users.templatePostTournamentRecap') || 'Post-Tournament Recap'}</option>
                      <option value="tournament_feedback" disabled>{t('users.templateTournamentFeedback') || 'Tournament Feedback'}</option>
                      <option value="tournament_cancelled" disabled>{t('users.templateTournamentCancelled') || 'Tournament Cancelled'}</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailUser(null);
                      setSelectedEmailTemplate('');
                    }}
                    className="px-6 py-3 border-2 border-border text-text-secondary font-poppins font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {t('users.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={!selectedEmailTemplate || sendingEmail}
                    className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? (t('users.sending') || 'Sending...') : (t('users.send') || 'Send')}
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


