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
  {
    id: 'sponsorship-proposal',
    name: 'Sponsorship Proposal',
    description: 'UA PADEL OPEN sponsorship proposal for partners',
    category: 'partners',
  },
  // Можно добавить больше шаблонов позже
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
      router.push(`/${locale}/login`);
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
          router.push(`/${locale}/login`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        
        if (data.session && data.session.role === 'superadmin') {
          setAuthorized(true);
        } else {
          router.push(`/${locale}/dashboard`);
        }
      })
      .catch((error) => {
        console.error('Error verifying session:', error);
        router.push(`/${locale}/login`);
      })
      .finally(() => setCheckingAuth(false));
  }, [locale, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccess(true);
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
                {/* Recipient Email */}
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

                {/* Company */}
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

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Language <span className="text-gray-500 text-xs">(14 languages available)</span>
                  </label>
                  <select
                    value={formData.locale}
                    onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || translating}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
    </div>
  );
}

