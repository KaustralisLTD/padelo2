'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  TournamentRegistrationSettings,
  getDefaultRegistrationSettings,
  normalizeRegistrationSettings,
} from '@/lib/registration-settings';

interface Partner {
  name: string;
  email: string;
  phone: string;
  tshirtSize: string;
  photoData?: string | null;
  photoName?: string | null;
}

interface TournamentRegistrationFormProps {
  tournamentId: number;
  tournamentName: string;
}

const TournamentRegistrationForm = ({ tournamentId, tournamentName }: TournamentRegistrationFormProps) => {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telegram: '',
    phone: '',
    categories: [] as string[],
    tshirtSize: '',
    message: '',
  });
  const [registrationSettings, setRegistrationSettings] = useState<TournamentRegistrationSettings>(
    () => getDefaultRegistrationSettings()
  );
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [partner, setPartner] = useState<Partner | null>(null);
  const [showPartner, setShowPartner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [partnerPhotoError, setPartnerPhotoError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const categoryGroups = {
    male: [
      { key: 'male1', label: t('categories.male1') },
      { key: 'male2', label: t('categories.male2') },
    ],
    female: [
      { key: 'female1', label: t('categories.female1') },
      { key: 'female2', label: t('categories.female2') },
    ],
    mixed: [
      { key: 'mixed1', label: t('categories.mixed1') },
      { key: 'mixed2', label: t('categories.mixed2') },
    ],
  };

  const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const enabledCustomFields = registrationSettings.customFields.filter((field) => field.enabled);
  const partnerRequired = registrationSettings.partner.required;
  const tshirtFieldConfig = registrationSettings.tshirtField;
  const tshirtFieldLabel = tshirtFieldConfig.label?.trim() || t('form.tshirtSize');

  // Автозаполнение формы данными пользователя, если он залогинен
  useEffect(() => {
    const loadUserProfile = async () => {
      // Проверяем наличие токена
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token || profileLoaded) {
        return;
      }

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;

          if (profile) {
            setUserId(profile.id || null);
            // Автозаполняем только пустые поля
            setFormData(prev => ({
              firstName: prev.firstName || profile.firstName || '',
              lastName: prev.lastName || profile.lastName || '',
              email: prev.email || profile.email || '',
              telegram: prev.telegram || profile.telegram || '',
              phone: prev.phone || profile.phone || '',
              tshirtSize: prev.tshirtSize || profile.tshirtSize || '',
              categories: prev.categories,
              message: prev.message,
            }));
            setProfileLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Не показываем ошибку пользователю, просто не заполняем форму
      }
    };

    loadUserProfile();
  }, [profileLoaded]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/tournament/${tournamentId}`);
        if (response.ok) {
          const data = await response.json();
          const settings = data.tournament?.registrationSettings;
          setRegistrationSettings(normalizeRegistrationSettings(settings));
        }
      } catch (error) {
        console.error('Error fetching tournament settings:', error);
        setRegistrationSettings(getDefaultRegistrationSettings());
      }
    };

    fetchSettings();
  }, [tournamentId]);

  useEffect(() => {
    if (registrationSettings.partner.required) {
      setShowPartner(true);
      setPartner((prev) => prev ?? createEmptyPartner());
    }
  }, [registrationSettings.partner.required]);

  useEffect(() => {
    if (!registrationSettings.tshirtField.enabled && formData.tshirtSize) {
      setFormData((prev) => ({ ...prev, tshirtSize: '' }));
    }
  }, [registrationSettings.tshirtField.enabled, formData.tshirtSize]);

  useEffect(() => {
    setCustomFieldValues((prev) => {
      const next = { ...prev };
      registrationSettings.customFields.forEach((field) => {
        if (!field.enabled && next[field.id] !== undefined) {
          delete next[field.id];
        }
      });
      return next;
    });
  }, [registrationSettings]);

  const handleCategoryChange = (category: string) => {
    setFormData(prev => {
      // Если категория уже выбрана, убираем её
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== category),
        };
      }

      // Определяем тип категории
      const isMale = category.startsWith('male');
      const isFemale = category.startsWith('female');
      const isMixed = category.startsWith('mixed');

      let filteredCategories = prev.categories;
      
      if (isMale) {
        // Убираем все male категории (можно выбрать только одну: male1 ИЛИ male2)
        // И убираем все female категории (можно только male + mixed, не male + female)
        filteredCategories = prev.categories.filter(c => !c.startsWith('male') && !c.startsWith('female'));
      } else if (isFemale) {
        // Убираем все female категории (можно выбрать только одну: female1 ИЛИ female2)
        // И убираем все male категории (можно только female + mixed, не female + male)
        filteredCategories = prev.categories.filter(c => !c.startsWith('female') && !c.startsWith('male'));
      } else if (isMixed) {
        // Для mixed просто добавляем, но проверяем что не выбраны одновременно male и female
        const hasMale = prev.categories.some(c => c.startsWith('male'));
        const hasFemale = prev.categories.some(c => c.startsWith('female'));
        // Убираем другие mixed категории (можно выбрать только одну: mixed1 ИЛИ mixed2)
        filteredCategories = prev.categories.filter(c => !c.startsWith('mixed'));
        
        if (hasMale && hasFemale) {
          // Если выбраны и male и female, убираем все (нельзя выбрать male + female одновременно)
          filteredCategories = [];
        }
      }

      // Добавляем новую категорию
      return {
        ...prev,
        categories: [...filteredCategories, category],
      };
    });
  };

  const createEmptyPartner = (): Partner => ({
    name: '',
    email: '',
    phone: '',
    tshirtSize: '',
    photoData: null,
    photoName: null,
  });

  const updatePartnerField = <K extends keyof Partner>(field: K, value: Partner[K]) => {
    setPartner(prev => {
      const base = prev ?? createEmptyPartner();
      return { ...base, [field]: value };
    });
  };

  const handlePartnerPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPartner(prev => {
        if (!prev) return prev;
        return { ...prev, photoData: null, photoName: null };
      });
      setPartnerPhotoError(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPartner(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          photoData: typeof reader.result === 'string' ? reader.result : null,
          photoName: file.name,
        };
      });
      setPartnerPhotoError(null);
    };

    reader.onerror = () => {
      setPartnerPhotoError(t('form.error'));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (formData.categories.length === 0) {
      alert(t('validation.selectCategory'));
      return;
    }

    if (tshirtFieldConfig.enabled && tshirtFieldConfig.required && !formData.tshirtSize) {
      alert(t('form.selectSize'));
      return;
    }

    for (const field of enabledCustomFields) {
      if (field.required && !(customFieldValues[field.id]?.trim())) {
        alert(t('form.error'));
        return;
      }
    }

    const partnerSectionVisible = partnerRequired || showPartner;

    if (partnerSectionVisible && partner) {
      if (!partner.tshirtSize) {
        alert(t('form.partnerSelectSize'));
        return;
      }
    } else if (partnerSectionVisible && !partner) {
      alert(t('form.error'));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const enabledCustomFieldsPayload = enabledCustomFields.map((field) => ({
      id: field.id,
      label: field.label,
      value: customFieldValues[field.id] || '',
    }));

    const partnerPayload =
      partnerSectionVisible && partner
        ? {
            ...partner,
            photoData: partner.photoData || null,
            photoName: partner.photoName || null,
          }
        : null;

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/tournament/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tournamentId,
          tournamentName,
          locale,
          userId,
          ...formData,
          tshirtSize: tshirtFieldConfig.enabled ? formData.tshirtSize : '',
          customFields: enabledCustomFieldsPayload,
          partner: partnerPayload,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitStatus('success');
        // Store token in localStorage for dashboard access
        localStorage.setItem('tournament_token', data.token);
        // Redirect to confirmation page
        setTimeout(() => {
          window.location.href = `/${locale}/tournament/confirmation?token=${data.token}`;
        }, 1000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            {t('form.firstName')} *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            {t('form.lastName')} *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.email')} *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Telegram */}
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.telegram')} ({t('form.optional')})
        </label>
        <input
          type="text"
          value={formData.telegram}
          onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
          placeholder="@username"
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.phone')} *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.categories')} * ({t('form.selectMultiple')})
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Male Categories - Left Column */}
          <div className="space-y-2">
            <p className="text-sm font-orbitron font-semibold text-text mb-3">
              {t('categories.male1').replace(/\s+\d+$/, '')}
            </p>
            {categoryGroups.male.map((category) => (
              <label
                key={category.key}
                className={`flex items-center space-x-2 p-3 bg-background-secondary border rounded-lg cursor-pointer transition-colors ${
                  formData.categories.includes(category.key)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 hover:border-primary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category.key)}
                  onChange={() => handleCategoryChange(category.key)}
                  className="w-4 h-4 text-primary bg-background border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-text font-poppins text-sm">{category.label}</span>
              </label>
            ))}
          </div>

          {/* Female Categories - Right Column */}
          <div className="space-y-2">
            <p className="text-sm font-orbitron font-semibold text-text mb-3">
              {t('categories.female1').replace(/\s+\d+$/, '')}
            </p>
            {categoryGroups.female.map((category) => (
              <label
                key={category.key}
                className={`flex items-center space-x-2 p-3 bg-background-secondary border rounded-lg cursor-pointer transition-colors ${
                  formData.categories.includes(category.key)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 hover:border-primary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category.key)}
                  onChange={() => handleCategoryChange(category.key)}
                  className="w-4 h-4 text-primary bg-background border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-text font-poppins text-sm">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mixed Categories - Below */}
        <div className="mt-4">
          <p className="text-sm font-orbitron font-semibold text-text mb-3">
            {t('categories.mixed1').replace(/\s+\d+$/, '')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {categoryGroups.mixed.map((category) => (
              <label
                key={category.key}
                className={`flex items-center space-x-2 p-3 bg-background-secondary border rounded-lg cursor-pointer transition-colors ${
                  formData.categories.includes(category.key)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 hover:border-primary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category.key)}
                  onChange={() => handleCategoryChange(category.key)}
                  className="w-4 h-4 text-primary bg-background border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-text font-poppins text-sm">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs font-poppins text-text-tertiary mt-3">
          {t('form.categoryHelp')}
        </p>
      </div>

      {/* T-shirt Size */}
      {tshirtFieldConfig.enabled && (
        <div>
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            {tshirtFieldLabel} {tshirtFieldConfig.required && <span className="text-red-400">*</span>}
          </label>
          <select
            required={tshirtFieldConfig.required}
            value={formData.tshirtSize}
            onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })}
            className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">{t('form.selectSize')}</option>
            {tshirtSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add Partner */}
      <div>
        {partnerRequired ? (
          <p className="text-sm text-text-secondary font-poppins mb-3">
            {t('form.partnerRequiredNotice')}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (showPartner) {
                setShowPartner(false);
                setPartner(null);
                setPartnerPhotoError(null);
              } else {
                setShowPartner(true);
                setPartner(createEmptyPartner());
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-text hover:border-primary transition-colors"
          >
            <span className="text-xl">{showPartner ? '−' : '+'}</span>
            <span className="font-poppins">
              {showPartner ? t('form.removePartner') : t('form.addPartner')}
            </span>
          </button>
        )}

        {(partnerRequired || showPartner) && (
          <div className="mt-4 p-4 bg-background-secondary border border-gray-700 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.partnerName')} *
                </label>
                <input
                  type="text"
                  required={partnerRequired || showPartner}
                  value={partner?.name || ''}
                  onChange={(e) => updatePartnerField('name', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.partnerEmail')} *
                </label>
                <input
                  type="email"
                  required={partnerRequired || showPartner}
                  value={partner?.email || ''}
                  onChange={(e) => updatePartnerField('email', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('form.partnerPhone')} *
              </label>
              <input
                type="tel"
                required={partnerRequired || showPartner}
                value={partner?.phone || ''}
                onChange={(e) => updatePartnerField('phone', e.target.value)}
                className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('form.partnerTshirtSize')} *
              </label>
              <select
                required={partnerRequired || showPartner}
                value={partner?.tshirtSize || ''}
                onChange={(e) => updatePartnerField('tshirtSize', e.target.value)}
                className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">{t('form.partnerSelectSize')}</option>
                {tshirtSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('form.partnerPhoto')} <span className="text-text-tertiary text-xs">({t('form.optional')})</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePartnerPhotoChange}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus:outline-none"
              />
              <p className="mt-2 text-xs text-text-secondary">
                {t('form.partnerPhotoOptional')}
              </p>
              {partner?.photoName && (
                <p className="mt-2 text-xs text-text-secondary">
                  {partner.photoName}
                </p>
              )}
              {partnerPhotoError && (
                <p className="mt-2 text-xs text-red-400">{partnerPhotoError}</p>
              )}
            </div>
            {!partnerRequired && (
              <button
                type="button"
                onClick={() => {
                  setShowPartner(false);
                  setPartner(null);
                  setPartnerPhotoError(null);
                }}
                className="text-sm text-text-secondary hover:text-primary font-poppins"
              >
                {t('form.removePartner')}
              </button>
            )}
          </div>
        )}
      </div>

      {enabledCustomFields.length > 0 && (
        <div className="space-y-4">
          {enabledCustomFields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {field.label || t('form.customFieldFallback')}
                {field.required && <span className="text-red-400"> *</span>}
              </label>
              <input
                type="text"
                required={field.required}
                value={customFieldValues[field.id] || ''}
                onChange={(e) =>
                  setCustomFieldValues((prev) => ({
                    ...prev,
                    [field.id]: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.message')} ({t('form.optional')})
        </label>
        <textarea
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder={t('form.messagePlaceholder')}
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Photo Upload Instructions - Only for Partner */}
      {showPartner && (
        <div className="p-4 bg-background-secondary border border-gray-700 rounded-lg">
          <p className="text-sm font-poppins text-text-secondary mb-2">
            <strong className="text-text">{t('form.photoInstructions.title')}:</strong>
          </p>
          <p className="text-sm font-poppins text-text-secondary">
            {t('form.photoInstructions.text')}
          </p>
          <p className="text-sm font-poppins text-text-secondary mt-2">
            <strong>{t('form.photoInstructions.filename')}:</strong> {t('form.photoInstructions.filenameExample')}
          </p>
        </div>
      )}

      {submitStatus === 'success' && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-poppins">
          {t('form.success')}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins">
          {t('form.error')}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
      >
        {isSubmitting ? t('form.submitting') : t('form.registerButton')}
      </button>
    </form>
  );
};

export default TournamentRegistrationForm;

