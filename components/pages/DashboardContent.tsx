'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardContent() {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Get token from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || localStorage.getItem('tournament_token');
    
    if (token) {
      localStorage.setItem('tournament_token', token);
      fetchRegistration(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRegistration = async (token: string) => {
    try {
      const response = await fetch(`/api/tournament/register?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        if (data.registration) {
          setRegistration(data.registration);
        } else {
          setLoading(false);
          return;
        }
      } else {
        // Token might be invalid or expired
        localStorage.removeItem('tournament_token');
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      telegram: registration.telegram || '',
      tshirtSize: registration.tshirtSize || '',
      message: registration.message || '',
      categories: [...(registration.categories || [])],
      partner: registration.partner ? { ...registration.partner } : null,
      categoryPartners: registration.categoryPartners ? { ...registration.categoryPartners } : {},
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const token = localStorage.getItem('tournament_token');
      if (!token) {
        setSaveStatus('error');
        return;
      }

      const response = await fetch(`/api/tournament/register?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setRegistration(data.registration);
        setSaveStatus('success');
        setIsEditing(false);
        // Refresh registration data
        setTimeout(() => {
          fetchRegistration(token);
        }, 500);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
    setSaveStatus('idle');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-text-secondary font-poppins mb-6">{t('dashboard.noRegistration')}</p>
        <Link
          href={`/${locale}/tournaments`}
          className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block"
        >
          {t('dashboard.registerNow')}
        </Link>
      </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-poppins font-bold gradient-text">
            {t('dashboard.title')}
          </h1>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('dashboard.editButton')}
            </button>
          )}
        </div>

        {saveStatus === 'success' && (
          <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-poppins mb-6">
            {t('dashboard.registrationUpdated')}
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins mb-6">
            {t('dashboard.registrationUpdateError')}
          </div>
        )}

        {isEditing ? (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-6 text-text">
              {t('dashboard.editRegistration')}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.firstName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.lastName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.phone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.telegram')}
                </label>
                <input
                  type="text"
                  value={editData.telegram}
                  onChange={(e) => setEditData({ ...editData, telegram: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.tshirtSize')}
                </label>
                <select
                  value={editData.tshirtSize}
                  onChange={(e) => setEditData({ ...editData, tshirtSize: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">{t('form.selectSize')}</option>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.message')}
                </label>
                <textarea
                  rows={4}
                  value={editData.message}
                  onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {editData.partner && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-orbitron font-semibold mb-4 text-text">
                    {t('dashboard.partnerInfo')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.partnerName')}
                      </label>
                      <input
                        type="text"
                        value={editData.partner.name || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          partner: { ...editData.partner, name: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.partnerEmail')}
                      </label>
                      <input
                        type="email"
                        value={editData.partner.email || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          partner: { ...editData.partner, email: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.partnerPhone')}
                      </label>
                      <input
                        type="tel"
                        value={editData.partner.phone || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          partner: { ...editData.partner, phone: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.partnerTshirtSize')}
                      </label>
                      <select
                        value={editData.partner.tshirtSize || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          partner: { ...editData.partner, tshirtSize: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="">{t('form.selectSize')}</option>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? t('form.submitting') : t('dashboard.saveChanges')}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-background-secondary border border-gray-700 text-text font-orbitron font-semibold rounded-lg hover:bg-background transition-colors disabled:opacity-50"
                >
                  {t('dashboard.cancelEdit')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Registration Info */}
              <div className="bg-background-secondary p-6 rounded-lg border border-gray-800">
                <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
                  {t('dashboard.registrationInfo')}
                </h2>
                <div className="space-y-2 text-text-secondary font-poppins">
                  <p><strong className="text-text">{t('form.firstName')}:</strong> {registration.firstName}</p>
                  <p><strong className="text-text">{t('form.lastName')}:</strong> {registration.lastName}</p>
                  <p><strong className="text-text">{t('form.email')}:</strong> {registration.email}</p>
                  <p><strong className="text-text">{t('form.phone')}:</strong> {registration.phone}</p>
                  {registration.telegram && (
                    <p><strong className="text-text">{t('form.telegram')}:</strong> {registration.telegram}</p>
                  )}
                </div>
              </div>

              {/* Tournament Info */}
              <div className="bg-background-secondary p-6 rounded-lg border border-gray-800">
                <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
                  {t('dashboard.tournamentInfo')}
                </h2>
                <div className="space-y-2 text-text-secondary font-poppins">
                  <p><strong className="text-text">{t('dashboard.tournament')}:</strong> {registration.tournamentName}</p>
                  <p><strong className="text-text">{t('form.categories')}:</strong> {
                    registration.categories.map((cat: string) => t(`categories.${cat}`)).join(', ')
                  }</p>
                  <p><strong className="text-text">{t('form.tshirtSize')}:</strong> {registration.tshirtSize}</p>
                  <p><strong className="text-text">{t('dashboard.status')}:</strong> {
                    registration.confirmed ? (
                      <span className="text-green-400">{t('dashboard.confirmed')}</span>
                    ) : (
                      <span className="text-yellow-400">{t('dashboard.pending')}</span>
                    )
                  }</p>
                </div>
              </div>
            </div>

            {/* Partner Info */}
            {registration.partner && (
              <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
                <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
                  {t('dashboard.partnerInfo')}
                </h2>
                <div className="space-y-2 text-text-secondary font-poppins">
                  <p><strong className="text-text">{t('form.partnerName')}:</strong> {registration.partner.name}</p>
                  <p><strong className="text-text">{t('form.partnerEmail')}:</strong> {registration.partner.email}</p>
                  <p><strong className="text-text">{t('form.partnerPhone')}:</strong> {registration.partner.phone}</p>
                  <p><strong className="text-text">{t('form.partnerTshirtSize')}:</strong> {registration.partner.tshirtSize}</p>
                  {registration.partner.photoName && (
                    <p><strong className="text-text">{t('form.partnerPhoto')}:</strong> {registration.partner.photoName}</p>
                  )}
                  {registration.partner.photoData && (
                    <div className="mt-4">
                      <Image
                        src={registration.partner.photoData}
                        alt={registration.partner.name}
                        width={220}
                        height={220}
                        className="rounded-lg border border-gray-700 object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photo Upload */}
            <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
              <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
                {t('dashboard.photoUpload')}
              </h2>
              <p className="text-text-secondary font-poppins text-sm mb-4">
                {t('dashboard.photoInstructions')}
              </p>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer inline-block px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('dashboard.uploadPhoto')}
                </label>
                <p className="text-text-secondary font-poppins text-xs mt-2">
                  {t('form.photoInstructions.filenameExample')}
                </p>
              </div>
            </div>

            {/* Message */}
            {registration.message && (
              <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
                <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
                  {t('form.message')}
                </h2>
                <p className="text-text-secondary font-poppins">{registration.message}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
