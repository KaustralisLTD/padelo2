'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations('NotFound');
  const pathname = usePathname();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    // Collect error information
    const errorInfo = {
      url: typeof window !== 'undefined' ? window.location.href : pathname,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      pathname: pathname,
    };
    
    // Store for potential error reporting
    if (typeof window !== 'undefined') {
      (window as any).__errorInfo = errorInfo;
    }
  }, [pathname]);

  const handleSendReport = async () => {
    setReporting(true);
    try {
      const errorInfo = {
        url: typeof window !== 'undefined' ? window.location.href : pathname,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        errorMessage: errorMessage || '404 - Page not found',
        pathname: pathname,
        consoleLogs: typeof window !== 'undefined' && (window as any).console?.logs ? (window as any).console.logs.slice(-50) : [],
        networkLogs: typeof window !== 'undefined' && (window as any).__networkLogs ? (window as any).__networkLogs.slice(-20) : [],
        localStorage: typeof window !== 'undefined' ? Object.fromEntries(Object.entries(localStorage).slice(0, 20)) : {},
        sessionStorage: typeof window !== 'undefined' ? Object.fromEntries(Object.entries(sessionStorage).slice(0, 20)) : {},
        userInfo: typeof window !== 'undefined' ? {
          screen: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
        } : {},
      };

      const response = await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo),
      });

      if (response.ok) {
        setReportSent(true);
      } else {
        throw new Error('Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      alert(t('reportError') || 'Failed to send report. Please try again.');
    } finally {
      setReporting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-8">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-6xl font-orbitron font-bold mb-4 gradient-text">404</h1>
        <h2 className="text-2xl font-orbitron font-semibold mb-6 text-text">
          {t('title')}
        </h2>
        <p className="text-text-secondary font-poppins mb-8 text-lg">
          {t('description')}
        </p>
        
        {/* Quick Links */}
        <div className="bg-background-secondary rounded-lg border border-border p-8 mb-8">
          <h3 className="text-xl font-poppins font-semibold text-text mb-6">
            {t('quickLinks')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${locale}`}
              className="p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-poppins font-semibold text-text">{t('home')}</span>
              </div>
            </Link>
            <Link
              href={`/${locale}/tournaments`}
              className="p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="font-poppins font-semibold text-text">{t('tournaments')}</span>
              </div>
            </Link>
            <Link
              href={`/${locale}/academy`}
              className="p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-poppins font-semibold text-text">{t('academy')}</span>
              </div>
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-poppins font-semibold text-text">{t('contact')}</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link
            href={`/${locale}`}
            className="inline-block px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('goHome')}
          </Link>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="inline-block px-8 py-3 bg-background-secondary border border-border text-text font-poppins font-semibold rounded-lg hover:bg-background-hover transition-colors"
          >
            {t('reportError') || 'Report Error to Developer'}
          </button>
        </div>

        {/* Error Report Form */}
        {showReportForm && !reportSent && (
          <div className="bg-background-secondary rounded-lg border border-border p-8 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="text-xl font-poppins font-semibold text-text mb-4">
              {t('reportTitle') || 'Send Error Report'}
            </h3>
            <p className="text-text-secondary font-poppins mb-4 text-sm">
              {t('reportDescription') || 'Help us improve by sending information about this error. All logs and technical details will be included.'}
            </p>
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder={t('reportPlaceholder') || 'Describe what you were trying to do when this error occurred (optional)...'}
              className="w-full h-32 p-4 bg-background border border-border rounded-lg text-text font-poppins mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendReport}
                disabled={reporting}
                className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reporting ? (t('sending') || 'Sending...') : (t('sendReport') || 'Send Report')}
              </button>
              <button
                onClick={() => setShowReportForm(false)}
                className="px-6 py-3 bg-background border border-border text-text font-poppins font-semibold rounded-lg hover:bg-background-hover transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {reportSent && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-poppins font-semibold">
                {t('reportSent') || 'Thank you! Your error report has been sent to our developers.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


