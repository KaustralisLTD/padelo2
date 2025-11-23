'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import {
  TournamentRegistrationSettings,
  getDefaultRegistrationSettings,
  normalizeRegistrationSettings,
} from '@/lib/registration-settings';
import { compressImageToSize } from '@/lib/image-compression';
import { getLocalizedCategoryName } from '@/lib/localization-utils';

export default function DashboardContent() {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leavingTournament, setLeavingTournament] = useState(false);
  const [registrationSettings, setRegistrationSettings] = useState<TournamentRegistrationSettings>(
    () => getDefaultRegistrationSettings()
  );
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({});
  const [kidsCategoryEnabled, setKidsCategoryEnabled] = useState(false);
  const [expandedCategoryPartners, setExpandedCategoryPartners] = useState<Record<string, boolean>>({});
  const [childData, setChildData] = useState<{ firstName: string; lastName: string; photoData: string | null; photoName: string | null } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [tournamentStartDate, setTournamentStartDate] = useState<string | null>(null);
  const [editCategoryPartners, setEditCategoryPartners] = useState<Record<string, any>>({});

  useEffect(() => {
    // Get token from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Try to fetch all registrations for the logged-in user
    fetchAllRegistrations();
    
    // If token is provided, fetch that specific registration
    if (token) {
      localStorage.setItem('tournament_token', token);
      fetchRegistration(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllRegistrations = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/tournament-registrations', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.registrations && data.registrations.length > 0) {
          setRegistrations(data.registrations);
          // If no token in URL, select the first registration
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');
          if (!token && data.registrations.length > 0) {
            // Fetch the first registration by token
            fetchRegistration(data.registrations[0].token);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setLoading(false);
    }
  };

  const fetchRegistration = async (token: string) => {
    try {
      const response = await fetch(`/api/tournament/register?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        if (data.registration) {
          setSelectedRegistration(data.registration);
          
          // Загружаем настройки турнира
          if (data.registration.tournamentId) {
            try {
              const tournamentResponse = await fetch(`/api/tournament/${data.registration.tournamentId}`);
              if (tournamentResponse.ok) {
                const tournamentData = await tournamentResponse.json();
                if (tournamentData.tournament) {
                  setTournamentStartDate(tournamentData.tournament.startDate);
                  const settings = tournamentData.tournament.registrationSettings;
                  setRegistrationSettings(normalizeRegistrationSettings(settings));
                  setCustomCategories(tournamentData.tournament.customCategories || {});
                  setKidsCategoryEnabled(tournamentData.tournament.kidsCategoryEnabled || false);
                  
                  // Загружаем данные ребенка, если есть
                  if (data.registration.childData) {
                    setChildData(data.registration.childData);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching tournament settings:', error);
            }
          }
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

  const handleSelectRegistration = (token: string) => {
    localStorage.setItem('tournament_token', token);
    fetchRegistration(token);
    setIsEditing(false);
    setEditData(null);
  };

  const handleEdit = () => {
    if (!selectedRegistration) return;
    const categoryPartners = selectedRegistration.categoryPartners || {};
    // Конвертируем name в firstName/lastName для каждого партнера
    const convertedPartners: Record<string, any> = {};
    Object.entries(categoryPartners).forEach(([category, partner]: [string, any]) => {
      if (partner && partner.name && !partner.firstName) {
        // Разделяем name на firstName и lastName
        const nameParts = partner.name.trim().split(/\s+/);
        convertedPartners[category] = {
          ...partner,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
        };
      } else {
        convertedPartners[category] = partner;
      }
    });
    setEditCategoryPartners(convertedPartners);
    // Разворачиваем блоки партнеров для mixed категорий
    const expanded: Record<string, boolean> = {};
    (selectedRegistration.categories || []).forEach((cat: string) => {
      if (cat.startsWith('mixed') && categoryPartners[cat]) {
        expanded[cat] = true;
      }
    });
    setExpandedCategoryPartners(expanded);
    
    // Конвертируем name в firstName/lastName для основного партнера
    const partnerForEdit = selectedRegistration.partner
      ? {
          ...selectedRegistration.partner,
          firstName: selectedRegistration.partner.firstName || selectedRegistration.partner.name?.split(' ')[0] || '',
          lastName: selectedRegistration.partner.lastName || selectedRegistration.partner.name?.split(' ').slice(1).join(' ') || '',
        }
      : null;

    setEditData({
      firstName: selectedRegistration.firstName,
      lastName: selectedRegistration.lastName,
      email: selectedRegistration.email,
      phone: selectedRegistration.phone,
      telegram: selectedRegistration.telegram || '',
      tshirtSize: selectedRegistration.tshirtSize || '',
      message: selectedRegistration.message || '',
      categories: [...(selectedRegistration.categories || [])],
      partner: partnerForEdit,
      categoryPartners: categoryPartners,
      childData: selectedRegistration.childData ? { ...selectedRegistration.childData } : null,
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

      // Конвертируем firstName/lastName в name для основного партнера
      const partnerToSave = editData.partner
        ? {
            ...editData.partner,
            name: `${editData.partner.firstName || ''} ${editData.partner.lastName || ''}`.trim(),
          }
        : null;

      // Конвертируем firstName/lastName в name для каждого партнера категории
      const convertedCategoryPartners: Record<string, any> = {};
      Object.entries(editCategoryPartners).forEach(([category, partner]: [string, any]) => {
        if (partner) {
          const name = partner.firstName 
            ? `${partner.firstName}${partner.lastName ? ' ' + partner.lastName : ''}`.trim()
            : partner.name || '';
          convertedCategoryPartners[category] = {
            ...partner,
            name: name || undefined,
          };
        }
      });

      const dataToSend = {
        ...editData,
        partner: partnerToSave,
        categoryPartners: convertedCategoryPartners,
        childData: childData,
      };
      
      const response = await fetch(`/api/tournament/register?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRegistration(data.registration);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }

    // Check original size (before compression) - allow up to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setPhotoError(t('form.photoSizeError') || 'Photo size must be less than 20MB');
      return;
    }

    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      // Compress image before converting to base64
      const compressedBase64 = await compressImageToSize(file, 500); // Max 500KB
          const fileName = `${selectedRegistration.firstName}_${selectedRegistration.lastName}.${file.name.split('.').pop()}`;

          const token = localStorage.getItem('tournament_token');
          if (!token) {
            setPhotoError('Token not found');
            setUploadingPhoto(false);
            return;
          }

          const response = await fetch(`/api/tournament/register?token=${token}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userPhoto: {
                name: fileName,
            data: compressedBase64,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setSelectedRegistration(data.registration);
            // Refresh registration data
            setTimeout(() => {
              fetchRegistration(token);
            }, 500);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to upload photo' }));
            setPhotoError(errorData.error || 'Failed to upload photo');
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
      setPhotoError('Failed to upload photo. Please try another file.');
        } finally {
          setUploadingPhoto(false);
          // Reset input
      e.target.value = '';
    }
  };

  const handleLeaveTournament = () => {
    if (!selectedRegistration) return;
    setShowLeaveModal(true);
  };

  const confirmLeaveTournament = async () => {
    if (!selectedRegistration) return;
    
    try {
      setLeavingTournament(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('No auth token');
      }

      const response = await fetch(`/api/tournament/${selectedRegistration.tournamentId}/registrations/${selectedRegistration.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        // Успешно покинули турнир
        setSelectedRegistration(null);
        setRegistrations(registrations.filter(r => r.id !== selectedRegistration.id));
        setShowLeaveModal(false);
        // Перенаправляем на страницу турниров или dashboard
        window.location.href = `/${locale}/tournaments`;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to leave tournament' }));
        setError(errorData.error || t('dashboard.leaveTournamentError') || 'Failed to leave tournament');
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
      setError(t('dashboard.leaveTournamentError') || 'Failed to leave tournament');
    } finally {
      setLeavingTournament(false);
    }
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

  if (!selectedRegistration && !loading) {
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

  if (!selectedRegistration) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Tournament Selection - если несколько турниров */}
        {registrations.length > 1 && (
          <div className="mb-6">
            <h2 className="text-lg font-orbitron font-semibold text-text mb-4">
              {t('dashboard.selectTournament') || 'Select Tournament'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrations.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => handleSelectRegistration(reg.token)}
                  className={`p-4 rounded-lg border transition-colors text-left ${
                    selectedRegistration?.token === reg.token
                      ? 'bg-primary/20 border-primary'
                      : 'bg-background-secondary border-border hover:border-primary'
                  }`}
                >
                  <div className="font-poppins font-semibold text-text mb-1">
                    {reg.tournamentName}
                  </div>
                  <div className="text-sm text-text-secondary font-poppins">
                    {reg.tournamentStartDate
                      ? new Date(reg.tournamentStartDate).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </div>
                  <div className="text-xs text-text-secondary font-poppins mt-1">
                    {reg.confirmed
                      ? t('dashboard.confirmed')
                      : t('dashboard.pending')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-poppins font-bold gradient-text">
              {t('dashboard.title')}
            </h1>
            {!isEditing && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('dashboard.editButton')}
                </button>
              </div>
            )}
          </div>

        {saveStatus === 'success' && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm font-poppins mb-6">
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

              {/* Categories Selection */}
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.categories')} *
                </label>
                
                {/* Row 1: Male 1 and Male 2 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {['male1', 'male2'].map((code) => {
                    if (!customCategories[code]) return null;
                    const isSelected = editData.categories?.includes(code);
                    return (
                      <label
                        key={code}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-700 bg-background hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...(editData.categories || []), code]
                              : (editData.categories || []).filter((c: string) => c !== code);
                            setEditData({ ...editData, categories: newCategories });
                          }}
                          className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        />
                        <span className={`text-sm font-poppins ${isSelected ? 'text-primary font-semibold' : 'text-text'}`}>
                          {customCategories[code]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Row 2: Female 1 and Female 2 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {['female1', 'female2'].map((code) => {
                    if (!customCategories[code]) return null;
                    const isSelected = editData.categories?.includes(code);
                    return (
                      <label
                        key={code}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-700 bg-background hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...(editData.categories || []), code]
                              : (editData.categories || []).filter((c: string) => c !== code);
                            setEditData({ ...editData, categories: newCategories });
                          }}
                          className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        />
                        <span className={`text-sm font-poppins ${isSelected ? 'text-primary font-semibold' : 'text-text'}`}>
                          {customCategories[code]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Row 3: Mixed 1 and Mixed 2 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {['mixed1', 'mixed2'].map((code) => {
                    if (!customCategories[code]) return null;
                    const isSelected = editData.categories?.includes(code);
                    const partnerRequired = registrationSettings.partner.required;
                    
                    return (
                      <label
                        key={code}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-700 bg-background hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...(editData.categories || []), code]
                              : (editData.categories || []).filter((c: string) => c !== code);
                            
                            setEditData({ ...editData, categories: newCategories });
                            
                            // Если добавляется mixed категория и партнер обязателен
                            if (e.target.checked && partnerRequired) {
                              if (!editCategoryPartners[code]) {
                                setEditCategoryPartners({
                                  ...editCategoryPartners,
                                  [code]: { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }
                                });
                              }
                              setExpandedCategoryPartners({
                                ...expandedCategoryPartners,
                                [code]: true
                              });
                            } else if (!e.target.checked) {
                              // Удаляем партнера при удалении категории
                              const newPartners = { ...editCategoryPartners };
                              delete newPartners[code];
                              setEditCategoryPartners(newPartners);
                              const newExpanded = { ...expandedCategoryPartners };
                              delete newExpanded[code];
                              setExpandedCategoryPartners(newExpanded);
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        />
                        <span className={`text-sm font-poppins ${isSelected ? 'text-primary font-semibold' : 'text-text'}`}>
                          {customCategories[code]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Row 4: KIDS */}
                {kidsCategoryEnabled && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <label
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        editData.categories?.includes('kids')
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 bg-background hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editData.categories?.includes('kids')}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...(editData.categories || []), 'kids']
                            : (editData.categories || []).filter((c: string) => c !== 'kids');
                          setEditData({ ...editData, categories: newCategories });
                          if (!e.target.checked) {
                            setChildData(null);
                          } else if (!childData) {
                            setChildData({ firstName: '', lastName: '', photoData: null, photoName: null });
                          }
                        }}
                        className="w-4 h-4 rounded border-2 border-primary/50 bg-background text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                      />
                      <span className={`text-sm font-poppins ${editData.categories?.includes('kids') ? 'text-primary font-semibold' : 'text-text'}`}>
                        {t('categories.kids') || 'KIDS'}
                      </span>
                    </label>
                  </div>
                )}
                
                <p className="text-xs text-text-secondary mt-2 font-poppins">
                  {t('form.selectMultiple')}
                </p>
              </div>

              {/* Partner for Mixed 1 */}
              {editData.categories?.includes('mixed1') && (
                <div key="mixed1" className="border border-gray-700 rounded-lg p-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setExpandedCategoryPartners({
                      ...expandedCategoryPartners,
                      'mixed1': !expandedCategoryPartners['mixed1']
                    })}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <h4 className="text-sm font-orbitron font-semibold text-text">
                      {t('form.partnerForCategory')} {getLocalizedCategoryName('mixed1', locale) || customCategories['mixed1'] || 'Mixed 1'}
                      {registrationSettings.partner.required && <span className="text-red-400 ml-1">*</span>}
                    </h4>
                    <svg
                      className={`w-5 h-5 text-text-secondary transition-transform ${expandedCategoryPartners['mixed1'] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedCategoryPartners['mixed1'] && (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-poppins text-text-secondary mb-2">
                            {t('form.firstName')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                          </label>
                          <input
                            type="text"
                            value={(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).firstName || ''}
                            onChange={(e) => setEditCategoryPartners({
                              ...editCategoryPartners,
                              'mixed1': { ...(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), firstName: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-poppins text-text-secondary mb-2">
                            {t('form.lastName')}
                          </label>
                          <input
                            type="text"
                            value={(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).lastName || ''}
                            onChange={(e) => setEditCategoryPartners({
                              ...editCategoryPartners,
                              'mixed1': { ...(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), lastName: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('form.partnerEmail')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          type="email"
                          value={(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).email || ''}
                          onChange={(e) => setEditCategoryPartners({
                            ...editCategoryPartners,
                            'mixed1': { ...(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), email: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('form.partnerPhone')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          type="tel"
                          value={(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).phone || ''}
                          onChange={(e) => setEditCategoryPartners({
                            ...editCategoryPartners,
                            'mixed1': { ...(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), phone: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('form.partnerTshirtSize')}
                        </label>
                        <select
                          value={(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).tshirtSize || ''}
                          onChange={(e) => setEditCategoryPartners({
                            ...editCategoryPartners,
                            'mixed1': { ...(editCategoryPartners['mixed1'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), tshirtSize: e.target.value }
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
                  )}
                </div>
              )}

              {/* Partner for Mixed 2 */}
              {editData.categories?.includes('mixed2') && (
                <div key="mixed2" className="border border-gray-700 rounded-lg p-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setExpandedCategoryPartners({
                      ...expandedCategoryPartners,
                      'mixed2': !expandedCategoryPartners['mixed2']
                    })}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <h4 className="text-sm font-orbitron font-semibold text-text">
                      {t('form.partnerForCategory')} {getLocalizedCategoryName('mixed2', locale) || customCategories['mixed2'] || 'Mixed 2'}
                      {registrationSettings.partner.required && <span className="text-red-400 ml-1">*</span>}
                    </h4>
                    <svg
                      className={`w-5 h-5 text-text-secondary transition-transform ${expandedCategoryPartners['mixed2'] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedCategoryPartners['mixed2'] && (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-poppins text-text-secondary mb-2">
                            {t('form.firstName')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                          </label>
                          <input
                            type="text"
                            value={(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).firstName || ''}
                            onChange={(e) => setEditCategoryPartners({
                              ...editCategoryPartners,
                              'mixed2': { ...(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), firstName: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-poppins text-text-secondary mb-2">
                            {t('form.lastName')}
                          </label>
                          <input
                            type="text"
                            value={(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).lastName || ''}
                            onChange={(e) => setEditCategoryPartners({
                              ...editCategoryPartners,
                              'mixed2': { ...(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), lastName: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('form.partnerEmail')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          type="email"
                          value={(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).email || ''}
                          onChange={(e) => setEditCategoryPartners({
                            ...editCategoryPartners,
                            'mixed2': { ...(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), email: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('form.partnerPhone')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          type="tel"
                          value={(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).phone || ''}
                          onChange={(e) => setEditCategoryPartners({
                            ...editCategoryPartners,
                            'mixed2': { ...(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), phone: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-poppins text-text-secondary mb-2">
                          {t('form.partnerTshirtSize')}
                        </label>
                        <select
                          value={(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }).tshirtSize || ''}
                          onChange={(e) => setEditCategoryPartners({
                            ...editCategoryPartners,
                            'mixed2': { ...(editCategoryPartners['mixed2'] || { firstName: '', lastName: '', email: '', phone: '', tshirtSize: '' }), tshirtSize: e.target.value }
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
                  )}
                </div>
              )}

              {/* KIDS Category - Child Data */}
              {kidsCategoryEnabled && editData.categories?.includes('kids') && (
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-orbitron font-semibold text-text mb-4">
                    {t('form.childInfo') || 'Child Information'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.childFirstName') || 'Child First Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={childData?.firstName || ''}
                        onChange={(e) => setChildData({
                          ...(childData || { firstName: '', lastName: '', photoData: null, photoName: null }),
                          firstName: e.target.value
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.childLastName') || 'Child Last Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={childData?.lastName || ''}
                        onChange={(e) => setChildData({
                          ...(childData || { firstName: '', lastName: '', photoData: null, photoName: null }),
                          lastName: e.target.value
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.childPhoto') || 'Child Photo (Optional)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              alert(t('form.error') || 'Please select an image file');
                              return;
                            }

                            // Check original size (before compression)
                            if (file.size > 20 * 1024 * 1024) {
                              alert(t('form.photoSizeError') || 'Photo size must be less than 20MB');
                              return;
                            }

                            try {
                              // Compress image before converting to base64
                              const compressedBase64 = await compressImageToSize(file, 500); // Max 500KB
                              
                              setChildData({
                                ...(childData || { firstName: '', lastName: '', photoData: null, photoName: null }),
                                photoData: compressedBase64,
                                photoName: file.name
                              });
                            } catch (error) {
                              console.error('Error compressing image:', error);
                              alert(t('form.error') || 'Error processing image. Please try another file.');
                            }
                          }
                        }}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      {childData?.photoName && (
                        <p className="text-xs text-text-tertiary mt-1">{childData.photoName}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                    {t('form.partnerInfo')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.firstName')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text"
                        required={registrationSettings.partner.required}
                        value={editData.partner.firstName || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          partner: { ...editData.partner, firstName: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.lastName')}
                      </label>
                      <input
                        type="text"
                        value={editData.partner.lastName || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          partner: { ...editData.partner, lastName: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('form.partnerEmail')} {registrationSettings.partner.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="email"
                      required={registrationSettings.partner.required}
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
              <p><strong className="text-text">{t('form.firstName')}:</strong> {selectedRegistration.firstName}</p>
              <p><strong className="text-text">{t('form.lastName')}:</strong> {selectedRegistration.lastName}</p>
              <p><strong className="text-text">{t('form.email')}:</strong> {selectedRegistration.email}</p>
              <p><strong className="text-text">{t('form.phone')}:</strong> {selectedRegistration.phone}</p>
              {selectedRegistration.telegram && (
                <p><strong className="text-text">{t('form.telegram')}:</strong> {selectedRegistration.telegram}</p>
              )}
            </div>
          </div>

          {/* Tournament Info */}
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.tournamentInfo')}
            </h2>
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('dashboard.tournament')}:</strong> {selectedRegistration.tournamentName}</p>
              <p><strong className="text-text">{t('form.categories')}:</strong> {
                selectedRegistration.categories.map((cat: string) => t(`categories.${cat}`)).join(', ')
              }</p>
              <p><strong className="text-text">{t('form.tshirtSize')}:</strong> {selectedRegistration.tshirtSize}</p>
              <p><strong className="text-text">{t('dashboard.status')}:</strong> {
                selectedRegistration.confirmed ? (
                  <span className="text-green-400">{t('dashboard.confirmed')}</span>
                ) : (
                  <span className="text-yellow-400">{t('dashboard.pending')}</span>
                )
              }</p>
            </div>
          </div>
        </div>

        {/* Partner Info */}
        {selectedRegistration.partner && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.partnerInfo')}
            </h2>
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('form.partnerName')}:</strong> {selectedRegistration.partner.name}</p>
              <p><strong className="text-text">{t('form.partnerEmail')}:</strong> {selectedRegistration.partner.email}</p>
              <p><strong className="text-text">{t('form.partnerPhone')}:</strong> {selectedRegistration.partner.phone}</p>
              <p><strong className="text-text">{t('form.partnerTshirtSize')}:</strong> {selectedRegistration.partner.tshirtSize}</p>
              {selectedRegistration.partner.photoName && (
                <p><strong className="text-text">{t('form.partnerPhoto')}:</strong> {selectedRegistration.partner.photoName}</p>
              )}
              {selectedRegistration.partner.photoData && (
                <div className="mt-4">
                  <Image
                    src={selectedRegistration.partner.photoData}
                    alt={selectedRegistration.partner.name}
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

        {/* Category Partners (for Mixed categories) */}
        {selectedRegistration.categoryPartners && Object.keys(selectedRegistration.categoryPartners).length > 0 && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('dashboard.categoryPartners') || 'Partners by Category'}
            </h2>
            {Object.entries(selectedRegistration.categoryPartners).map(([category, partner]: [string, any]) => (
              <div key={category} className="mb-6 last:mb-0 border-b border-gray-700 pb-6 last:border-b-0">
                <h3 className="text-lg font-orbitron font-semibold mb-3 text-primary">
                  {getLocalizedCategoryName(category, locale) || customCategories[category] || category}
                </h3>
                <div className="space-y-2 text-text-secondary font-poppins">
                  <p><strong className="text-text">{t('form.partnerName')}:</strong> {partner.name}</p>
                  <p><strong className="text-text">{t('form.partnerEmail')}:</strong> {partner.email}</p>
                  <p><strong className="text-text">{t('form.partnerPhone')}:</strong> {partner.phone}</p>
                  {partner.tshirtSize && (
                    <p><strong className="text-text">{t('form.partnerTshirtSize')}:</strong> {partner.tshirtSize}</p>
                  )}
                  {partner.photoName && (
                    <p><strong className="text-text">{t('form.partnerPhoto')}:</strong> {partner.photoName}</p>
                  )}
                  {partner.photoData && (
                    <div className="mt-4">
                      <Image
                        src={partner.photoData}
                        alt={partner.name}
                        width={220}
                        height={220}
                        className="rounded-lg border border-gray-700 object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Child Data (if exists) */}
        {selectedRegistration.childData && selectedRegistration.childData.firstName && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('form.childInfo') || 'Child Information'}
            </h2>
            <div className="space-y-2 text-text-secondary font-poppins">
              <p><strong className="text-text">{t('form.childFirstName')}:</strong> {selectedRegistration.childData.firstName}</p>
              <p><strong className="text-text">{t('form.childLastName')}:</strong> {selectedRegistration.childData.lastName}</p>
              {selectedRegistration.childData.photoName && (
                <p><strong className="text-text">{t('form.childPhoto')}:</strong> {selectedRegistration.childData.photoName}</p>
              )}
              {selectedRegistration.childData.photoData && (
                <div className="mt-4">
                  <Image
                    src={selectedRegistration.childData.photoData}
                    alt={`${selectedRegistration.childData.firstName} ${selectedRegistration.childData.lastName}`}
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
          
          {/* Current Photo Preview */}
          {selectedRegistration.userPhoto?.data && (
            <div className="mb-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                <Image
                  src={selectedRegistration.userPhoto.data}
                  alt="User photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photo-upload"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
            <label
              htmlFor="photo-upload"
              className={`cursor-pointer inline-block px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg transition-opacity ${
                uploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {uploadingPhoto ? (t('dashboard.uploadingPhoto') || 'Uploading...') : t('dashboard.uploadPhoto')}
            </label>
            {photoError && (
              <p className="text-red-400 font-poppins text-sm mt-2">{photoError}</p>
            )}
          </div>
        </div>

        {/* Message */}
        {selectedRegistration.message && (
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('form.message')}
            </h2>
            <p className="text-text-secondary font-poppins">{selectedRegistration.message}</p>
          </div>
        )}

        {/* Leave Tournament Button - маленькая кнопка внизу */}
        {!isEditing && (
          <div className="mt-8 pt-6 border-t border-border flex justify-end">
            <button
              onClick={handleLeaveTournament}
              disabled={leavingTournament}
              className="px-4 py-2 text-sm bg-background border border-red-500/50 text-red-400 font-poppins rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {leavingTournament ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                  {t('dashboard.leaving') || 'Leaving...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('dashboard.leaveTournament') || 'Leave Tournament'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Leave Tournament Modal */}
        {showLeaveModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-xl border border-primary/30 max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-orbitron font-bold text-center mb-4 gradient-text">
                  {t('dashboard.confirmLeaveTournament') || 'Leave Tournament?'}
                </h3>
                <p className="text-text-secondary text-center mb-2 font-poppins">
                  {t('dashboard.leaveTournamentWarning') || 'You can only leave the tournament at least 7 days before it starts. After that, leaving is not possible.'}
                </p>
                <p className="text-text font-poppins font-semibold text-center mb-6">
                  {selectedRegistration.tournamentName}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 px-6 py-3 bg-background border border-border text-text font-poppins font-semibold rounded-lg hover:bg-background-hover transition-colors"
                  >
                    {t('dashboard.leaveTournamentCancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={confirmLeaveTournament}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {t('dashboard.leaveTournamentConfirm') || 'Yes, Leave Tournament'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
        </>
      </div>
    </div>
  );
}
