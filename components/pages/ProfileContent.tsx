'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  telegram?: string;
  dateOfBirth?: string;
  tshirtSize?: string;
  photoName?: string;
  photoData?: string;
}

export default function ProfileContent() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    telegram: '',
    dateOfBirth: '',
    tshirtSize: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Размеры футболок с измерениями (ANCHO - ширина, LARGO - длина)
  const tshirtSizesData: Record<string, { ancho: number; largo: number }> = {
    'S': { ancho: 48, largo: 67 },
    'M': { ancho: 51, largo: 69 },
    'L': { ancho: 54, largo: 71 },
    'XL': { ancho: 57, largo: 73 },
    '2XL': { ancho: 60, largo: 75 },
  };
  const tshirtSizes = Object.keys(tshirtSizesData);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Load profile
    fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            firstName: data.profile.firstName || '',
            lastName: data.profile.lastName || '',
            phone: data.profile.phone || '',
            telegram: data.profile.telegram || '',
            dateOfBirth: data.profile.dateOfBirth || '',
            tshirtSize: data.profile.tshirtSize || '',
          });
          if (data.profile.photoData) {
            setPhotoPreview(data.profile.photoData);
          }
        } else {
          router.push(`/${locale}/login`);
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      })
      .finally(() => setLoading(false));
  }, [locale, router]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('photoSizeError'));
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    try {
      let photoData = profile?.photoData || null;
      let photoName = profile?.photoName || null;

      if (photoFile) {
        const reader = new FileReader();
        photoData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
        photoName = photoFile.name;
      }

      console.log('Sending profile update request...');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          photoData,
          photoName,
        }),
      });

      console.log('Profile update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile updated successfully:', data);
        setProfile(data.profile);
        setSubmitStatus('success');
        setTimeout(() => setSubmitStatus('idle'), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update failed:', response.status, errorData);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem('auth_token');
        router.push(`/${locale}/login`);
      } else {
        // Even if logout fails, clear local storage and redirect
        localStorage.removeItem('auth_token');
        router.push(`/${locale}/login`);
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('auth_token');
      router.push(`/${locale}/login`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Action buttons at the top */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Link
            href={`/${locale}/dashboard`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {t('backToDashboard')}
          </Link>
          
          <div className="flex gap-3">
            <Link
              href={`/${locale}/participant-dashboard`}
              className="px-4 py-2 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('goToParticipantDashboard')}
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 font-poppins font-semibold rounded-lg hover:bg-red-500/30 transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins mb-12">
          {t('description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <label className="block text-sm font-poppins text-text-secondary mb-4">
              {t('photo')}
            </label>
            <div className="flex items-center space-x-6">
              {photoPreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={photoPreview}
                    alt={t('photo')}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <span className="text-text-tertiary text-sm">{t('noPhoto')}</span>
                </div>
              )}
              <div>
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <span className="inline-block px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity">
                    {photoFile ? photoFile.name : t('chooseFile') || 'Choose File'}
                  </span>
                </label>
                {photoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(profile?.photoData || null);
                      const input = document.getElementById('profile-photo-upload') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="ml-2 text-xs text-text-secondary hover:text-primary"
                  >
                    {t('removeFile') || 'Remove'}
                  </button>
                )}
                <p className="text-xs text-text-tertiary mt-2">{t('photoHint')}</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h2 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('basicInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-secondary font-poppins cursor-not-allowed opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('role')}
                </label>
                <input
                  type="text"
                  value={t(`roles.${profile.role}`)}
                  disabled
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-secondary font-poppins cursor-not-allowed opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('firstName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('lastName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h2 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('contactInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('telegram')}
                </label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <h2 className="text-xl font-poppins font-bold mb-4 text-text">
              {t('additionalInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('tshirtSize')}
                </label>
                <select
                  value={formData.tshirtSize}
                  onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">{t('selectSize')}</option>
                  {tshirtSizes.map((size) => {
                    const measurements = tshirtSizesData[size];
                    return (
                    <option key={size} value={size}>
                        {size} ({t('tshirtWidth')}: {measurements.ancho}cm, {t('tshirtLength')}: {measurements.largo}cm)
                    </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-poppins font-bold text-text">
                {t('changePassword') || 'Change Password'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  if (showChangePassword) {
                    setPasswordData({ newPassword: '', confirmPassword: '' });
                    setPasswordStatus('idle');
                    setPasswordError(null);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }
                }}
                className="px-4 py-2 bg-primary/20 text-primary font-poppins font-semibold rounded-lg hover:bg-primary/30 transition-colors"
              >
                {showChangePassword ? (t('cancel') || 'Cancel') : (t('changePassword') || 'Change Password')}
              </button>
            </div>
            {showChangePassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('newPassword') || 'New Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-colors"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">{t('passwordMinLength') || 'Password must be at least 8 characters long'}</p>
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('confirmPassword') || 'Confirm New Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm font-poppins">{passwordError}</p>
                  </div>
                )}
                {passwordStatus === 'success' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-poppins">{t('passwordChangedSuccess') || 'Password changed successfully!'}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!passwordData.newPassword || !passwordData.confirmPassword) {
                      setPasswordError(t('fillAllFields') || 'Please fill all fields');
                      return;
                    }
                    if (passwordData.newPassword.length < 8) {
                      setPasswordError(t('passwordMinLength') || 'Password must be at least 8 characters long');
                      return;
                    }
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      setPasswordError(t('passwordsDoNotMatch') || 'Passwords do not match');
                      return;
                    }

                    const token = localStorage.getItem('auth_token');
                    if (!token) {
                      router.push(`/${locale}/login`);
                      return;
                    }

                    try {
                      const response = await fetch('/api/user/change-password', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          newPassword: passwordData.newPassword,
                        }),
                      });

                      const data = await response.json();

                      if (response.ok) {
                        setPasswordStatus('success');
                        setPasswordError(null);
                        setPasswordData({ newPassword: '', confirmPassword: '' });
                        setTimeout(() => {
                          setShowChangePassword(false);
                          setPasswordStatus('idle');
                        }, 2000);
                      } else {
                        setPasswordStatus('error');
                        setPasswordError(data.error || t('passwordChangeError') || 'Failed to change password');
                      }
                    } catch (error) {
                      setPasswordStatus('error');
                      setPasswordError(t('passwordChangeError') || 'Failed to change password');
                    }
                  }}
                  className="px-6 py-2 bg-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('savePassword') || 'Save New Password'}
                </button>
              </div>
            )}
          </div>

          {/* Change Email */}
          <div className="bg-background-secondary p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-poppins font-bold text-text">
                {t('changeEmail') || 'Change Email'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowChangeEmail(!showChangeEmail);
                  if (showChangeEmail) {
                    setEmailData({ newEmail: '', password: '' });
                    setEmailStatus('idle');
                    setEmailError(null);
                  }
                }}
                className="px-4 py-2 bg-primary/20 text-primary font-poppins font-semibold rounded-lg hover:bg-primary/30 transition-colors"
              >
                {showChangeEmail ? (t('cancel') || 'Cancel') : (t('changeEmail') || 'Change Email')}
              </button>
            </div>
            {showChangeEmail && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('newEmail') || 'New Email Address'} *
                  </label>
                  <input
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('currentPassword') || 'Current Password'} *
                  </label>
                  <input
                    type="password"
                    value={emailData.password}
                    onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-text-tertiary mt-1">{t('emailChangeNote') || 'You will receive confirmation emails at both addresses'}</p>
                </div>
                {emailError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm font-poppins">{emailError}</p>
                  </div>
                )}
                {emailStatus === 'success' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-poppins">{t('emailChangeRequestSent') || 'Email change request sent. Please check both email addresses for confirmation.'}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!emailData.newEmail || !emailData.password) {
                      setEmailError(t('fillAllFields') || 'Please fill all fields');
                      return;
                    }

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailData.newEmail)) {
                      setEmailError(t('invalidEmail') || 'Invalid email format');
                      return;
                    }

                    if (emailData.newEmail === profile?.email) {
                      setEmailError(t('sameEmail') || 'New email must be different from current email');
                      return;
                    }

                    const token = localStorage.getItem('auth_token');
                    if (!token) {
                      router.push(`/${locale}/login`);
                      return;
                    }

                    try {
                      const response = await fetch('/api/user/change-email', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          newEmail: emailData.newEmail,
                          password: emailData.password,
                        }),
                      });

                      const data = await response.json();

                      if (response.ok) {
                        setEmailStatus('success');
                        setEmailError(null);
                        setEmailData({ newEmail: '', password: '' });
                        setTimeout(() => {
                          setShowChangeEmail(false);
                          setEmailStatus('idle');
                        }, 3000);
                      } else {
                        setEmailStatus('error');
                        setEmailError(data.error || t('emailChangeError') || 'Failed to request email change');
                      }
                    } catch (error) {
                      setEmailStatus('error');
                      setEmailError(t('emailChangeError') || 'Failed to request email change');
                    }
                  }}
                  className="px-6 py-2 bg-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('requestEmailChange') || 'Request Email Change'}
                </button>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-text font-poppins font-semibold">{t('updateSuccess')}</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-text font-poppins font-semibold">{t('updateError')}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/${locale}/dashboard`}
              className="px-8 py-3 border-2 border-border text-text-secondary font-orbitron font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

