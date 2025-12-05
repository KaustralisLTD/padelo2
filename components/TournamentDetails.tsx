'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatLocalizedDate } from '@/lib/localization-utils';

interface EventScheduleItem {
  title: string;
  date: string;
  time: string;
  description?: string;
}

interface Tournament {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  location: string | null;
  locationAddress?: string | null;
  locationCoordinates?: { lat: number; lng: number } | null;
  eventSchedule?: EventScheduleItem[] | null;
  maxParticipants: number | null;
  priceSingleCategory?: number | null;
  priceDoubleCategory?: number | null;
  status: string;
  guestTicket?: {
    enabled: boolean;
    title?: string;
    price?: number;
    description?: string;
    eventSchedule?: EventScheduleItem[];
  };
  translations?: {
    description?: Record<string, string>;
    eventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
    guestTicketTitle?: Record<string, string>;
    guestTicketDescription?: Record<string, string>;
    guestTicketEventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
  };
}

interface TournamentDetailsProps {
  tournamentId: number;
  registrationType?: 'participant' | 'guest';
}

export default function TournamentDetails({ tournamentId, registrationType = 'participant' }: TournamentDetailsProps) {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEventSchedule, setShowEventSchedule] = useState(false);

  useEffect(() => {
    fetchTournamentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, locale]);

  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch(`/api/tournament/${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
        
        // Debug: логируем переводы для отладки
        if (data.tournament?.translations) {
          console.log('[TournamentDetails] Translations loaded from API:', {
            locale,
            descriptionKeys: Object.keys(data.tournament.translations.description || {}),
            eventScheduleKeys: Object.keys(data.tournament.translations.eventSchedule || {}),
            hasDescriptionUA: !!data.tournament.translations.description?.['ua'],
            hasDescriptionUK: !!data.tournament.translations.description?.['uk'],
            hasDescriptionRU: !!data.tournament.translations.description?.['ru'],
            hasDescriptionES: !!data.tournament.translations.description?.['es'],
            hasEventScheduleUA: !!data.tournament.translations.eventSchedule?.['ua'],
            hasEventScheduleUK: !!data.tournament.translations.eventSchedule?.['uk'],
            hasEventScheduleRU: !!data.tournament.translations.eventSchedule?.['ru'],
            hasEventScheduleES: !!data.tournament.translations.eventSchedule?.['es'],
            descriptionUA: data.tournament.translations.description?.['ua']?.substring(0, 50),
            descriptionUK: data.tournament.translations.description?.['uk']?.substring(0, 50),
            eventScheduleUA: data.tournament.translations.eventSchedule?.['ua']?.map((e: any) => e.title),
            eventScheduleUK: data.tournament.translations.eventSchedule?.['uk']?.map((e: any) => e.title),
          });
        } else {
          console.warn('[TournamentDetails] No translations found in tournament data');
        }
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null, includeTime: boolean = true) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      // Map locale codes to proper Intl locale strings
      const localeMap: Record<string, string> = {
        'en': 'en-US',
        'ru': 'ru-RU',
        'ua': 'uk-UA',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'ca': 'ca-ES',
        'nl': 'nl-NL',
        'da': 'da-DK',
        'sv': 'sv-SE',
        'no': 'no-NO',
        'ar': 'ar-SA',
        'zh': 'zh-CN',
      };
      const intlLocale = localeMap[locale] || locale;
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return date.toLocaleDateString(intlLocale, options);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-background-secondary rounded-lg border border-border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  // Helper function to get translated description
  const getTranslatedDescription = (): string => {
    const targetDescription = registrationType === 'guest' ? tournament?.guestTicket?.description : tournament?.description;
    const targetTranslations = registrationType === 'guest' ? tournament?.translations?.guestTicketDescription : tournament?.translations?.description;

    if (!targetDescription) return '';
    
    // Если нет переводов, возвращаем оригинал
    if (!targetTranslations || Object.keys(targetTranslations).length === 0) {
      return targetDescription;
    }
    
    // Определяем приоритетный порядок проверки ключей для текущей локали
    let keysToTry: string[] = [locale];
    
    // Для украинского пробуем оба варианта
    if (locale === 'ua') {
      keysToTry = ['ua', 'uk', 'ru', 'en'];
    } else if (locale === 'uk') {
      keysToTry = ['uk', 'ua', 'ru', 'en'];
    } else {
      // Для других языков пробуем текущую локаль, затем английский
      keysToTry = [locale, 'en'];
    }
    
    // Пробуем найти перевод по приоритету
    for (const key of keysToTry) {
      if (targetTranslations[key]) {
        return targetTranslations[key];
      }
    }
    
    // Если не нашли перевод, пробуем найти любой доступный перевод (кроме оригинального языка)
    const availableKeys = Object.keys(targetTranslations);
    if (availableKeys.length > 0) {
      // Пробуем английский, если есть
      if (targetTranslations['en']) {
        return targetTranslations['en'];
      }
      // Иначе берем первый доступный
      return targetTranslations[availableKeys[0]];
    }
    
    // В крайнем случае возвращаем оригинал
    return targetDescription;
  };

  // Helper function to get translated event schedule
  const getTranslatedEventSchedule = (): EventScheduleItem[] => {
    const targetSchedule = registrationType === 'guest' ? tournament?.guestTicket?.eventSchedule : tournament?.eventSchedule;
    const targetTranslations = registrationType === 'guest' ? tournament?.translations?.guestTicketEventSchedule : tournament?.translations?.eventSchedule;

    if (!targetSchedule || targetSchedule.length === 0) {
      return [];
    }
    
    // Если нет переводов, возвращаем оригинал
    if (!targetTranslations || Object.keys(targetTranslations).length === 0) {
      return targetSchedule;
    }
    
    // Определяем приоритетный порядок проверки ключей для текущей локали
    let keysToTry: string[] = [locale];
    
    // Для украинского пробуем оба варианта
    if (locale === 'ua') {
      keysToTry = ['ua', 'uk', 'ru', 'en'];
    } else if (locale === 'uk') {
      keysToTry = ['uk', 'ua', 'ru', 'en'];
    } else {
      // Для других языков пробуем текущую локаль, затем английский
      keysToTry = [locale, 'en'];
    }
    
    // Пробуем найти перевод по приоритету
    for (const key of keysToTry) {
      if (targetTranslations[key]) {
        return targetTranslations[key];
      }
    }
    
    // Если не нашли перевод, пробуем найти любой доступный перевод (кроме оригинального языка)
    const availableKeys = Object.keys(targetTranslations);
    if (availableKeys.length > 0) {
      // Пробуем английский, если есть
      if (targetTranslations['en']) {
        return targetTranslations['en'];
      }
      // Иначе берем первый доступный
      return targetTranslations[availableKeys[0]];
    }
    
    // В крайнем случае возвращаем оригинал
    return targetSchedule;
  };

  return (
    <div className="mb-8 bg-background-secondary p-6 rounded-lg border border-border">
      <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
        {t('tournamentDetails.title')}
      </h2>
      
      {tournament.description && registrationType === 'participant' && (
        <div className="mb-4">
          <p className="text-text-secondary font-poppins whitespace-pre-line">
            {getTranslatedDescription()}
          </p>
        </div>
      )}
      
      {/* Описание для гостей */}
      {registrationType === 'guest' && tournament.guestTicket?.description && (
        <div className="mb-4">
          <p className="text-text-secondary font-poppins whitespace-pre-line">
            {getTranslatedDescription()}
          </p>
        </div>
      )}

      {/* Адрес с Google Maps */}
      {(tournament.locationAddress || tournament.locationCoordinates) && (
        <div className="mb-6">
          <h3 className="font-poppins font-semibold text-text mb-3">
            {t('tournamentDetails.address')}:
          </h3>
          {tournament.locationAddress && (
            <p className="text-text-secondary font-poppins mb-3">
              {tournament.locationAddress}
            </p>
          )}
          {tournament.locationCoordinates && (
            <>
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${tournament.locationCoordinates.lat},${tournament.locationCoordinates.lng}&zoom=15`}
                  />
                </div>
              ) : (
                <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-background-secondary flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-text-secondary font-poppins mb-3">
                      Карта недоступна. Нажмите на ссылку ниже, чтобы открыть в Google Maps.
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${tournament.locationCoordinates.lat},${tournament.locationCoordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-primary text-white rounded-lg font-poppins hover:bg-primary-dark transition-colors"
                    >
                      Открыть в Google Maps
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
          {tournament.locationCoordinates && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${tournament.locationCoordinates.lat},${tournament.locationCoordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-primary hover:text-primary/80 font-poppins text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {t('tournamentDetails.getDirections')}
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {tournament.location && (
          <div>
            <span className="font-poppins font-semibold text-text">
              {t('tournamentDetails.location')}:
            </span>
            <span className="ml-2 text-text-secondary font-poppins">
              {tournament.location}
            </span>
          </div>
        )}

        <div>
          <span className="font-poppins font-semibold text-text">
            {t('tournamentDetails.startDate')}:
          </span>
          <span className="ml-2 text-text-secondary font-poppins">
            {formatDate(tournament.startDate)}
          </span>
        </div>

        <div>
          <span className="font-poppins font-semibold text-text">
            {t('tournamentDetails.endDate')}:
          </span>
          <span className="ml-2 text-text-secondary font-poppins">
            {formatDate(tournament.endDate)}
          </span>
        </div>

        {tournament.registrationDeadline && (
          <div>
            <span className="font-poppins font-semibold text-text">
              {t('tournamentDetails.registrationDeadline')}:
            </span>
            <span className="ml-2 text-text-secondary font-poppins">
              {formatDate(tournament.registrationDeadline)}
            </span>
          </div>
        )}

        {tournament.maxParticipants && (
          <div>
            <span className="font-poppins font-semibold text-text">
              {t('tournamentDetails.maxParticipants')}:
            </span>
            <span className="ml-2 text-text-secondary font-poppins">
              {tournament.maxParticipants}
            </span>
          </div>
        )}
      </div>

      {/* Pricing - для участников или гостей */}
      {(() => {
        if (registrationType === 'guest' && tournament.guestTicket?.price) {
          // Для гостей показываем цену гостевого билета
          return (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-poppins font-semibold text-text mb-2">
                {t('tournamentDetails.pricing')}:
              </h3>
              <div>
                <span className="font-poppins text-text-secondary">
                  {t('tournamentDetails.guestPrice')}:
                </span>
                <span className="ml-2 font-poppins font-semibold text-primary">
                  {tournament.guestTicket.price.toFixed(2)} EUR
                </span>
              </div>
            </div>
          );
        } else if (registrationType === 'participant' && (tournament.priceSingleCategory || tournament.priceDoubleCategory)) {
          // Для участников показываем обычные цены
          return (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-poppins font-semibold text-text mb-2">
                {t('tournamentDetails.pricing')}:
              </h3>
              {tournament.priceSingleCategory && (
                <div className="mb-2">
                  <span className="font-poppins text-text-secondary">
                    {t('tournamentDetails.priceSingleCategory')}:
                  </span>
                  <span className="ml-2 font-poppins font-semibold text-primary">
                    {tournament.priceSingleCategory.toFixed(2)} EUR
                  </span>
                </div>
              )}
              {tournament.priceDoubleCategory && (
                <div>
                  <span className="font-poppins text-text-secondary">
                    {t('tournamentDetails.priceDoubleCategory')}:
                  </span>
                  <span className="ml-2 font-poppins font-semibold text-primary">
                    {tournament.priceDoubleCategory.toFixed(2)} EUR {t('tournamentDetails.perCategory')}
                  </span>
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Расписание событий - для участников или гостей */}
      {(() => {
        const scheduleToShow = getTranslatedEventSchedule();
        
        if (!scheduleToShow || scheduleToShow.length === 0) {
          return null;
        }
        
        return (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-poppins font-semibold text-text">
                {t('tournamentDetails.eventSchedule')}:
              </h3>
              <button
                onClick={() => setShowEventSchedule(!showEventSchedule)}
                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-poppins text-sm"
              >
                {showEventSchedule ? t('tournamentDetails.hideEvents') : t('tournamentDetails.showEvents')}
              </button>
            </div>
            {showEventSchedule && (
              <div className="space-y-4">
                {scheduleToShow.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-poppins font-semibold text-text">
                        {event.title}
                      </h4>
                      <div className="text-right">
                        {event.date && (
                          <div className="text-sm text-text-secondary font-poppins">
                            {formatLocalizedDate(event.date, locale)}
                            {event.time && (
                              <span className="ml-1">
                                {locale === 'ua' || locale === 'ru' ? ' о' : ' at'} {event.time}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-text-secondary font-poppins text-sm">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Prizes placeholder - только для участников */}
      {registrationType === 'participant' && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="font-poppins font-semibold text-text mb-2">
            {t('tournamentDetails.prizes')}:
          </h3>
          <p className="text-text-secondary font-poppins text-sm">
            {t('tournamentDetails.prizesInfo')}
          </p>
        </div>
      )}
    </div>
  );
}



