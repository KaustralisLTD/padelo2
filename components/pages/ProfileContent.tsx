'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
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

  const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
        alert(t('photoSizeError'));
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
                  <img
                    src={photoPreview}
                    alt={t('photo')}
                    className="w-full h-full object-cover"
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
                  {tshirtSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm font-poppins">
              {t('updateSuccess')}
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins">
              {t('updateError')}
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

