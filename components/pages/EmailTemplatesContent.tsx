'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

type EmailCategory = 'partners' | 'clients' | 'coaches' | 'staff';
type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  category: EmailCategory;
};

const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Partners
  {
    id: 'sponsorship-proposal',
    name: 'Sponsorship Proposal',
    description: 'Tournament sponsorship proposal for partners',
    category: 'partners',
  },
  // Clients - Tournament emails
  {
    id: 'tournament-registration',
    name: 'Tournament Registration',
    description: 'Registration confirmation email',
    category: 'clients',
  },
  {
    id: 'tournament-registration-confirmed',
    name: 'Tournament Registration Confirmed',
    description: 'Registration confirmed with payment',
    category: 'clients',
  },
  {
    id: 'tournament-waiting-list',
    name: 'Waiting List',
    description: 'Player added to waiting list',
    category: 'clients',
  },
  {
    id: 'tournament-spot-confirmed',
    name: 'Spot Confirmed',
    description: 'Spot available confirmation',
    category: 'clients',
  },
  {
    id: 'payment-received',
    name: 'Payment Received',
    description: 'Payment confirmation',
    category: 'clients',
  },
  {
    id: 'payment-failed',
    name: 'Payment Failed',
    description: 'Payment failure notification',
    category: 'clients',
  },
  {
    id: 'tournament-schedule-published',
    name: 'Schedule Published',
    description: 'Tournament schedule notification',
    category: 'clients',
  },
  {
    id: 'match-reminder-1day',
    name: 'Match Reminder (1 Day)',
    description: 'Match reminder 1 day before',
    category: 'clients',
  },
  {
    id: 'match-reminder-sameday',
    name: 'Match Reminder (Same Day)',
    description: 'Match reminder on match day',
    category: 'clients',
  },
  {
    id: 'schedule-change',
    name: 'Schedule Change',
    description: 'Match schedule change notification',
    category: 'clients',
  },
  {
    id: 'group-stage-results',
    name: 'Group Stage Results',
    description: 'Group stage results notification',
    category: 'clients',
  },
  {
    id: 'finals-winners',
    name: 'Finals Winners',
    description: 'Tournament winners announcement',
    category: 'clients',
  },
  {
    id: 'post-tournament-recap',
    name: 'Post Tournament Recap',
    description: 'Tournament recap and media',
    category: 'clients',
  },
  {
    id: 'tournament-feedback',
    name: 'Tournament Feedback',
    description: 'Request for tournament feedback',
    category: 'clients',
  },
  {
    id: 'tournament-cancelled',
    name: 'Tournament Cancelled',
    description: 'Tournament cancellation notification',
    category: 'clients',
  },
  {
    id: 'guest-tournament-registration',
    name: 'Guest Registration',
    description: 'Guest ticket registration',
    category: 'clients',
  },
  {
    id: 'guest-tournament-verification',
    name: 'Guest Verification',
    description: 'Guest verification email',
    category: 'clients',
  },
  {
    id: 'guest-tournament-registration-confirmed',
    name: 'Guest Registration Confirmed',
    description: 'Guest registration confirmed',
    category: 'clients',
  },
  // General emails
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Welcome new user',
    category: 'clients',
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    description: 'Password reset request',
    category: 'clients',
  },
  {
    id: 'password-changed',
    name: 'Password Changed',
    description: 'Password change confirmation',
    category: 'clients',
  },
  {
    id: 'new-device-login',
    name: 'New Device Login',
    description: 'New device login notification',
    category: 'clients',
  },
  {
    id: 'change-email-old',
    name: 'Change Email (Old Address)',
    description: 'Email change notification to old address',
    category: 'clients',
  },
  {
    id: 'change-email-new',
    name: 'Change Email (New Address)',
    description: 'Email change confirmation to new address',
    category: 'clients',
  },
  {
    id: 'account-deletion-confirm',
    name: 'Account Deletion Confirmation',
    description: 'Account deletion confirmation request',
    category: 'clients',
  },
  {
    id: 'account-deleted',
    name: 'Account Deleted',
    description: 'Account deletion confirmation',
    category: 'clients',
  },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ua', name: 'Українська', flag: '🇺🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ca', name: 'Català', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const CATEGORIES = [
  { id: 'partners' as EmailCategory, name: 'Partners', icon: '🤝', color: 'blue' },
  { id: 'clients' as EmailCategory, name: 'Clients', icon: '👥', color: 'green' },
  { id: 'coaches' as EmailCategory, name: 'Coaches', icon: '🏋️', color: 'purple' },
  { id: 'staff' as EmailCategory, name: 'Staff', icon: '👔', color: 'orange' },
];

