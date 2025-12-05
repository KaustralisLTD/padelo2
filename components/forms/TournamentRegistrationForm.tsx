'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import {
  TournamentRegistrationSettings,
  getDefaultRegistrationSettings,
  normalizeRegistrationSettings,
} from '@/lib/registration-settings';
import { compressImageToSize } from '@/lib/image-compression';
import { getCategoryLevelExplanation, getLocalizedCategoryName } from '@/lib/localization-utils';

interface Partner {
  name?: string;
  firstName?: string;
  lastName?: string;
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
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(true); // Default to true, will be updated from API response
  // Фото пользователя
  const [userPhoto, setUserPhoto] = useState<{ data: string | null; name: string | null }>({ data: null, name: null });
  const [userPhotoError, setUserPhotoError] = useState<string | null>(null);
  // Категория KIDS
  const [kidsCategoryEnabled, setKidsCategoryEnabled] = useState(false);
  // Тип регистрации: 'participant' или 'guest'
  const [registrationType, setRegistrationType] = useState<'participant' | 'guest'>('participant');
  const [tournament, setTournament] = useState<any>(null);
  const [children, setChildren] = useState<Array<{ firstName: string; lastName: string; photoData: string | null; photoName: string | null }>>([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  // Для гостей: количество взрослых и детей
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [guestChildren, setGuestChildren] = useState<Array<{ age: number }>>([]);

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

  // Размеры футболок с измерениями (ANCHO - ширина, LARGO - длина)
  const tshirtSizesData: Record<string, { ancho: number; largo: number }> = {
    'S': { ancho: 48, largo: 67 },
    'M': { ancho: 51, largo: 69 },
    'L': { ancho: 54, largo: 71 },
    'XL': { ancho: 57, largo: 73 },
    '2XL': { ancho: 60, largo: 75 },
  };
  const tshirtSizes = Object.keys(tshirtSizesData);
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
          setKidsCategoryEnabled(data.tournament?.kidsCategoryEnabled || false);
          setTournament(data.tournament);
          // Если гостевой билет включен, по умолчанию выбираем участника
          if (data.tournament?.guestTicket?.enabled) {
            setRegistrationType('participant');
          }
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
    firstName: '',
    lastName: '',
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

  const handleCategoryPartnerPhotoChange = async (category: string, event: ChangeEvent<HTMLInputElement>) => {
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
      
      setCategoryPartners(prev => {
        const base = prev[category] ?? createEmptyPartner();
        return {
          ...prev,
          [category]: {
            ...base,
            photoData: compressedBase64,
            photoName: file.name,
          },
        };
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      alert(t('form.error') || 'Error processing image. Please try another file.');
    }
  };

  const handleUserPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setUserPhoto({ data: null, name: null });
      setUserPhotoError(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUserPhotoError(t('form.error') || 'Please select an image file');
      return;
    }

    // Check original size (before compression)
    if (file.size > 20 * 1024 * 1024) {
      setUserPhotoError(t('form.photoSizeError') || 'Photo size must be less than 20MB');
      return;
    }

    setUserPhotoError(null);

    try {
      // Compress image before converting to base64
      const compressedBase64 = await compressImageToSize(file, 500); // Max 500KB
      
      setUserPhoto({
        data: compressedBase64,
        name: file.name,
      });
      setUserPhotoError(null);
    } catch (error) {
      console.error('Error compressing image:', error);
      setUserPhotoError(t('form.error') || 'Error processing image. Please try another file.');
    }
  };

  const handlePartnerPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPartner(prev => {
        if (!prev) return prev;
        return { ...prev, photoData: null, photoName: null };
      });
      setPartnerPhotoError(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPartnerPhotoError(t('form.error') || 'Please select an image file');
      return;
    }

    // Check original size (before compression)
    if (file.size > 20 * 1024 * 1024) {
      setPartnerPhotoError(t('form.photoSizeError') || 'Photo size must be less than 20MB');
      return;
    }

    setPartnerPhotoError(null);

    try {
      // Compress image before converting to base64
      const compressedBase64 = await compressImageToSize(file, 500); // Max 500KB
      
      setPartner(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          photoData: compressedBase64,
          photoName: file.name,
        };
      });
      setPartnerPhotoError(null);
    } catch (error) {
      console.error('Error compressing image:', error);
      setPartnerPhotoError(t('form.error') || 'Error processing image. Please try another file.');
    }
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
    // Валидация категорий только для участников
    if (registrationType === 'participant' && formData.categories.length === 0) {
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

    // Валидация партнеров для mixed категорий (только если блок развернут или обязателен)
    const mixedCategoriesForValidation = formData.categories.filter(c => c.startsWith('mixed'));
    for (const category of mixedCategoriesForValidation) {
      const isExpanded = expandedCategoryPartners[category] || false;
      const isRequired = partnerRequired;
      const shouldValidate = isRequired || isExpanded;
      
      if (!shouldValidate) {
        continue; // Пропускаем валидацию, если блок не развернут и не обязателен
      }
      
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
      if (!categoryPartner.firstName?.trim()) {
        const errorMsg = t('form.firstName') + ' is required' || 'Partner first name is required';
        alert(errorMsg);
        const partnerFirstNameField = document.querySelector(`[name="partnerFirstName-${category}"]`) as HTMLElement;
        if (partnerFirstNameField) {
          partnerFirstNameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerFirstNameField.focus();
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

    // Валидация данных ребенка для категории KIDS
    if (formData.categories.includes('kids')) {
      if (children.length === 0) {
        const errorMsg = t('form.atLeastOneChildRequired') || 'At least one child is required';
        alert(errorMsg);
        return false;
      }
      for (let i = 0; i < children.length; i++) {
        if (!children[i].firstName?.trim() || !children[i].lastName?.trim()) {
          const errorMsg = t('form.childFirstName') + ' and ' + t('form.childLastName') + ' are required for all children';
          alert(errorMsg);
          return false;
        }
      }
    }

    // Валидация партнера
    const partnerSectionVisible = partnerRequired || showPartner;

    if (partnerSectionVisible && partner) {
      if (!partner.firstName?.trim() && !partner.name?.trim()) {
        const errorMsg = t('form.firstName') + ' is required' || 'Partner first name is required';
        alert(errorMsg);
        const partnerFirstNameField = document.querySelector('[name="partnerFirstName"]') as HTMLElement;
        if (partnerFirstNameField) {
          partnerFirstNameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          partnerFirstNameField.focus();
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
            // Конвертируем firstName/lastName в name для обратной совместимости
            name: partner.firstName 
              ? `${partner.firstName}${partner.lastName ? ' ' + partner.lastName : ''}`.trim()
              : partner.name || undefined,
            photoData: partner.photoData || null,
            photoName: partner.photoName || null,
          }
        : null;

    // Формируем объект партнеров для категорий
    const mixedCategories = formData.categories.filter(c => c.startsWith('mixed'));
    const categoryPartnersPayload: Record<string, Partner> = {};
    for (const category of mixedCategories) {
      if (categoryPartners[category]) {
        const partner = categoryPartners[category];
        // Конвертируем firstName/lastName в name для обратной совместимости
        const name = partner.firstName 
          ? `${partner.firstName}${partner.lastName ? ' ' + partner.lastName : ''}`.trim()
          : partner.name || '';
        categoryPartnersPayload[category] = {
          ...partner,
          name: name || undefined,
          photoData: partner.photoData || null,
          photoName: partner.photoName || null,
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
          children: formData.categories.includes('kids') && children.length > 0 ? children : undefined,
          userPhoto: userPhoto.data ? { data: userPhoto.data, name: userPhoto.name } : undefined,
          registrationType: registrationType,
          adultsCount: registrationType === 'guest' ? adultsCount : undefined,
          guestChildren: registrationType === 'guest' && guestChildren.length > 0 ? guestChildren : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[TournamentRegistrationForm] Registration successful:', data);
        setSubmitStatus('success');
        setFormCollapsed(true);
        setIsAlreadyRegistered(true);
        setExistingToken(data.token);
        // Store token in localStorage for dashboard access
        localStorage.setItem('tournament_token', data.token);
        // Store emailVerified status to show appropriate message
        setEmailVerified(data.emailVerified || false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[TournamentRegistrationForm] Registration failed:', errorData);
        setSubmitStatus('error');
        
        // Обработка ошибки 413 (Payload Too Large)
        if (response.status === 413 || errorData.errorCode === 'PAYLOAD_TOO_LARGE') {
          const errorMessage = errorData.message || t('form.payloadTooLarge') || 'Размер загружаемых фотографий превышает допустимый лимит.';
          const solution = errorData.solution || t('form.photoUploadSolution') || 'Если не удается загрузить фотографии сейчас, вы сможете сделать это позже из своего личного кабинета на странице турнира.';
          setError(`${errorMessage}\n\n${solution}`);
          alert(`${errorMessage}\n\n${solution}`);
        } else {
          // Обработка других ошибок
          const errorMessage = errorData.message || errorData.error || 'Не удалось отправить регистрацию. Пожалуйста, попробуйте еще раз.';
          setError(errorMessage);
          alert(errorMessage);
        }
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
      {submitStatus === 'success' && formCollapsed && (
        <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/30 rounded-xl shadow-lg backdrop-blur-sm font-poppins space-y-3 max-w-full overflow-hidden">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg sm:text-xl mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent break-words">
                {t('form.registrationReceived')}
              </h3>
              <p className="text-text text-sm mb-3 leading-relaxed break-words">
                {emailVerified 
                  ? t('form.registrationReceivedMessage', { tournamentName })
                  : t('form.registrationReceivedMessageUnverified', { tournamentName })}
              </p>
              {!emailVerified && (
                <div className="bg-background/50 rounded-lg p-3 border border-primary/20">
                  <p className="text-text font-semibold text-sm mb-1 flex items-start gap-2 break-words">
                    <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-words">{t('form.checkEmail')}</span>
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed mb-2 break-words">{t('form.emailInstructions')}</p>
                  <button
                    onClick={async () => {
                      alert(t('form.resendVerificationEmail') || 'Resend verification email functionality coming soon');
                    }}
                    className="text-primary hover:text-accent text-xs font-semibold underline break-words"
                  >
                    {t('form.resendVerificationEmail')}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setFormCollapsed(false)}
                className="mt-3 px-4 py-2 bg-background-secondary border border-primary/30 rounded-lg text-text hover:border-primary transition-colors text-sm font-poppins"
              >
                {t('form.viewFilledData') || 'View Filled Data'}
              </button>
            </div>
          </div>
        </div>
      )}
      {(!formCollapsed || submitStatus !== 'success') && (
        <div>
      {/* Registration Type Selection - только если гостевой билет включен */}
      {tournament?.guestTicket?.enabled && (
        <div className="mb-6 p-4 bg-background-secondary border border-border rounded-lg">
          <label className="block text-sm font-poppins font-semibold text-text mb-4">
            {t('form.registrationType') || 'Registration Type'} *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              registrationType === 'participant'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}>
              <input
                type="radio"
                name="registrationType"
                value="participant"
                checked={registrationType === 'participant'}
                onChange={(e) => setRegistrationType(e.target.value as 'participant' | 'guest')}
                className="w-5 h-5 text-primary mr-3"
              />
              <div>
                <div className="font-poppins font-semibold text-text">
                  {t('form.registerAsParticipant') || 'Register as Participant'}
                </div>
                <div className="text-sm text-text-secondary">
                  {t('form.registerAsParticipantDesc') || 'Participate in tournament categories'}
                </div>
              </div>
            </label>
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              registrationType === 'guest'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}>
              <input
                type="radio"
                name="registrationType"
                value="guest"
                checked={registrationType === 'guest'}
                onChange={(e) => setRegistrationType(e.target.value as 'participant' | 'guest')}
                className="w-5 h-5 text-primary mr-3"
              />
              <div>
                <div className="font-poppins font-semibold text-text">
                  {t('form.registerAsGuest') || 'Register as Guest'}
                </div>
                <div className="text-sm text-text-secondary">
                  {tournament.guestTicket.price 
                    ? `${tournament.guestTicket.price} EUR - ${tournament.guestTicket.description || 'Attend as a guest'}`
                    : (tournament.guestTicket.description || 'Attend as a guest')}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

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
            {t('form.lastName')} {registrationType === 'guest' ? `(${t('form.optional')})` : '*'}
          </label>
          <input
            type="text"
            required={registrationType === 'participant'}
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

      {/* Telegram - только для участников */}
      {registrationType === 'participant' && (
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
      )}

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

      {/* User Photo Upload - только для участников */}
      {registrationType === 'participant' && (
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.userPhoto')} <span className="text-text-tertiary text-xs">({t('form.optional')})</span>
        </label>
        <div className="flex items-center gap-4">
          {userPhoto.data ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
              <Image
                src={userPhoto.data}
                alt="User photo"
                fill
                className="object-cover"
                unoptimized
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
              {t('form.photoHint') || 'Maximum 15MB. JPG, PNG formats.'}
            </p>
            {userPhotoError && (
              <p className="text-xs text-red-400 mt-2">{userPhotoError}</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Photo Upload Instructions - For Player - только для участников */}
      {registrationType === 'participant' && (
      <div className="p-4 bg-background-secondary border border-gray-700 rounded-lg">
        <p className="text-sm font-poppins text-text-secondary mb-2">
          <strong className="text-text">{t('form.photoInstructions.title')}:</strong>
        </p>
        <p className="text-sm font-poppins text-text-secondary">
          {t('form.photoInstructions.text')}
        </p>
      </div>

      {/* Categories - только для участников */}
      {registrationType === 'participant' && (
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
                <span className="text-text font-poppins text-sm">
                  {category.label}
                  {category.key.endsWith('1') || category.key.endsWith('2') ? (
                    <span className="text-text-tertiary text-xs ml-1">
                      ({getCategoryLevelExplanation(category.key.slice(-1) as '1' | '2', locale)})
                    </span>
                  ) : null}
                </span>
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
                <span className="text-text font-poppins text-sm">
                  {category.label}
                  {category.key.endsWith('1') || category.key.endsWith('2') ? (
                    <span className="text-text-tertiary text-xs ml-1">
                      ({getCategoryLevelExplanation(category.key.slice(-1) as '1' | '2', locale)})
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Mixed Categories - Below */}
        <div className="mt-4">
          <p className="text-sm font-orbitron font-semibold text-text mb-3">
            {t('categories.mixed1').replace(/\s+\d+$/, '')}
          </p>
          <p className="text-xs text-text-tertiary mb-2 font-poppins">
            {t('form.mixedExplanation') || `${t('categories.male1').replace(/\s+\d+$/, '')} + ${t('categories.female1').replace(/\s+\d+$/, '')}`}
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
                <span className="text-text font-poppins text-sm">
                  {category.label}
                  {category.key.endsWith('1') || category.key.endsWith('2') ? (
                    <span className="text-text-tertiary text-xs ml-1">
                      ({getCategoryLevelExplanation(category.key.slice(-1) as '1' | '2', locale)})
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* KIDS Category - только для участников */}
        {registrationType === 'participant' && kidsCategoryEnabled && (
          <div className="mt-4">
            <label
              className={`flex items-center space-x-2 p-3 bg-background-secondary border rounded-lg cursor-pointer transition-colors ${
                formData.categories.includes('kids')
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 hover:border-primary'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.categories.includes('kids')}
                onChange={() => {
                  const newCategories = formData.categories.includes('kids')
                    ? formData.categories.filter(c => c !== 'kids')
                    : [...formData.categories, 'kids'];
                  setFormData({ ...formData, categories: newCategories });
                  if (!formData.categories.includes('kids') && children.length === 0) {
                    setShowChildForm(true);
                  }
                }}
                className="w-4 h-4 text-primary bg-background border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-text font-poppins text-sm">{t('categories.kids') || 'KIDS'}</span>
            </label>
          </div>
        )}

        {/* Helper text */}
        <p className="text-xs font-poppins text-text-tertiary mt-3">
          {t('form.categoryHelp')}
        </p>
      </div>
      )}

      {/* Add Partner - для основных категорий (male/female) - только для участников */}
      {registrationType === 'participant' && formData.categories.some(c => c.startsWith('male') || c.startsWith('female')) && (
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
            <div className="bg-background-secondary p-4 rounded-lg border border-gray-700 space-y-4 mt-4 relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-orbitron font-semibold text-text">
                  {t('partnerInfo')}
                </h3>
                {!partnerRequired && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPartner(false);
                      setPartner(null);
                      setPartnerPhotoError(null);
                    }}
                    className="text-text-secondary hover:text-primary transition-colors"
                    title={t('form.close') || 'Close'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.firstName')} {(partnerRequired || showPartner) && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="text"
                    required={partnerRequired || showPartner}
                    name="partnerFirstName"
                    value={partner?.firstName || ''}
                    onChange={(e) => updatePartnerField('firstName', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.lastName')}
                  </label>
                  <input
                    type="text"
                    name="partnerLastName"
                    value={partner?.lastName || ''}
                    onChange={(e) => updatePartnerField('lastName', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
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
                  onChange={(e) => updatePartnerField('email', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                />
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
                  {tshirtSizes.map((size) => {
                    const measurements = tshirtSizesData[size];
                    return (
                      <option key={size} value={size}>
                        {size} ({t('form.tshirtWidth')}: {measurements.ancho}cm, {t('form.tshirtLength')}: {measurements.largo}cm)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.partnerPhoto')} <span className="text-text-tertiary text-xs">({t('form.optional')})</span>
                </label>
                <div className="flex items-center gap-4">
                  {partner?.photoData ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                      <Image
                        src={partner.photoData}
                        alt={partner.name || 'Partner photo'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePartnerPhotoChange}
                        className="hidden"
                        id="partner-photo-upload"
                      />
                      <span className="inline-block px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity">
                        {partner?.photoName || (t('form.chooseFile') || 'Choose File')}
                      </span>
                    </label>
                    {partner?.photoName && (
                      <button
                        type="button"
                        onClick={() => {
                          setPartner(prev => prev ? { ...prev, photoData: null, photoName: null } : null);
                          const input = document.getElementById('partner-photo-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="ml-2 text-xs text-text-secondary hover:text-primary"
                      >
                        {t('form.removeFile') || 'Remove'}
                      </button>
                    )}
                    <p className="text-xs text-text-tertiary mt-2">
                      {t('form.photoHint') || 'Maximum 15MB. JPG, PNG formats.'}
                    </p>
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

      {/* Partners for Mixed Categories - только для участников */}
      {registrationType === 'participant' && formData.categories.filter(c => c.startsWith('mixed')).map((category) => {
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
              <div className="bg-background-secondary p-4 rounded-lg border border-gray-700 space-y-4 mt-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-orbitron font-semibold text-text">
                    {t('form.partnerForCategory')} {getLocalizedCategoryName(category, locale) || categoryName}
                  </h3>
                  {!isRequired && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedCategoryPartners(prev => ({
                          ...prev,
                          [category]: false,
                        }));
                      }}
                      className="text-text-secondary hover:text-primary transition-colors"
                      title={t('form.close') || 'Close'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.firstName')} {(isRequired || isExpanded) && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isRequired || isExpanded}
                        name={`partnerFirstName-${category}`}
                        value={categoryPartner.firstName || ''}
                        onChange={(e) => updateCategoryPartnerField(category, 'firstName', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-text-secondary mb-2">
                        {t('form.lastName')}
                      </label>
                      <input
                        type="text"
                        name={`partnerLastName-${category}`}
                        value={categoryPartner.lastName || ''}
                        onChange={(e) => updateCategoryPartnerField(category, 'lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
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
                    {tshirtSizes.map((size) => {
                      const measurements = tshirtSizesData[size];
                      return (
                      <option key={size} value={size}>
                          {size} ({t('form.tshirtWidth')}: {measurements.ancho}cm, {t('form.tshirtLength')}: {measurements.largo}cm)
                      </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.partnerPhoto')} <span className="text-text-tertiary text-xs">({t('form.optional')})</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {categoryPartner.photoData ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                        <Image
                          src={categoryPartner.photoData}
                          alt={categoryPartner.firstName || categoryPartner.name || 'Partner photo'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCategoryPartnerPhotoChange(category, e)}
                          className="hidden"
                          id={`category-partner-photo-${category}`}
                        />
                        <span className="inline-block px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity">
                          {categoryPartner.photoName || (t('form.chooseFile') || 'Choose File')}
                        </span>
                      </label>
                      {categoryPartner.photoName && (
                        <button
                          type="button"
                          onClick={() => {
                            updateCategoryPartnerField(category, 'photoData', null);
                            updateCategoryPartnerField(category, 'photoName', null);
                            const input = document.getElementById(`category-partner-photo-${category}`) as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="ml-2 text-xs text-text-secondary hover:text-primary"
                        >
                          {t('form.removeFile') || 'Remove'}
                        </button>
                      )}
                      <p className="text-xs text-text-tertiary mt-2">
                        {t('form.photoHint') || 'Maximum 15MB. JPG, PNG formats.'}
                      </p>
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
            {tshirtSizes.map((size) => {
              const measurements = tshirtSizesData[size];
              return (
              <option key={size} value={size}>
                  {size} ({t('form.tshirtWidth')}: {measurements.ancho}cm, {t('form.tshirtLength')}: {measurements.largo}cm)
              </option>
              );
            })}
          </select>
        </div>
      )}

      {/* KIDS Category - Child Data - только для участников */}
      {registrationType === 'participant' && kidsCategoryEnabled && formData.categories.includes('kids') && (
        <div className="border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-orbitron font-semibold text-text">
              {t('form.childInfo') || 'Child Information'}
            </h4>
            {showChildForm && (
              <button
                type="button"
                onClick={() => setShowChildForm(false)}
                className="text-text-secondary hover:text-primary transition-colors"
                title={t('form.close') || 'Close'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* List of added children */}
          {children.length > 0 && (
            <div className="mb-4 space-y-2">
              {children.map((child, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-gray-700">
                  <span className="text-text font-poppins text-sm">
                    {child.firstName} {child.lastName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChildren(children.filter((_, i) => i !== index))}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    {t('form.remove') || 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add child button */}
          {!showChildForm && (
            <button
              type="button"
              onClick={() => setShowChildForm(true)}
              className="w-full px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-text hover:border-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span className="font-poppins">{t('form.addChild') || 'Add Child'}</span>
            </button>
          )}
          
          {/* Child form */}
          {showChildForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('form.childFirstName') || 'Child First Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    id="child-first-name-input"
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
                    id="child-last-name-input"
                    className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  {t('form.childPhoto') || 'Child Photo'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        id="child-photo-input"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.type.startsWith('image/')) {
                              alert(t('form.error') || 'Please select an image file');
                              return;
                            }
                            if (file.size > 20 * 1024 * 1024) {
                              alert(t('form.photoSizeError') || 'Photo size must be less than 20MB');
                              return;
                            }
                            try {
                              const compressedBase64 = await compressImageToSize(file, 500);
                              const photoNameInput = document.getElementById('child-photo-name') as HTMLInputElement;
                              if (photoNameInput) {
                                photoNameInput.value = file.name;
                                photoNameInput.setAttribute('data-photo', compressedBase64);
                              }
                            } catch (error) {
                              console.error('Error compressing image:', error);
                              alert(t('form.error') || 'Error processing image. Please try another file.');
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <span className="inline-block px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity">
                        <span id="child-photo-name-display">{t('form.chooseFile') || 'Choose File'}</span>
                      </span>
                    </label>
                    <input type="hidden" id="child-photo-name" data-photo="" />
                    <p className="text-xs text-text-tertiary mt-2">
                      {t('form.photoHint') || 'Maximum 15MB. JPG, PNG formats.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const firstNameInput = document.getElementById('child-first-name-input') as HTMLInputElement;
                    const lastNameInput = document.getElementById('child-last-name-input') as HTMLInputElement;
                    const photoInput = document.getElementById('child-photo-name') as HTMLInputElement;
                    
                    const firstName = firstNameInput?.value.trim();
                    const lastName = lastNameInput?.value.trim();
                    
                    if (!firstName || !lastName) {
                      alert(t('form.childFirstName') + ' and ' + t('form.childLastName') + ' are required');
                      return;
                    }
                    
                    const newChild = {
                      firstName,
                      lastName,
                      photoData: photoInput?.getAttribute('data-photo') || null,
                      photoName: photoInput?.value || null,
                    };
                    
                    setChildren([...children, newChild]);
                    if (firstNameInput) firstNameInput.value = '';
                    if (lastNameInput) lastNameInput.value = '';
                    if (photoInput) {
                      photoInput.value = '';
                      photoInput.setAttribute('data-photo', '');
                    }
                    const photoNameDisplay = document.getElementById('child-photo-name-display');
                    if (photoNameDisplay) photoNameDisplay.textContent = t('form.chooseFile') || 'Choose File';
                    const fileInput = document.getElementById('child-photo-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                    setShowChildForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-background rounded-lg text-sm font-poppins hover:opacity-90 transition-opacity"
                >
                  {t('form.addChild') || 'Add Child'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChildForm(false);
                    const firstNameInput = document.getElementById('child-first-name-input') as HTMLInputElement;
                    const lastNameInput = document.getElementById('child-last-name-input') as HTMLInputElement;
                    if (firstNameInput) firstNameInput.value = '';
                    if (lastNameInput) lastNameInput.value = '';
                  }}
                  className="px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-text hover:border-primary transition-colors"
                >
                  {t('form.cancel') || 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {registrationType === 'participant' && enabledCustomFields.length > 0 && (
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

      {/* Guest-specific fields */}
      {registrationType === 'guest' && (
        <>
          {/* Количество взрослых */}
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-2">
              {t('form.adultsCount') || 'Number of Adults'} *
            </label>
            <input
              type="number"
              min="1"
              required
              value={adultsCount}
              onChange={(e) => setAdultsCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Количество детей */}
          <div>
            <label className="block text-sm font-poppins text-text-secondary mb-2">
              {t('form.childrenCount') || 'Number of Children'} ({t('form.optional')})
            </label>
            <input
              type="number"
              min="0"
              value={guestChildren.length}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                if (count > guestChildren.length) {
                  // Добавляем детей
                  setGuestChildren([...guestChildren, ...Array(count - guestChildren.length).fill(null).map(() => ({ age: 0 }))]);
                } else if (count < guestChildren.length) {
                  // Удаляем детей
                  setGuestChildren(guestChildren.slice(0, count));
                }
              }}
              className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Возраст каждого ребенка */}
          {guestChildren.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-poppins text-text-secondary mb-2">
                {t('form.childrenAges') || 'Children Ages'} *
              </label>
              {guestChildren.map((child, index) => (
                <div key={index} className="flex items-center gap-3">
                  <label className="text-sm font-poppins text-text-secondary whitespace-nowrap">
                    {t('form.child') || 'Child'} {index + 1}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    required
                    value={child.age || ''}
                    onChange={(e) => {
                      const newChildren = [...guestChildren];
                      newChildren[index] = { age: parseInt(e.target.value) || 0 };
                      setGuestChildren(newChildren);
                    }}
                    placeholder={t('form.age') || 'Age'}
                    className="flex-1 px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-sm text-text-secondary">{t('form.yearsOld') || 'years old'}</span>
                </div>
              ))}
            </div>
          )}
        </>
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


      {submitStatus === 'success' && (
        <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/30 rounded-xl shadow-lg backdrop-blur-sm font-poppins space-y-3 max-w-full overflow-hidden">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg sm:text-xl mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent break-words">
                {t('form.registrationReceived')}
              </h3>
              <p className="text-text text-sm mb-3 leading-relaxed break-words">
                {emailVerified 
                  ? t('form.registrationReceivedMessage', { tournamentName })
                  : t('form.registrationReceivedMessageUnverified', { tournamentName })}
              </p>
              {!emailVerified && (
                <div className="bg-background/50 rounded-lg p-3 border border-primary/20">
                  <p className="text-text font-semibold text-sm mb-1 flex items-start gap-2 break-words">
                    <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-words">{t('form.checkEmail')}</span>
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed mb-2 break-words">{t('form.emailInstructions')}</p>
                  <button
                    onClick={async () => {
                      // TODO: Implement resend verification email
                      alert(t('form.resendVerificationEmail') || 'Resend verification email functionality coming soon');
                    }}
                    className="text-primary hover:text-accent text-xs font-semibold underline break-words"
                  >
                    {t('form.resendVerificationEmail')}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setFormCollapsed(!formCollapsed)}
                className="mt-3 px-4 py-2 bg-background-secondary border border-primary/30 rounded-lg text-text hover:border-primary transition-colors text-sm font-poppins"
              >
                {formCollapsed ? t('form.viewFilledData') || 'View Filled Data' : t('form.hideForm') || 'Hide Form'}
              </button>
            </div>
          </div>
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

      {isAlreadyRegistered && submitStatus === 'success' ? (
        <button
          type="button"
          onClick={async () => {
            if (!existingToken) return;
            setIsSubmitting(true);
            try {
              // Отправляем запрос на повторную отправку email
              const response = await fetch('/api/tournament/resend-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: existingToken }),
              });
              if (response.ok) {
                setSubmitStatus('success');
                setError(null);
              } else {
                setError(t('form.resendEmailError') || 'Failed to resend email');
              }
            } catch (error) {
              setError(t('form.resendEmailError') || 'Failed to resend email');
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="w-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {isSubmitting ? t('form.submitting') : t('form.resendVerificationEmail')}
        </button>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-8 py-4 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
        >
          {isSubmitting ? t('form.submitting') : t('form.registerButton')}
        </button>
      )}
        </div>
      )}
    </form>
  );
};

export default TournamentRegistrationForm;

