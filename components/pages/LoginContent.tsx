'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginContent() {
  const t = useTranslations('Login');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Обработка OAuth callback
  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;
    
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const oauth = searchParams.get('oauth');

    if (errorParam) {
      setError(t(`errors.${errorParam}`) || t('errors.oauthFailed'));
      return;
    }

    if (token && success === 'true') {
      // Сохраняем токен в localStorage
      localStorage.setItem('auth_token', token);
      
      // Также проверяем cookie (на случай если установлен)
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      if (cookieToken && cookieToken !== token) {
        // Если cookie отличается, обновляем его
        const isProduction = process.env.NODE_ENV === 'production';
        document.cookie = `auth_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${isProduction ? '; Secure' : ''}`;
      }
      
      // Dispatch custom event to notify Header about auth change
      window.dispatchEvent(new Event('auth-changed'));
      
      // Для OAuth входа сразу перенаправляем на dashboard
      if (oauth === 'true') {
        // Небольшая задержка для гарантии сохранения токена
        setTimeout(() => {
          router.replace(`/${locale}/dashboard`);
        }, 50);
      } else {
        // Для обычного входа через форму
        setTimeout(() => {
          router.replace(`/${locale}/dashboard`);
        }, 100);
      }
    }
  }, [searchParams, router, locale, t]);

  const handleOAuthLogin = (provider: 'google' | 'apple') => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isLogin) {
        // Login logic
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
          localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_role', data.user?.role || 'participant');
          // Dispatch custom event to notify Header about auth change
          window.dispatchEvent(new Event('auth-changed'));
          router.push(`/${locale}/dashboard`);
        } else {
          setError(t('errors.invalidCredentials'));
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Login error:', errorData);
          if (errorData.emailNotVerified) {
            setEmailNotVerified(true);
            setError(t(errorData.errorKey || 'errors.emailNotVerified'));
          } else {
            setEmailNotVerified(false);
            // Используем локализованный ключ ошибки, если он есть
            const errorMessage = errorData.errorKey ? t(errorData.errorKey) : (errorData.message || errorData.error || t('errors.invalidCredentials'));
            setError(errorMessage);
            // Показываем кнопку Forgot password для всех ошибок пароля
            if (errorData.errorType === 'invalidPassword' || errorData.errorType === 'userNotFound') {
              setShowForgotPassword(true);
            } else {
              setShowForgotPassword(false);
            }
          }
        }
      } else {
        // Register logic
        if (formData.password !== formData.confirmPassword) {
          setError(t('errors.passwordMismatch'));
          setIsSubmitting(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept-Language': locale,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            locale: locale,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Show success message instead of redirecting
          setSuccessMessage(t('registrationSuccess') || 'Registration successful! Please check your email to verify your account.');
          setShowVerificationMessage(true);
          setError(null);
          // Reset form
          setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            confirmPassword: '',
          });
          // Switch to login mode
          setIsLogin(true);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
          if (errorData.error === 'emailAlreadyExists') {
            setError(t('errors.emailAlreadyExists') || 'User with this email already exists');
          } else {
            setError(errorData.error || t('errors.registrationFailed'));
          }
        }
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
          {isLogin ? t('loginTitle') : t('registerTitle')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins text-center mb-8">
          {isLogin ? t('loginDescription') : t('registerDescription')}
        </p>

        {showVerificationMessage && successMessage && (
          <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 mb-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-text font-poppins text-center font-semibold text-lg">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-5 mb-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-text font-poppins font-semibold mb-2">{error}</p>
                {emailNotVerified && (
                  <p className="text-text-secondary font-poppins text-sm">
                    {t('errors.emailNotVerifiedDetails') || 'Please check your email inbox and click the verification link to activate your account.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-background-secondary p-8 rounded-lg border border-border">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-poppins font-semibold transition-colors ${
                isLogin
                  ? 'bg-gradient-primary text-background'
                  : 'bg-background text-text-secondary hover:text-primary border border-border'
              }`}
            >
              {t('login')}
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccessMessage(null);
                setShowVerificationMessage(false);
                setEmailNotVerified(false);
                setShowForgotPassword(false);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-poppins font-semibold transition-colors ${
                !isLogin
                  ? 'bg-gradient-primary text-background'
                  : 'bg-background text-text-secondary hover:text-primary border border-border'
              }`}
            >
              {t('register')}
            </button>
          </div>

          {/* OAuth Buttons */}
          <div className="mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background-secondary text-text-secondary">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border rounded-lg text-text hover:bg-background-hover transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-poppins text-sm">{t('continueWithGoogle')}</span>
              </button>
              {/* Apple OAuth временно отключен - ожидаем данные от Apple Developer Center */}
              {/* <button
                type="button"
                onClick={() => handleOAuthLogin('apple')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border rounded-lg text-text hover:bg-background-hover transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span className="font-poppins text-sm">{t('continueWithApple')}</span>
              </button> */}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('firstName')} *
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('lastName')} *
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('email')} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('password')} *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('confirmPassword')} *
                </label>
                <input
                  type="password"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins">
                {error}
                {showForgotPassword && isLogin && (
                  <div className="mt-3 pt-3 border-t border-red-500/30">
                    <Link 
                      href={`/${locale}/forgot-password`}
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-2"
                    >
                      <span>{t('forgotPassword') || 'Forgot password?'}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
            >
              {isSubmitting ? t('submitting') : isLogin ? t('loginButton') : t('registerButton')}
            </button>

            <p className="text-xs text-text-tertiary text-center mt-4 font-poppins">
              {t('termsAgreement')}{' '}
              <Link href={`/${locale}/terms`} className="text-primary hover:underline">
                {t('termsOfService')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


