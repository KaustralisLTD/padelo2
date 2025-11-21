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
  // Партнеры для каждой категории (для mixed категорий)
  const [categoryPartners, setCategoryPartners] = useState<Record<string, Partner>>({});
  // Состояние для свернутых/развернутых блоков партнеров для mixed категорий
  const [expandedCategoryPartners, setExpandedCategoryPartners] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [partnerPhotoError, setPartnerPhotoError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Фото пользователя
  const [userPhoto, setUserPhoto] = useState<{ data: string | null; name: string | null }>({ data: null, name: null });
  const [userPhotoError, setUserPhotoError] = useState<string | null>(null);

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
        // Удаляем партнера для этой категории, если был
        if (category.startsWith('mixed')) {
          setCategoryPartners(prevPartners => {
            const newPartners = { ...prevPartners };
            delete newPartners[category];
            return newPartners;
          });
        }
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
      const newCategories = [...filteredCategories, category];
      
      // Если добавляется mixed категория и партнер обязателен, создаем пустого партнера и разворачиваем блок
      if (category.startsWith('mixed')) {
        if (partnerRequired) {
          // Если партнер обязателен, создаем пустого партнера и разворачиваем блок
          setCategoryPartners(prev => ({
            ...prev,
            [category]: createEmptyPartner(),
          }));
          setExpandedCategoryPartners(prev => ({
            ...prev,
            [category]: true,
          }));
        } else {
          // Если партнер не обязателен, блок остается свернутым
          setExpandedCategoryPartners(prev => ({
            ...prev,
            [category]: false,
          }));
        }
      }
      
      return {
        ...prev,
        categories: newCategories,
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

  const updateCategoryPartnerField = (category: string, field: keyof Partner, value: Partner[keyof Partner]) => {
    setCategoryPartners(prev => {
      const base = prev[category] ?? createEmptyPartner();
      return {
        ...prev,
        [category]: { ...base, [field]: value },
      };
    });
  };

  const handleCategoryPartnerPhotoChange = (category: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setCategoryPartners(prev => {
        const base = prev[category] ?? createEmptyPartner();
        return {
          ...prev,
          [category]: { ...base, photoData: null, photoName: null },
        };
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t('form.photoSizeError') || 'Photo size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCategoryPartners(prev => {
        const base = prev[category] ?? createEmptyPartner();
        return {
          ...prev,
          [category]: {
            ...base,
            photoData: typeof reader.result === 'string' ? reader.result : null,
            photoName: file.name,
          },
        };
      });
    };

    reader.onerror = () => {
      console.error('Error reading file');
    };

    reader.readAsDataURL(file);
  };

  const handleUserPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setUserPhoto({ data: null, name: null });
      setUserPhotoError(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUserPhotoError(t('form.photoSizeError') || 'Photo size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUserPhoto({
        data: typeof reader.result === 'string' ? reader.result : null,
        name: file.name,
      });
      setUserPhotoError(null);
    };

    reader.onerror = () => {
      setUserPhotoError(t('form.error') || 'Error reading file');
    };

    reader.readAsDataURL(file);
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

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Валидация категорий
    if (formData.categories.length === 0) {
      const errorMsg = t('form.validation.selectCategory') || 'Please select at least one category';
      alert(errorMsg);
      scrollToElement('categories-section');
      return;
    }

    // Валидация размера футболки
    if (tshirtFieldConfig.enabled && tshirtFieldConfig.required && !formData.tshirtSize) {
      const errorMsg = t('form.selectSize') || 'Please select T-shirt size';
      alert(errorMsg);
      const tshirtField = document.querySelector('[name="tshirtSize"]') as HTMLElement;
      if (tshirtField) {
        tshirtField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        tshirtField.focus();
      }
      return;
    }

    // Валидация кастомных полей
    for (const field of enabledCustomFields) {
      if (field.required && !(customFieldValues[field.id]?.trim())) {
        const errorMsg = t('form.error') || 'Please fill in all required fields';
        alert(errorMsg);
        const customField = document.querySelector(`[data-custom-field="${field.id}"]`) as HTMLElement;
        if (customField) {
          customField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          customField.focus();
        }
        return;
      }
    }

    // Валидация партнеров для mixed категорий
    const mixedCategoriesForValidation = formData.categories.filter(c => c.startsWith('mixed'));
    for (const category of mixedCategoriesForValidation) {
      const categoryPartner = categoryPartners[category];
      if (!categoryPartner) {
        const errorMsg = t('form.partnerRequiredForCategory', { category: t(`categories.${category}`) }) || `Partner is required for ${t(`categories.${category}`)}`;
        alert(errorMsg);
        const categoryPartnerSection = document.getElementById(`partner-section-${category}`);
        if (categoryPartnerSection) {
          categoryPartnerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (!categoryPartner.name?.trim()) {
        const errorMsg = t('form.partnerName') + ' is required' || 'Partner name is required';
        alert(errorMsg);
        const partnerNameField = document.querySelector(`[name="partnerName-${category}"]`) as HTMLElement;
        if (partnerNameField) {
          partnerNameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerNameField.focus();
        }
        return;
      }
      if (!categoryPartner.email?.trim()) {
        const errorMsg = t('form.partnerEmail') + ' is required' || 'Partner email is required';
        alert(errorMsg);
        const partnerEmailField = document.querySelector(`[name="partnerEmail-${category}"]`) as HTMLElement;
        if (partnerEmailField) {
          partnerEmailField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerEmailField.focus();
        }
        return;
      }
      if (!categoryPartner.phone?.trim()) {
        const errorMsg = t('form.partnerPhone') + ' is required' || 'Partner phone is required';
        alert(errorMsg);
        const partnerPhoneField = document.querySelector(`[name="partnerPhone-${category}"]`) as HTMLElement;
        if (partnerPhoneField) {
          partnerPhoneField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerPhoneField.focus();
        }
        return;
      }
      if (!categoryPartner.tshirtSize) {
        const errorMsg = t('form.partnerSelectSize') || 'Please select partner T-shirt size';
        alert(errorMsg);
        const partnerTshirtField = document.querySelector(`[name="partnerTshirtSize-${category}"]`) as HTMLElement;
        if (partnerTshirtField) {
          partnerTshirtField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerTshirtField.focus();
        }
        return;
      }
    }

    // Валидация партнера
    const partnerSectionVisible = partnerRequired || showPartner;

    if (partnerSectionVisible && partner) {
      if (!partner.name?.trim()) {
        const errorMsg = t('form.partnerName') + ' is required' || 'Partner name is required';
        alert(errorMsg);
        const partnerNameField = document.querySelector('[name="partnerName"]') as HTMLElement;
        if (partnerNameField) {
          partnerNameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerNameField.focus();
        }
        return;
      }
      if (!partner.email?.trim()) {
        const errorMsg = t('form.partnerEmail') + ' is required' || 'Partner email is required';
        alert(errorMsg);
        const partnerEmailField = document.querySelector('[name="partnerEmail"]') as HTMLElement;
        if (partnerEmailField) {
          partnerEmailField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerEmailField.focus();
        }
        return;
      }
      if (!partner.phone?.trim()) {
        const errorMsg = t('form.partnerPhone') + ' is required' || 'Partner phone is required';
        alert(errorMsg);
        const partnerPhoneField = document.querySelector('[name="partnerPhone"]') as HTMLElement;
        if (partnerPhoneField) {
          partnerPhoneField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerPhoneField.focus();
        }
        return;
      }
      if (!partner.tshirtSize) {
        const errorMsg = t('form.partnerSelectSize') || 'Please select partner T-shirt size';
        alert(errorMsg);
        const partnerTshirtField = document.querySelector('[name="partnerTshirtSize"]') as HTMLElement;
        if (partnerTshirtField) {
          partnerTshirtField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerTshirtField.focus();
        }
        return;
      }
    } else if (partnerSectionVisible && !partner) {
      const errorMsg = t('form.error') || 'Partner information is required';
      alert(errorMsg);
      const partnerSection = document.getElementById('partner-section');
      if (partnerSection) {
        partnerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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

    // Формируем объект партнеров для категорий
    const mixedCategories = formData.categories.filter(c => c.startsWith('mixed'));
    const categoryPartnersPayload: Record<string, Partner> = {};
    for (const category of mixedCategories) {
      if (categoryPartners[category]) {
        categoryPartnersPayload[category] = {
          ...categoryPartners[category],
          photoData: categoryPartners[category].photoData || null,
          photoName: categoryPartners[category].photoName || null,
        };
      }
    }

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
          categoryPartners: Object.keys(categoryPartnersPayload).length > 0 ? categoryPartnersPayload : undefined,
          userPhoto: userPhoto.data ? { data: userPhoto.data, name: userPhoto.name } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[TournamentRegistrationForm] Registration successful:', data);
        setSubmitStatus('success');
        // Store token in localStorage for dashboard access
        localStorage.setItem('tournament_token', data.token);
        // Redirect to confirmation page
        setTimeout(() => {
          window.location.href = `/${locale}/tournament/confirmation?token=${data.token}`;
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[TournamentRegistrationForm] Registration failed:', errorData);
        setSubmitStatus('error');
        setError(errorData.error || 'Failed to submit registration. Please try again.');
        alert(errorData.error || 'Failed to submit registration. Please try again.');
      }
    } catch (error: any) {
      console.error('[TournamentRegistrationForm] Registration error:', error);
      setSubmitStatus('error');
      const errorMessage = error.message || 'Failed to submit registration. Please check your connection and try again.';
      setError(errorMessage);
      alert(errorMessage);
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

      {/* User Photo Upload */}
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.userPhoto')} <span className="text-text-tertiary text-xs">({t('form.optional')})</span>
        </label>
        <div className="flex items-center gap-4">
          {userPhoto.data ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
              <img
                src={userPhoto.data}
                alt="User photo"
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
          <div className="flex-1">
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleUserPhotoChange}
                className="hidden"
                id="user-photo-upload"
              />
              <span className="inline-block px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity">
                {userPhoto.name || (t('form.chooseFile') || 'Choose File')}
              </span>
            </label>
            {userPhoto.name && (
              <button
                type="button"
                onClick={() => {
                  setUserPhoto({ data: null, name: null });
                  const input = document.getElementById('user-photo-upload') as HTMLInputElement;
                  if (input) input.value = '';
                }}
                className="ml-2 text-xs text-text-secondary hover:text-primary"
              >
                {t('form.removeFile') || 'Remove'}
              </button>
            )}
            <p className="text-xs text-text-tertiary mt-2">
              {t('form.photoHint') || 'Maximum 5MB. JPG, PNG formats.'}
            </p>
            {userPhotoError && (
              <p className="text-xs text-red-400 mt-2">{userPhotoError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div id="categories-section">
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

      {/* Add Partner - для основных категорий (male/female) */}
      {formData.categories.some(c => c.startsWith('male') || c.startsWith('female')) && (
        <div id="partner-section" className="mt-4">
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
              className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-text hover:border-primary transition-colors w-full"
            >
              <span className="text-xl">{showPartner ? '−' : '+'}</span>
              <span className="font-poppins">
                {showPartner ? t('form.removePartner') : t('form.addPartner')}
              </span>
            </button>
          )}

          {(partnerRequired || showPartner) && (
            <div className="bg-background-secondary p-4 rounded-lg border border-gray-700 space-y-4 mt-4">
              <h3 className="text-lg font-orbitron font-semibold text-text mb-2">
                {t('form.addPartner')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.partnerName')} {(partnerRequired || showPartner) && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="text"
                    required={partnerRequired || showPartner}
                    name="partnerName"
                    value={partner?.name || ''}
                    onChange={(e) => setPartner({ ...partner!, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.partnerEmail')} {(partnerRequired || showPartner) && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="email"
                    required={partnerRequired || showPartner}
                    name="partnerEmail"
                    value={partner?.email || ''}
                    onChange={(e) => setPartner({ ...partner!, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.partnerPhone')} {(partnerRequired || showPartner) && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="tel"
                  required={partnerRequired || showPartner}
                  name="partnerPhone"
                  value={partner?.phone || ''}
                  onChange={(e) => setPartner({ ...partner!, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.partnerTshirtSize')} {(partnerRequired || showPartner) && <span className="text-red-400">*</span>}
                </label>
                <select
                  required={partnerRequired || showPartner}
                  name="partnerTshirtSize"
                  value={partner?.tshirtSize || ''}
                  onChange={(e) => setPartner({ ...partner!, tshirtSize: e.target.value })}
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
                <div className="flex items-center gap-4">
                  {partner?.photoData ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                      <img
                        src={partner.photoData}
                        alt={partner.name || 'Partner photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex-1">
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
                      <p className="mt-2 text-xs text-red-400">
                        {partnerPhotoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Partners for Mixed Categories */}
      {formData.categories.filter(c => c.startsWith('mixed')).map((category) => {
        const categoryPartner = categoryPartners[category] || createEmptyPartner();
        const categoryName = t(`categories.${category}`);
        const isExpanded = expandedCategoryPartners[category] || false;
        const isRequired = partnerRequired;
        
        return (
          <div key={category} id={`partner-section-${category}`} className="mt-4">
            {isRequired ? (
              <p className="text-sm text-text-secondary font-poppins mb-3">
                {t('form.partnerRequiredNotice')}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setExpandedCategoryPartners(prev => ({
                    ...prev,
                    [category]: !isExpanded,
                  }));
                  if (!isExpanded && !categoryPartners[category]) {
                    setCategoryPartners(prev => ({
                      ...prev,
                      [category]: createEmptyPartner(),
                    }));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-text hover:border-primary transition-colors w-full"
              >
                <span className="text-xl">{isExpanded ? '−' : '+'}</span>
                <span className="font-poppins">
                  {isExpanded ? t('form.removePartner') : `${t('form.partnerForCategory')} ${categoryName}`}
                </span>
              </button>
            )}

            {(isRequired || isExpanded) && (
              <div className="bg-background-secondary p-4 rounded-lg border border-gray-700 space-y-4 mt-4">
                <h3 className="text-lg font-orbitron font-semibold text-text mb-2">
                  {t('form.partnerForCategory')} {categoryName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('form.partnerName')} {(isRequired || isExpanded) && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isRequired || isExpanded}
                      name={`partnerName-${category}`}
                      value={categoryPartner.name || ''}
                      onChange={(e) => updateCategoryPartnerField(category, 'name', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-text-secondary mb-2">
                      {t('form.partnerEmail')} {(isRequired || isExpanded) && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="email"
                      required={isRequired || isExpanded}
                      name={`partnerEmail-${category}`}
                      value={categoryPartner.email || ''}
                      onChange={(e) => updateCategoryPartnerField(category, 'email', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.partnerPhone')} {(isRequired || isExpanded) && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="tel"
                    required={isRequired || isExpanded}
                    name={`partnerPhone-${category}`}
                    value={categoryPartner.phone || ''}
                    onChange={(e) => updateCategoryPartnerField(category, 'phone', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.partnerTshirtSize')} {(isRequired || isExpanded) && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    required={isRequired || isExpanded}
                    name={`partnerTshirtSize-${category}`}
                    value={categoryPartner.tshirtSize || ''}
                    onChange={(e) => updateCategoryPartnerField(category, 'tshirtSize', e.target.value)}
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
                  <div className="flex items-center gap-4">
                    {categoryPartner.photoData ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                        <img
                          src={categoryPartner.photoData}
                          alt={categoryPartner.name || 'Partner photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCategoryPartnerPhotoChange(category, e)}
                        className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-text-secondary">
                        {t('form.partnerPhotoOptional')}
                      </p>
                      {categoryPartner.photoName && (
                        <p className="mt-2 text-xs text-text-secondary">
                          {categoryPartner.photoName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* T-shirt Size */}
      {tshirtFieldConfig.enabled && (
        <div>
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            {tshirtFieldLabel} {tshirtFieldConfig.required && <span className="text-red-400">*</span>}
          </label>
            <select
            name="tshirtSize"
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
                data-custom-field={field.id}
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

      {submitStatus === 'error' && error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins">
          {error}
        </div>
      )}
      {submitStatus === 'error' && !error && (
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

