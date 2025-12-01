'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordContent() {
  const t = useTranslations('ResetPassword');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError(t('errors.noToken'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      setIsSubmitting(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError(t('errors.passwordTooShort'));
      setIsSubmitting(false);
      return;
    }

    if (!token) {
      setError(t('errors.noToken'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({ 
          token,
          newPassword: formData.newPassword 
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setError(null);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reset password' }));
        setError(errorData.error || t('errors.failed'));
      }
    } catch (err) {
      setError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-md mx-auto text-center">
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        <p className="text-text-secondary font-poppins text-center mb-8">
          {t('description')}
        </p>

        {success ? (
          <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-text font-poppins font-semibold mb-2">{t('success.title')}</p>
                <p className="text-text-secondary font-poppins text-sm">
                  {t('success.message')}
                </p>
                <p className="text-text-secondary font-poppins text-xs mt-2">
                  {t('success.redirect')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-5 mb-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-text font-poppins font-semibold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-background-secondary p-8 rounded-lg border border-border">
              <div className="mb-6">
                <label htmlFor="newPassword" className="block text-text font-poppins font-semibold mb-2">
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('newPasswordPlaceholder')}
                />
                <p className="text-text-secondary font-poppins text-sm mt-2">
                  {t('passwordHint')}
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-text font-poppins font-semibold mb-2">
                  {t('confirmPassword')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('confirmPasswordPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gradient-primary text-background rounded-lg font-poppins font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-6">
          <Link 
            href={`/${locale}/login`}
            className="text-primary font-poppins font-semibold hover:opacity-80 transition-opacity"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

