'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Company {
  id: number;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  website?: string;
  created_at: string;
  updated_at?: string;
}

export default function CompanySettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    website: '',
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

    fetchCompany();
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

  const fetchCompany = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/company', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setCompany(data.company);
          setFormData({
            name: data.company.name || '',
            description: data.company.description || '',
            email: data.company.email || '',
            phone: data.company.phone || '',
            address: data.company.address || '',
            logoUrl: data.company.logo_url || '',
            website: data.company.website || '',
          });
        }
      } else {
        setError('Failed to load company info');
      }
    } catch (err) {
      setError('Failed to load company info');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) return;

    try {
      const response = await fetch('/api/admin/company', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Company information saved successfully');
        setShowEditModal(false);
        fetchCompany();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to save company info');
      }
    } catch (err) {
      setError('Failed to save company info');
    }
  };

  const openEditModal = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        logoUrl: company.logo_url || '',
        website: company.website || '',
      });
    }
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowEditModal(false);
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        logoUrl: company.logo_url || '',
        website: company.website || '',
      });
    }
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
          {t('settings.companyAdmin.company.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.companyAdmin.company.description')}
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

      {/* Company Info Display */}
      {company ? (
        <div className="bg-background-secondary rounded-lg border border-border p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-poppins font-semibold text-text mb-4">
                {company.name}
              </h2>
              {company.logo_url && (
                <div className="mb-4">
                  <img 
                    src={company.logo_url} 
                    alt="Company Logo" 
                    className="max-w-xs h-auto"
                  />
                </div>
              )}
              {company.description && (
                <p className="text-text-secondary font-poppins mb-4">
                  {company.description}
                </p>
              )}
              <div className="space-y-2">
                {company.email && (
                  <p className="text-text font-poppins">
                    <span className="font-semibold">Email:</span> {company.email}
                  </p>
                )}
                {company.phone && (
                  <p className="text-text font-poppins">
                    <span className="font-semibold">Phone:</span> {company.phone}
                  </p>
                )}
                {company.address && (
                  <p className="text-text font-poppins">
                    <span className="font-semibold">Address:</span> {company.address}
                  </p>
                )}
                {company.website && (
                  <p className="text-text font-poppins">
                    <span className="font-semibold">Website:</span>{' '}
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {company.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={openEditModal}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Edit Company Info
            </button>
          )}
        </div>
      ) : (
        <div className="bg-background-secondary rounded-lg border border-border p-8 text-center mb-4">
          <p className="text-text-secondary font-poppins mb-4">No company information set yet.</p>
          {isSuperAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Company Info
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-2xl font-poppins font-bold gradient-text">
                {company ? 'Edit Company Info' : 'Add Company Info'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Company Name *
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
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save
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

