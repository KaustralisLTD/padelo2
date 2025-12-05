'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Term {
  id: number;
  type: 'terms_of_service' | 'privacy_policy' | 'cookie_policy' | 'other';
  title: string;
  content: string;
  version?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function TermsSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [formData, setFormData] = useState({
    type: 'terms_of_service' as 'terms_of_service' | 'privacy_policy' | 'cookie_policy' | 'other',
    title: '',
    content: '',
    version: '',
    isActive: true,
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

    fetchTerms();
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

  const fetchTerms = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/terms', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTerms(data.terms || []);
      } else {
        setError('Failed to load terms');
      }
    } catch (err) {
      setError('Failed to load terms');
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
      const response = await fetch('/api/admin/terms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Term created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchTerms();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create term');
      }
    } catch (err) {
      setError('Failed to create term');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !editingTerm) return;

    try {
      const response = await fetch(`/api/admin/terms/${editingTerm.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Term updated successfully');
        setShowCreateModal(false);
        setEditingTerm(null);
        resetForm();
        fetchTerms();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update term');
      }
    } catch (err) {
      setError('Failed to update term');
    }
  };

  const handleDelete = async (termId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this term?')) return;

    try {
      const response = await fetch(`/api/admin/terms/${termId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Term deleted successfully');
        fetchTerms();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete term');
      }
    } catch (err) {
      setError('Failed to delete term');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'terms_of_service',
      title: '',
      content: '',
      version: '',
      isActive: true,
    });
    setEditingTerm(null);
  };

  const openEditModal = (term: Term) => {
    setEditingTerm(term);
    setFormData({
      type: term.type,
      title: term.title,
      content: term.content,
      version: term.version || '',
      isActive: term.is_active,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTerm(null);
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
          {t('settings.companyAdmin.terms.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.companyAdmin.terms.description')}
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

      {/* Terms List */}
      {isSuperAdmin && (
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-poppins font-semibold text-text">
            Terms & Policies ({terms.length})
          </h2>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Add Document
          </button>
        </div>
      )}

      {terms.length === 0 ? (
        <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary font-poppins">No terms found. {isSuperAdmin && 'Add your first document.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terms.map((term) => (
            <div
              key={term.id}
              className="bg-background-secondary rounded-lg border border-border p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                    {term.title}
                  </h3>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold bg-blue-500/20 text-blue-400 capitalize">
                    {term.type.replace('_', ' ')}
                  </span>
                  {term.version && (
                    <span className="ml-2 text-xs text-text-tertiary font-poppins">
                      v{term.version}
                    </span>
                  )}
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(term)}
                      className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(term.id)}
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
              <p className="text-text-secondary font-poppins text-sm line-clamp-3 mb-4">
                {term.content}
              </p>
              <div className="flex items-center justify-between">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold ${
                  term.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {term.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-text-tertiary font-poppins">
                  {new Date(term.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-2xl font-poppins font-bold gradient-text">
                {editingTerm ? 'Edit Document' : 'Add Document'}
              </h3>
            </div>
            <form onSubmit={editingTerm ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="terms_of_service">Terms of Service</option>
                  <option value="privacy_policy">Privacy Policy</option>
                  <option value="cookie_policy">Cookie Policy</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 1.0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
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
                  {editingTerm ? 'Update' : 'Create'}
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

