'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips?: string[];
}

export default function AdminDashboardOnboarding() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [dismissedSections, setDismissedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user has dismissed onboarding
    const dismissed = localStorage.getItem('adminOnboardingDismissed');
    if (dismissed === 'true') {
      setShowOnboarding(false);
    }
    
    // Load dismissed sections
    const dismissedSectionsStr = localStorage.getItem('adminOnboardingDismissedSections');
    if (dismissedSectionsStr) {
      setDismissedSections(new Set(JSON.parse(dismissedSectionsStr)));
    }
  }, []);

  const slides: OnboardingSlide[] = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title') || 'Welcome to Admin Panel',
      description: t('onboarding.welcome.description') || 'This is your admin dashboard. Here you can manage tournaments, users, and all system settings.',
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tips: [
        t('onboarding.welcome.tip1') || 'Use the sidebar to navigate between sections',
        t('onboarding.welcome.tip2') || 'Each section has specific permissions',
        t('onboarding.welcome.tip3') || 'You can collapse the sidebar for more space',
      ],
    },
    {
      id: 'navigation',
      title: t('onboarding.navigation.title') || 'Navigation',
      description: t('onboarding.navigation.description') || 'The sidebar contains all main sections. Click on any item to navigate.',
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      tips: [
        t('onboarding.navigation.tip1') || 'Dashboard - Overview and quick access',
        t('onboarding.navigation.tip2') || 'Users - Manage user accounts',
        t('onboarding.navigation.tip3') || 'Tournaments - Create and manage tournaments',
        t('onboarding.navigation.tip4') || 'Staff - Assign access to team members',
      ],
    },
    {
      id: 'permissions',
      title: t('onboarding.permissions.title') || 'Permissions',
      description: t('onboarding.permissions.description') || 'Your access level determines what you can do. Super Admins have full access.',
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      tips: [
        t('onboarding.permissions.tip1') || 'Check your permissions in Staff section',
        t('onboarding.permissions.tip2') || 'Contact Super Admin to request additional access',
      ],
    },
  ];

  const handleDismiss = () => {
    localStorage.setItem('adminOnboardingDismissed', 'true');
    setShowOnboarding(false);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (!showOnboarding) {
    return null;
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                {currentSlideData.icon}
              </div>
              <div>
                <h2 className="text-2xl font-poppins font-bold text-text">
                  {currentSlideData.title}
                </h2>
                <p className="text-sm text-text-tertiary font-poppins">
                  {currentSlide + 1} / {slides.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-text-tertiary hover:text-text transition-colors"
              title={t('onboarding.close') || 'Close'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mb-8">
            <p className="text-text-secondary font-poppins text-lg mb-6">
              {currentSlideData.description}
            </p>

            {currentSlideData.tips && currentSlideData.tips.length > 0 && (
              <div className="bg-background rounded-lg border border-border p-6">
                <h3 className="text-lg font-poppins font-semibold text-text mb-4">
                  {t('onboarding.tips') || 'Tips:'}
                </h3>
                <ul className="space-y-3">
                  {currentSlideData.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-text-secondary font-poppins">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-gradient-primary'
                      : index < currentSlide
                      ? 'bg-primary/50'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="px-6 py-3 bg-background border border-border rounded-lg font-poppins font-semibold text-text hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('onboarding.previous') || 'Previous'}
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="px-6 py-3 bg-background border border-border rounded-lg font-poppins font-semibold text-text hover:bg-background-hover transition-colors"
              >
                {t('onboarding.skip') || 'Skip'}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-primary text-background rounded-lg font-poppins font-semibold hover:opacity-90 transition-opacity"
              >
                {currentSlide === slides.length - 1
                  ? (t('onboarding.getStarted') || 'Get Started')
                  : (t('onboarding.next') || 'Next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