export default function EmailTemplatesContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory>('partners');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sponsorship-proposal');
  const [translating, setTranslating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [editableHtml, setEditableHtml] = useState<string>('');
  
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [tournamentScope, setTournamentScope] = useState<'all' | 'specific'>('specific');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersData, setSelectedUsersData] = useState<Record<string, { fullName: string; preferredLanguage: string }>>({});
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [useUserLanguage, setUseUserLanguage] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    recipientName: '',
    company: '',
    locale: 'en',
    phone: '+34 662 423 738',
    contactEmail: 'partner@padelO2.com',
  });

  // Check authorization
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setCheckingAuth(false);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 0);
      return;
    }

    fetch('/api/auth/login', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('auth_token');
          setCheckingAuth(false);
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 0);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setCheckingAuth(false);
          return;
        }
        
        if (data.session && data.session.role === 'superadmin') {
          setAuthorized(true);
        } else {
          setCheckingAuth(false);
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 0);
        }
      })
      .catch((error) => {
        console.error('Error verifying session:', error);
        setCheckingAuth(false);
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 0);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [locale, router]);

  // Fetch tournaments
  useEffect(() => {
    if (!authorized) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/admin/tournaments', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTournaments(data.tournaments || []);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      }
    };

    fetchTournaments();
  }, [authorized]);

  // Search users
  useEffect(() => {
    if (!showUserSelector || !userSearchQuery.trim()) {
      setAvailableUsers([]);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const searchUsers = async () => {
      setSearchingUsers(true);
      try {
        const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchQuery)}&limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchingUsers(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, showUserSelector]);

  const translateText = async (text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> => {
    if (targetLang === sourceLang || !text.trim()) return text;

    const token = localStorage.getItem('auth_token');
    if (!token) return text;

    try {
      const response = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text, targetLang, sourceLang }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.translatedText || text;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }

    return text;
  };

  const generatePreviewHtml = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Validation
    if (selectedCategory === 'clients' && selectedUserIds.length === 0 && !formData.email) {
      setError('Please select at least one user or enter an email');
      return;
    }
    if ((selectedCategory === 'partners' || (selectedCategory === 'clients' && tournamentScope === 'specific')) && !selectedTournamentId) {
      setError('Please select a tournament');
      return;
    }

    try {
      const response = await fetch('/api/admin/partner-emails/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          partnerName: formData.recipientName,
          partnerCompany: formData.company,
          templateId: selectedTemplate,
          tournamentId: tournamentScope === 'specific' ? selectedTournamentId : null,
          tournamentScope: tournamentScope,
          userIds: selectedCategory === 'clients' ? selectedUserIds : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewHtml(data.html || '');
        setEditableHtml(data.html || '');
        setShowPreview(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Failed to generate preview');
    }
  };

  const handleSubmit = async (e: React.FormEvent, useCustomHtml?: boolean) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Validation
    if (selectedCategory === 'clients' && selectedUserIds.length === 0 && !formData.email) {
      setError('Please select at least one user or enter an email');
      setLoading(false);
      return;
    }
    if ((selectedCategory === 'partners' || (selectedCategory === 'clients' && tournamentScope === 'specific')) && !selectedTournamentId) {
      setError('Please select a tournament');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/partner-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          partnerName: formData.recipientName,
          partnerCompany: formData.company,
          customHtml: useCustomHtml ? editableHtml : undefined,
          templateId: selectedTemplate,
          category: selectedCategory,
          tournamentId: tournamentScope === 'specific' ? selectedTournamentId : null,
          tournamentScope: tournamentScope,
          userIds: selectedCategory === 'clients' ? selectedUserIds : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccess(true);
      setShowPreview(false);
      setTimeout(() => setSuccess(false), 5000);
      // Reset form
      setFormData({
        email: '',
        recipientName: '',
        company: '',
        locale: 'en',
        phone: '+34 662 423 738',
        contactEmail: 'partner@padelO2.com',
      });
      setSelectedUserIds([]);
      setSelectedTournamentId('');
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const filteredTemplates = EMAIL_TEMPLATES.filter(t => t.category === selectedCategory);
  const selectedTemplateData = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📧 Email Templates
          </h1>
          <p className="text-gray-600">
            Send emails to partners, clients, coaches, and staff
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      const firstTemplate = EMAIL_TEMPLATES.find(t => t.category === category.id);
                      if (firstTemplate) {
                        setSelectedTemplate(firstTemplate.id);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border-2 font-semibold ${
                      selectedCategory === category.id
                        ? category.color === 'blue' 
                          ? 'bg-blue-100 border-blue-500 text-blue-900'
                          : category.color === 'green'
                          ? 'bg-green-100 border-green-500 text-green-900'
                          : category.color === 'purple'
                          ? 'bg-purple-100 border-purple-500 text-purple-900'
                          : 'bg-orange-100 border-orange-500 text-orange-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-normal'
                    }`}
                  >
                    <span className="text-2xl mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Templates List */}
              {filteredTemplates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Templates</h3>
                  <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                          selectedTemplate === template.id
                            ? 'bg-blue-100 border-2 border-blue-500 text-blue-900 font-semibold'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
              {selectedTemplateData && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedTemplateData.name}
                  </h2>
                  <p className="text-gray-600">{selectedTemplateData.description}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tournament Selection (for Partners and Clients) */}
                {(selectedCategory === 'partners' || selectedCategory === 'clients') && (
                  <>
                    {selectedCategory === 'clients' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tournament Scope
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="specific"
                              checked={tournamentScope === 'specific'}
                              onChange={(e) => setTournamentScope(e.target.value as 'all' | 'specific')}
                              className="mr-2"
                            />
                            Specific Tournament
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="all"
                              checked={tournamentScope === 'all'}
                              onChange={(e) => setTournamentScope(e.target.value as 'all' | 'specific')}
                              className="mr-2"
                            />
                            All Tournaments
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {tournamentScope === 'specific' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tournament <span className="text-red-500">*</span>
                        </label>
                        <select
                          required={tournamentScope === 'specific'}
                          value={selectedTournamentId}
                          onChange={(e) => setSelectedTournamentId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        >
                          <option value="">Select tournament...</option>
                          {tournaments.map((tournament) => (
                            <option key={tournament.id} value={tournament.id}>
                              {tournament.name} ({tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* User Selection (for Clients) */}
                {selectedCategory === 'clients' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipients <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowUserSelector(true)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all text-left bg-white"
                      >
                        {selectedUserIds.length > 0 
                          ? `${selectedUserIds.length} user(s) selected`
                          : 'Click to select users...'}
                      </button>
                      {selectedUserIds.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Selected: {selectedUserIds.length} user(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recipient Email (for Partners and other categories) */}
                {selectedCategory !== 'clients' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="recipient@example.com"
                    />
                  </div>
                )}

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>

                {/* Company - только для Partners */}
                {selectedCategory !== 'clients' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Company Name"
                    />
                  </div>
                )}

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Language <span className="text-gray-500 text-xs">(14 languages available)</span>
                  </label>
                  <select
                    value={useUserLanguage && selectedCategory === 'clients' && selectedUserIds.length > 0 
                      ? 'user'
                      : formData.locale}
                    onChange={(e) => {
                      if (e.target.value === 'user') {
                        // Если выбрана опция "User's language"
                        if (selectedUserIds.length > 0) {
                          const firstUserLang = selectedUsersData[selectedUserIds[0]]?.preferredLanguage || 'en';
                          setUseUserLanguage(true);
                          setFormData({ ...formData, locale: firstUserLang });
                        }
                      } else {
                        setUseUserLanguage(false);
                        setFormData({ ...formData, locale: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    {selectedCategory === 'clients' && selectedUserIds.length > 0 && (
                      <option value="user">
                        🌐 User's language ({selectedUsersData[selectedUserIds[0]]?.preferredLanguage || 'en'})
                      </option>
                    )}
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  {selectedCategory === 'clients' && selectedUserIds.length > 0 && useUserLanguage && (
                    <p className="mt-2 text-sm text-gray-600">
                      Using language from user profile: <strong>{selectedUsersData[selectedUserIds[0]]?.preferredLanguage || 'en'}</strong>
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="+34 662 423 738"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="partner@padelO2.com"
                    />
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <p className="text-green-800 font-semibold">
                      ✅ Email sent successfully!
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <p className="text-red-800 font-semibold">
                      ❌ {error}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={generatePreviewHtml}
                    disabled={loading || !formData.email}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    👁️ Preview
                  </button>
                  <button
                    type="submit"
                    disabled={loading || translating}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      '🚀 Send Email'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">ℹ️ About Email Templates</h3>
              <p className="text-gray-700 text-sm mb-2">
                Templates are automatically translated using Google Translate API when you select a different language.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>All 14 languages are supported</li>
                <li>Translation happens automatically</li>
                <li>Branded footer with social media links included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Select Users</h2>
              <button
                onClick={() => {
                  setShowUserSelector(false);
                  setUserSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-4"
              />

              <div className="flex-1 overflow-y-auto">
                {searchingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Searching...</p>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {userSearchQuery.trim() ? 'No users found' : 'Start typing to search users...'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelectedIds = [...selectedUserIds, user.id];
                              setSelectedUserIds(newSelectedIds);
                              // Сохраняем данные пользователя
                              setSelectedUsersData(prev => ({
                                ...prev,
                                [user.id]: {
                                  fullName: user.fullName,
                                  preferredLanguage: user.preferredLanguage || 'en',
                                },
                              }));
                              // Если выбран только один пользователь, заполняем имя автоматически
                              if (newSelectedIds.length === 1 && selectedCategory === 'clients') {
                                // Автоматически включаем использование языка пользователя
                                setUseUserLanguage(true);
                                setFormData(prev => ({
                                  ...prev,
                                  recipientName: user.fullName,
                                  locale: user.preferredLanguage || 'en',
                                }));
                              }
                            } else {
                              const newSelectedIds = selectedUserIds.filter(id => id !== user.id);
                              setSelectedUserIds(newSelectedIds);
                              // Удаляем данные пользователя
                              setSelectedUsersData(prev => {
                                const newUsersData = { ...prev };
                                delete newUsersData[user.id];
                                return newUsersData;
                              });
                              // Если остался один пользователь, обновляем имя
                              if (newSelectedIds.length === 1 && selectedCategory === 'clients') {
                                const remainingUser = availableUsers.find(u => u.id === newSelectedIds[0]);
                                if (remainingUser) {
                                  setUseUserLanguage(true);
                                  setFormData(prev => ({
                                    ...prev,
                                    recipientName: remainingUser.fullName,
                                    locale: remainingUser.preferredLanguage || 'en',
                                  }));
                                }
                              } else if (newSelectedIds.length === 0) {
                                // Если пользователи не выбраны, очищаем имя и сбрасываем язык
                                setUseUserLanguage(false);
                                setFormData(prev => ({
                                  ...prev,
                                  recipientName: '',
                                }));
                              }
                            }
                          }}
                          className="mr-3 w-5 h-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedUserIds.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>{selectedUserIds.length}</strong> user(s) selected
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => {
                  setShowUserSelector(false);
                  setUserSearchQuery('');
                }}
                className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUserSelector(false);
                  setUserSearchQuery('');
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Done ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">📧 Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* HTML Editor */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">HTML Editor</h3>
                  <p className="text-xs text-gray-600">Edit the email HTML directly</p>
                </div>
                <textarea
                  value={editableHtml}
                  onChange={(e) => setEditableHtml(e.target.value)}
                  className="flex-1 p-4 font-mono text-sm border-0 resize-none focus:outline-none"
                  spellCheck={false}
                />
              </div>

              {/* Preview */}
              <div className="w-1/2 flex flex-col overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                  <p className="text-xs text-gray-600">How the email will look</p>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-100">
                  <div 
                    className="bg-white rounded-lg shadow-lg p-4 mx-auto max-w-2xl"
                    dangerouslySetInnerHTML={{ __html: editableHtml }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  handleSubmit(e, true);
                }}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Sending...' : '✅ Send with Custom HTML'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

