'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordContent() {
  const t = useTranslations('ForgotPassword');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send reset email' }));
        setError(errorData.error || t('errors.failed'));
      }
    } catch (err) {
      setError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <label htmlFor="email" className="block text-text font-poppins font-semibold mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('emailPlaceholder')}
                />
                <p className="text-text-secondary font-poppins text-sm mt-2">
                  {t('hint')}
                </p>
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

