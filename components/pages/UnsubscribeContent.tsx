'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribeContent() {
  const t = useTranslations('Unsubscribe');
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailInput, setEmailInput] = useState(email || '');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setMessage(t('emailRequired') || 'Email is required');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(t('successMessage') || 'You have been successfully unsubscribed from our email list.');
      } else {
        setStatus('error');
        setMessage(data.error || t('errorMessage') || 'An error occurred. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(t('errorMessage') || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('title') || 'Unsubscribe from Emails'}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('description') || 'We\'re sorry to see you go. You can unsubscribe from our email list at any time.'}
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('successTitle') || 'Successfully Unsubscribed'}
              </h2>
              <p className="text-gray-600 mb-8">
                {message || t('successMessage') || 'You have been successfully unsubscribed from our email list.'}
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                {t('backToHome') || 'Back to Home'}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('emailLabel') || 'Email Address'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder={t('emailPlaceholder') || 'your@email.com'}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl ${
                  status === 'error' 
                    ? 'bg-red-50 border-2 border-red-200 text-red-800' 
                    : 'bg-blue-50 border-2 border-blue-200 text-blue-800'
                }`}>
                  <p className="font-semibold">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('processing') || 'Processing...'}
                  </span>
                ) : (
                  t('unsubscribeButton') || 'Unsubscribe'
                )}
              </button>

              <div className="text-center pt-4">
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  {t('backToHome') || 'Back to Home'}
                </Link>
              </div>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {t('note') || 'If you change your mind, you can always resubscribe by contacting us or updating your preferences in your account settings.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

