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
  // Staff emails
  {
    id: 'staff-access-granted',
    name: 'Staff Access Granted',
    description: 'Notify staff member about granted admin access',
    category: 'staff',
  },
  {
    id: 'role-change',
    name: 'Role Change Notification',
    description: 'Notify user about role change',
    category: 'staff',
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
  
  // Helper function to convert template ID to translation key (camelCase)
  const templateIdToKey = (templateId: string): string => {
    const keyMap: Record<string, string> = {
      'sponsorship-proposal': 'sponsorshipProposal',
      'tournament-registration': 'tournamentRegistration',
      'tournament-registration-confirmed': 'tournamentRegistrationConfirmed',
      'tournament-waiting-list': 'waitingList',
      'tournament-spot-confirmed': 'spotConfirmed',
      'payment-received': 'paymentReceived',
      'payment-failed': 'paymentFailed',
      'tournament-schedule-published': 'schedulePublished',
      'match-reminder-1day': 'matchReminder1Day',
      'match-reminder-sameday': 'matchReminderSameDay',
      'schedule-change': 'scheduleChange',
      'group-stage-results': 'groupStageResults',
      'finals-winners': 'finalsWinners',
      'post-tournament-recap': 'postTournamentRecap',
      'tournament-feedback': 'tournamentFeedback',
      'tournament-cancelled': 'tournamentCancelled',
      'guest-tournament-registration': 'guestRegistration',
      'guest-tournament-verification': 'guestVerification',
      'guest-tournament-registration-confirmed': 'guestRegistrationConfirmed',
      'welcome': 'welcomeEmail',
      'password-reset': 'passwordReset',
      'password-changed': 'passwordChanged',
      'new-device-login': 'newDeviceLogin',
      'change-email-old': 'changeEmailOld',
      'change-email-new': 'changeEmailNew',
      'account-deletion-confirm': 'accountDeletionConfirm',
      'account-deleted': 'accountDeleted',
      'staff-access-granted': 'staffAccessGranted',
      'role-change': 'roleChangeNotification',
    };
    return keyMap[templateId] || templateId.replace(/-/g, '');
  };

  // Helper function to get localized template name
  const getTemplateName = (templateId: string): string => {
    const key = templateIdToKey(templateId);
    const translationKey = `emailTemplates.templateNames.${key}`;
    const localized = t(translationKey as any);
    return localized !== translationKey ? localized : EMAIL_TEMPLATES.find(t => t.id === templateId)?.name || templateId;
  };
  
  // Helper function to get localized template description
  const getTemplateDescription = (templateId: string): string => {
    const key = templateIdToKey(templateId);
    const translationKey = `emailTemplates.templateDescriptions.${key}`;
    const localized = t(translationKey as any);
    return localized !== translationKey ? localized : EMAIL_TEMPLATES.find(t => t.id === templateId)?.description || '';
  };
  
  // Helper function to get localized category name
  const getCategoryName = (categoryId: string): string => {
    const keyMap: Record<string, string> = {
      'partners': 'emailTemplates.categoryPartners',
      'clients': 'emailTemplates.categoryClients',
      'coaches': 'emailTemplates.categoryCoaches',
      'staff': 'emailTemplates.categoryStaff',
    };
    return t(keyMap[categoryId] as any);
  };
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
  const [savingTemplate, setSavingTemplate] = useState(false);
  
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [tournamentScope, setTournamentScope] = useState<'all' | 'specific'>('specific');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersData, setSelectedUsersData] = useState<Record<string, { id: string; firstName: string; lastName: string; email: string; preferredLanguage: string }>>({});
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [useUserLanguage, setUseUserLanguage] = useState(false);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'compose' | 'sent' | 'incoming'>('compose');
  
  // Sent emails state
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [loadingSentEmails, setLoadingSentEmails] = useState(false);
  const [selectedSentEmail, setSelectedSentEmail] = useState<any | null>(null);
  const [sentEmailDetails, setSentEmailDetails] = useState<any | null>(null);
  const [loadingEmailDetails, setLoadingEmailDetails] = useState(false);
  const [resendEmailModal, setResendEmailModal] = useState(false);
  const [resendToEmail, setResendToEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  
  // Incoming emails state
  const [incomingEmails, setIncomingEmails] = useState<any[]>([]);
  const [loadingIncomingEmails, setLoadingIncomingEmails] = useState(false);
  const [selectedIncomingEmail, setSelectedIncomingEmail] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    recipientName: '',
    company: '',
    locale: 'en',
    phone: '+34 662 423 738',
    contactEmail: 'partner@padelO2.com',
    newRole: 'staff',
    oldRole: '',
    adminPanelUrl: '',
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

    // Check authorization via partner-emails endpoint (it has the proper permission check)
    fetch('/api/admin/partner-emails/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partnerName: '',
        partnerCompany: '',
        templateId: 'sponsorship-proposal',
      }),
    })
      .then((res) => {
        if (res.ok) {
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

  // Fetch sent emails
  const fetchSentEmails = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setLoadingSentEmails(true);
    try {
      const response = await fetch('/api/admin/partner-emails/sent?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSentEmails(data.emails || []);
      } else {
        setError('Failed to fetch sent emails');
      }
    } catch (error) {
      console.error('Error fetching sent emails:', error);
      setError('Failed to fetch sent emails');
    } finally {
      setLoadingSentEmails(false);
    }
  };

  // Fetch email details
  const fetchEmailDetails = async (emailId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setLoadingEmailDetails(true);
    try {
      const response = await fetch(`/api/admin/partner-emails/sent/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSentEmailDetails(data.email);
      } else {
        setError('Failed to fetch email details');
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
      setError('Failed to fetch email details');
    } finally {
      setLoadingEmailDetails(false);
    }
  };

  // Fetch incoming emails
  const fetchIncomingEmails = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setLoadingIncomingEmails(true);
    try {
      const response = await fetch('/api/admin/partner-emails/incoming?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncomingEmails(data.emails || []);
      } else {
        setError('Failed to fetch incoming emails');
      }
    } catch (error) {
      console.error('Error fetching incoming emails:', error);
      setError('Failed to fetch incoming emails');
    } finally {
      setLoadingIncomingEmails(false);
    }
  };

  // Load emails when tab changes
  useEffect(() => {
    if (!authorized) return;
    
    if (activeTab === 'sent') {
      fetchSentEmails();
    } else if (activeTab === 'incoming') {
      fetchIncomingEmails();
    }
  }, [activeTab, authorized]);

  // Copy email HTML to clipboard
  const copyEmailToClipboard = async (html: string) => {
    try {
      await navigator.clipboard.writeText(html);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy email');
    }
  };

  // Resend email to new recipient
  const handleResendEmail = async () => {
    if (!resendToEmail || !sentEmailDetails) return;

    setResendingEmail(true);
    setError(null);
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Not authenticated');
      setResendingEmail(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/partner-emails/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailId: sentEmailDetails.id,
          to: resendToEmail,
          html: sentEmailDetails.html,
          subject: sentEmailDetails.subject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend email');
      }

      setSuccess(true);
      setResendEmailModal(false);
      setResendToEmail('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend email');
    } finally {
      setResendingEmail(false);
    }
  };

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
    if ((selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') && selectedUserIds.length === 0 && !formData.email) {
      setError(t('emailTemplates.errorSelectUserOrEmail'));
      return;
    }
    if ((selectedCategory === 'partners' || (selectedCategory === 'clients' && tournamentScope === 'specific')) && !selectedTournamentId) {
      setError(t('emailTemplates.errorSelectTournament'));
      return;
    }

    try {
      // First, try to load saved template from database
      let savedHtml: string | null = null;
      try {
        const loadResponse = await fetch(`/api/admin/email-templates/load?templateId=${selectedTemplate}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (loadResponse.ok) {
          const loadData = await loadResponse.json();
          if (loadData.htmlContent) {
            savedHtml = loadData.htmlContent;
          } else if (loadData.html) {
            // Fallback for old API response format
            savedHtml = loadData.html;
          }
        }
      } catch (loadError) {
        console.log('No saved template found, will generate new one');
      }

      // If we have a saved template, use it but replace dynamic data from form
      if (savedHtml) {
        // Import the replacer function
        const { replaceTemplateDataAggressive } = await import('@/lib/template-data-replacer');
        // Replace dynamic data even if form fields are empty (to clear old values)
        savedHtml = replaceTemplateDataAggressive(
          savedHtml,
          formData.recipientName || '',
          formData.company || ''
        );
        setPreviewHtml(savedHtml);
        setEditableHtml(savedHtml);
        setShowPreview(true);
        return;
      }

      // Otherwise, generate new template with form data
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
          category: selectedCategory,
          tournamentId: (selectedCategory === 'partners' || selectedCategory === 'clients') && tournamentScope === 'specific' ? selectedTournamentId : null,
          tournamentScope: tournamentScope,
          userIds: (selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') ? selectedUserIds : undefined,
          newRole: selectedCategory === 'staff' && selectedTemplate === 'role-change' ? formData.newRole : undefined,
          oldRole: selectedCategory === 'staff' && selectedTemplate === 'role-change' ? formData.oldRole : undefined,
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

  const handleSaveTemplate = async () => {
    if (!editableHtml.trim()) {
      setError('No HTML content to save');
      return;
    }

    setSavingTemplate(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Not authenticated');
      setSavingTemplate(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/email-templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          html: editableHtml,
          templateType: 'custom',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('emailTemplates.templateSaveError'));
      }

      setSuccess(true);
      setError(null);
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('[Save Template] Error:', err);
      setError(err.message || t('emailTemplates.templateSaveError'));
      setSuccess(false);
    } finally {
      setSavingTemplate(false);
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
    if ((selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') && selectedUserIds.length === 0 && !formData.email) {
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
          tournamentId: (selectedCategory === 'partners' || selectedCategory === 'clients') && tournamentScope === 'specific' ? selectedTournamentId : null,
          tournamentScope: tournamentScope,
          userIds: (selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') ? selectedUserIds : undefined,
          newRole: selectedCategory === 'staff' && selectedTemplate === 'role-change' ? formData.newRole : undefined,
          oldRole: selectedCategory === 'staff' && selectedTemplate === 'role-change' ? formData.oldRole : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('emailTemplates.errorSendEmail'));
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
        newRole: 'staff',
        oldRole: '',
        adminPanelUrl: '',
      });
      setSelectedUserIds([]);
      setSelectedTournamentId('');
    } catch (err: any) {
      setError(err.message || t('emailTemplates.errorSendEmail'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">{t('emailTemplates.checkingAccess')}</p>
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text mb-2">
            {t('emailTemplates.pageTitle')}
          </h1>
          <p className="text-text-secondary">
            {t('emailTemplates.pageDescription')}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'compose'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              {t('emailTemplates.tabCompose')}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'sent'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              {t('emailTemplates.tabSent')} ({sentEmails.length})
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'incoming'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              {t('emailTemplates.tabIncoming')} ({incomingEmails.length})
            </button>
          </div>
        </div>

        {/* Sent Emails Tab */}
        {activeTab === 'sent' && (
          <div className="bg-background-secondary rounded-2xl shadow-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">{t('emailTemplates.sentEmailsTitle')}</h2>
              <button
                onClick={fetchSentEmails}
                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
              >
                {t('emailTemplates.refresh')}
              </button>
            </div>

            {loadingSentEmails ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-text-secondary">{t('emailTemplates.loading')}</p>
              </div>
            ) : sentEmails.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p>{t('emailTemplates.noSentEmails')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {sentEmails.map((email: any) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedSentEmail(email);
                      fetchEmailDetails(email.id);
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSentEmail?.id === email.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-background-hover'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-text mb-1">{email.subject || t('emailTemplates.noSubject')}</div>
                        <div className="text-sm text-text-secondary">
                          <div>{t('emailTemplates.toLabel')} {Array.isArray(email.to) ? email.to.join(', ') : email.to}</div>
                          <div>{t('emailTemplates.fromLabel')} {email.from}</div>
                          {email.created_at && (
                            <div>{t('emailTemplates.dateLabel')} {new Date(email.created_at).toLocaleString(locale)}</div>
                          )}
                        </div>
                      </div>
                      {email.created_at && (
                        <div className="text-xs text-text-tertiary ml-4">
                          {new Date(email.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Email Details Modal */}
            {selectedSentEmail && sentEmailDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-background-secondary rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-text">{t('emailTemplates.emailDetails')}</h2>
                    <button
                      onClick={() => {
                        setSelectedSentEmail(null);
                        setSentEmailDetails(null);
                      }}
                      className="text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6">
                    {loadingEmailDetails ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 space-y-2">
                          <div><strong>{t('emailTemplates.subjectLabel')}</strong> {sentEmailDetails.subject || t('emailTemplates.noSubject')}</div>
                          <div><strong>{t('emailTemplates.fromLabel')}</strong> {sentEmailDetails.from}</div>
                          <div><strong>{t('emailTemplates.toLabel')}</strong> {Array.isArray(sentEmailDetails.to) ? sentEmailDetails.to.join(', ') : sentEmailDetails.to}</div>
                          {sentEmailDetails.created_at && (
                            <div><strong>{t('emailTemplates.dateLabel')}</strong> {new Date(sentEmailDetails.created_at).toLocaleString(locale)}</div>
                          )}
                        </div>

                        <div className="mb-4 border-t border-border pt-4">
                          <div className="flex gap-2 mb-4">
                            <button
                              onClick={() => copyEmailToClipboard(sentEmailDetails.html || '')}
                              className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                            >
                              {t('emailTemplates.copyHtml')}
                            </button>
                            <button
                              onClick={() => {
                                setResendEmailModal(true);
                                setResendToEmail('');
                              }}
                              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                              {t('emailTemplates.resendToNewRecipient')}
                            </button>
                          </div>
                        </div>

                        <div className="border border-border rounded-lg p-4 bg-background">
                          <div 
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: sentEmailDetails.html || '' }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Resend Email Modal */}
            {resendEmailModal && sentEmailDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                <div className="bg-background-secondary rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-text mb-4">{t('emailTemplates.resendEmailModalTitle')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">
                        {t('emailTemplates.recipientEmailLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={resendToEmail}
                        onChange={(e) => setResendToEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="partner@example.com"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setResendEmailModal(false);
                          setResendToEmail('');
                        }}
                        className="flex-1 py-3 px-6 bg-background-hover text-text font-semibold rounded-xl hover:bg-background transition-colors"
                      >
                        {t('emailTemplates.cancel')}
                      </button>
                      <button
                        onClick={handleResendEmail}
                        disabled={!resendToEmail || resendingEmail}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {resendingEmail ? t('emailTemplates.sending') : t('emailTemplates.sendEmail')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Incoming Emails Tab */}
        {activeTab === 'incoming' && (
          <div className="bg-background-secondary rounded-2xl shadow-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">{t('emailTemplates.incomingEmailsTitle')}</h2>
              <button
                onClick={fetchIncomingEmails}
                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
              >
                {t('emailTemplates.refresh')}
              </button>
            </div>

            {loadingIncomingEmails ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-text-secondary">{t('emailTemplates.loading')}</p>
              </div>
            ) : incomingEmails.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p>{t('emailTemplates.noIncomingEmails')}</p>
                <p className="text-sm mt-2">{t('emailTemplates.incomingEmailsHint')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {incomingEmails.map((email: any) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedIncomingEmail(email)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedIncomingEmail?.id === email.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-background-hover'
                    } ${!email.readAt ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-text mb-1 flex items-center gap-2">
                          {email.subject || t('emailTemplates.noSubject')}
                          {!email.readAt && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">{t('emailTemplates.newBadge')}</span>}
                        </div>
                        <div className="text-sm text-text-secondary">
                          <div>{t('emailTemplates.fromLabel')} {email.from}</div>
                          <div>{t('emailTemplates.toLabel')} {email.to}</div>
                          {email.receivedAt && (
                            <div>{t('emailTemplates.dateLabel')} {new Date(email.receivedAt).toLocaleString(locale)}</div>
                          )}
                        </div>
                      </div>
                      {email.receivedAt && (
                        <div className="text-xs text-text-tertiary ml-4">
                          {new Date(email.receivedAt).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Incoming Email Details Modal */}
            {selectedIncomingEmail && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-background-secondary rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-text">{t('emailTemplates.incomingEmailTitle')}</h2>
                    <button
                      onClick={() => setSelectedIncomingEmail(null)}
                      className="text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6">
                    <div className="mb-4 space-y-2">
                      <div><strong>{t('emailTemplates.subjectLabel')}</strong> {selectedIncomingEmail.subject || t('emailTemplates.noSubject')}</div>
                      <div><strong>{t('emailTemplates.fromLabel')}</strong> {selectedIncomingEmail.from}</div>
                      <div><strong>{t('emailTemplates.toLabel')}</strong> {selectedIncomingEmail.to}</div>
                      {selectedIncomingEmail.receivedAt && (
                        <div><strong>{t('emailTemplates.dateLabel')}</strong> {new Date(selectedIncomingEmail.receivedAt).toLocaleString(locale)}</div>
                      )}
                    </div>

                    <div className="border border-border rounded-lg p-4 bg-background">
                      {selectedIncomingEmail.html ? (
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedIncomingEmail.html }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-text">{selectedIncomingEmail.text || t('emailTemplates.noContent')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compose Tab (existing form) */}
        {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-background-secondary rounded-2xl shadow-xl p-6 border border-border">
              <h2 className="text-xl font-bold text-text mb-4">{t('emailTemplates.categories')}</h2>
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
                          ? 'bg-primary/20 border-primary text-primary'
                          : category.color === 'green'
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : category.color === 'purple'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-background-secondary border-border text-text-secondary hover:bg-background-hover font-normal'
                    }`}
                  >
                    <span className="text-2xl mr-2">{category.icon}</span>
                    {getCategoryName(category.id)}
                  </button>
                ))}
              </div>

              {/* Templates List */}
              {filteredTemplates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">{t('emailTemplates.templates')}</h3>
                  <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                          selectedTemplate === template.id
                            ? 'bg-primary/20 border-2 border-primary text-primary font-semibold'
                            : 'bg-background-secondary border border-border text-text-secondary hover:bg-background-hover'
                        }`}
                      >
                        {getTemplateName(template.id)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-background-secondary rounded-2xl shadow-xl p-6 md:p-8 border border-border">
              {selectedTemplateData && (
                <div className="mb-6 pb-6 border-b border-border">
                  <h2 className="text-2xl font-bold text-text mb-2">
                    {getTemplateName(selectedTemplateData.id)}
                  </h2>
                  <p className="text-text-secondary">{getTemplateDescription(selectedTemplateData.id)}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tournament Selection (for Partners and Clients) */}
                {(selectedCategory === 'partners' || selectedCategory === 'clients') && (
                  <>
                    {selectedCategory === 'clients' && (
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                          {t('emailTemplates.tournamentScope')}
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
                            {t('emailTemplates.specificTournament')}
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="all"
                              checked={tournamentScope === 'all'}
                              onChange={(e) => setTournamentScope(e.target.value as 'all' | 'specific')}
                              className="mr-2"
                            />
                            {t('emailTemplates.allTournaments')}
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {tournamentScope === 'specific' && (
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                          {t('emailTemplates.tournament')} <span className="text-red-500">*</span>
                        </label>
                        <select
                          required={tournamentScope === 'specific'}
                          value={selectedTournamentId}
                          onChange={(e) => setSelectedTournamentId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        >
                          <option value="">{t('emailTemplates.selectTournament')}</option>
                          {tournaments.map((tournament) => (
                            <option key={tournament.id} value={tournament.id}>
                              {tournament.name} ({tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : t('emailTemplates.tbd')})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* User Selection (for Clients, Coaches, Staff) */}
                {(selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('emailTemplates.recipients')} <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowUserSelector(true)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border hover:border-primary transition-all text-left bg-background text-text"
                      >
                        {selectedUserIds.length > 0 
                          ? t('emailTemplates.usersSelected', { count: selectedUserIds.length })
                          : t('emailTemplates.clickToSelectUsers')}
                      </button>
                      {selectedUserIds.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-semibold text-text-secondary mb-2">
                            {t('emailTemplates.selectedUsers')} ({selectedUserIds.length}):
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedUserIds.map((userId) => {
                              const user = selectedUsersData[userId];
                              const userName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : userId;
                              return (
                                <div
                                  key={userId}
                                  className="flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-lg px-3 py-1.5 text-sm"
                                >
                                  <span className="text-text">{userName}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSelectedIds = selectedUserIds.filter(id => id !== userId);
                                      setSelectedUserIds(newSelectedIds);
                                      setSelectedUsersData(prev => {
                                        const newUsersData = { ...prev };
                                        delete newUsersData[userId];
                                        return newUsersData;
                                      });
                                      // Если остался один пользователь, обновляем имя
                                      if (newSelectedIds.length === 1 && (selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff')) {
                                        const remainingUser = Object.values(selectedUsersData).find(u => u.id === newSelectedIds[0]);
                                        if (remainingUser) {
                                          setUseUserLanguage(true);
                                          setFormData(prev => ({
                                            ...prev,
                                            recipientName: `${remainingUser.firstName} ${remainingUser.lastName}`.trim() || remainingUser.email,
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
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-0.5 transition-colors"
                                    title="Remove user"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recipient Email (for Partners only) */}
                {selectedCategory === 'partners' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('emailTemplates.recipientEmail')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder={t('emailTemplates.recipientEmailPlaceholder')}
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {t('emailTemplates.multipleEmailsHint')}
                    </p>
                  </div>
                )}

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('emailTemplates.recipientName')}
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder={t('emailTemplates.recipientNamePlaceholder')}
                  />
                </div>

                {/* Company - только для Partners */}
                {selectedCategory === 'partners' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('emailTemplates.companyName')}
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder={t('emailTemplates.companyNamePlaceholder')}
                    />
                  </div>
                )}

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('emailTemplates.language')} <span className="text-text-tertiary text-xs">{t('emailTemplates.languagesAvailable')}</span>
                  </label>
                  <select
                    value={useUserLanguage && (selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') && selectedUserIds.length > 0 
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  >
                    {(selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') && selectedUserIds.length > 0 && (
                      <option value="user">
                        🌐 {t('emailTemplates.userLanguage')} ({selectedUsersData[selectedUserIds[0]]?.preferredLanguage || 'en'})
                      </option>
                    )}
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  {(selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff') && selectedUserIds.length > 0 && useUserLanguage && (
                    <p className="mt-2 text-sm text-text-secondary">
                      {t('emailTemplates.usingUserLanguage')} <strong>{selectedUsersData[selectedUserIds[0]]?.preferredLanguage || 'en'}</strong>
                    </p>
                  )}
                </div>

                {/* Staff-specific fields */}
                {selectedCategory === 'staff' && selectedTemplate === 'role-change' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('emailTemplates.newRole')}
                      </label>
                      <select
                        value={formData.newRole}
                        onChange={(e) => setFormData({ ...formData, newRole: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      >
                        <option value="superadmin">Super Administrator</option>
                        <option value="tournament_admin">Tournament Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="coach">Coach</option>
                        <option value="staff">Staff</option>
                        <option value="participant">Participant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('emailTemplates.previousRole')}
                      </label>
                      <input
                        type="text"
                        value={formData.oldRole}
                        onChange={(e) => setFormData({ ...formData, oldRole: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder={t('emailTemplates.previousRolePlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Contact Info - только для Partners */}
                {selectedCategory === 'partners' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('emailTemplates.contactPhone')}
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder={t('emailTemplates.contactPhonePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('emailTemplates.contactEmail')}
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder={t('emailTemplates.contactEmailPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-500/20 border-2 border-green-500/50 rounded-xl">
                    <p className="text-green-400 font-semibold">
                      ✅ {t('emailTemplates.successEmailSent')}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl">
                    <p className="text-red-400 font-semibold">
                      ❌ {error}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={generatePreviewHtml}
                    disabled={loading || ((selectedCategory === 'partners' || selectedCategory === 'coaches' || selectedCategory === 'staff') && !formData.email && selectedUserIds.length === 0)}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    👁️ {t('emailTemplates.preview')}
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
                        {t('emailTemplates.submitting')}
                      </span>
                    ) : (
                      `🚀 ${t('emailTemplates.sendEmail')}`
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-primary/20 border-2 border-primary/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-text mb-2">ℹ️ {t('emailTemplates.aboutTemplates')}</h3>
              <p className="text-text-secondary text-sm mb-2">
                {t('emailTemplates.templatesAutoTranslated')}
              </p>
              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                <li>{t('emailTemplates.allLanguagesSupported')}</li>
                <li>{t('emailTemplates.translationAutomatic')}</li>
                <li>{t('emailTemplates.brandedFooter')}</li>
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-text">{t('emailTemplates.selectUsers')}</h2>
              <button
                onClick={() => {
                  setShowUserSelector(false);
                  setUserSearchQuery('');
                }}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
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
                placeholder={t('emailTemplates.searchUsersPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none mb-4"
              />

              <div className="flex-1 overflow-y-auto">
                {searchingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-text-secondary">{t('emailTemplates.searching')}</p>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    {userSearchQuery.trim() ? t('emailTemplates.noUsersFound') : t('emailTemplates.startTyping')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-all bg-background"
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
                                  id: user.id,
                                  firstName: user.firstName || '',
                                  lastName: user.lastName || '',
                                  email: user.email || '',
                                  preferredLanguage: user.preferredLanguage || 'en',
                                },
                              }));
                              // Если выбран только один пользователь, заполняем имя автоматически
                              if (newSelectedIds.length === 1 && (selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff')) {
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
                              if (newSelectedIds.length === 1 && (selectedCategory === 'clients' || selectedCategory === 'coaches' || selectedCategory === 'staff')) {
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
                          className="mr-3 w-5 h-5 text-primary"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-text">{user.fullName}</div>
                          <div className="text-sm text-text-secondary">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedUserIds.length > 0 && (
                <div className="mt-4 p-3 bg-primary/20 rounded-lg">
                  <p className="text-sm text-text-secondary">
                    {t('emailTemplates.usersSelected', { count: selectedUserIds.length })}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-4">
              <button
                onClick={() => {
                  setShowUserSelector(false);
                  setUserSearchQuery('');
                }}
                className="flex-1 py-3 px-6 bg-background-hover text-text font-semibold rounded-xl hover:bg-background transition-colors"
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
                {t('emailTemplates.done')} ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-secondary rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-text">📧 Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* HTML Editor */}
              <div className="w-1/2 border-r border-border flex flex-col">
                <div className="p-4 bg-background-secondary border-b border-border">
                  <h3 className="font-semibold text-text">HTML Editor</h3>
                  <p className="text-xs text-text-secondary">Edit the email HTML directly</p>
                </div>
                <textarea
                  value={editableHtml}
                  onChange={(e) => setEditableHtml(e.target.value)}
                  className="flex-1 p-4 font-mono text-sm border-0 resize-none focus:outline-none bg-background text-text"
                  spellCheck={false}
                />
              </div>

              {/* Preview */}
              <div className="w-1/2 flex flex-col overflow-hidden">
                <div className="p-4 bg-background-secondary border-b border-border">
                  <h3 className="font-semibold text-text">Preview</h3>
                  <p className="text-xs text-text-secondary">How the email will look</p>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-background">
                  <div 
                    className="bg-background-secondary rounded-lg shadow-lg p-4 mx-auto max-w-2xl text-text"
                    dangerouslySetInnerHTML={{ __html: editableHtml }}
                  />
                </div>
              </div>
            </div>

            {/* Success/Error Messages in Modal */}
            {success && (
              <div className="px-6 pt-4">
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <p className="text-green-800 font-semibold">
                    ✅ Template saved successfully!
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="px-6 pt-4">
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-red-800 font-semibold">
                    ❌ {error}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex gap-4">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setError(null);
                  setSuccess(false);
                }}
                className="flex-1 py-3 px-6 bg-background-secondary text-text font-semibold rounded-xl hover:bg-background-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !editableHtml.trim()}
                className="py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {savingTemplate ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('emailTemplates.saving')}
                  </span>
                ) : (
                  `💾 ${t('emailTemplates.saveTemplate')}`
                )}
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

