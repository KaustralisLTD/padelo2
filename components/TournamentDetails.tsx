'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

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
}

interface TournamentDetailsProps {
  tournamentId: number;
}

export default function TournamentDetails({ tournamentId }: TournamentDetailsProps) {
  const t = useTranslations('Tournaments');
  const locale = useLocale();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch(`/api/tournament/${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className="mb-8 bg-background-secondary p-6 rounded-lg border border-border">
      <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
        {t('tournamentDetails.title')}
      </h2>
      
      {tournament.description && (
        <div className="mb-4">
          <p className="text-text-secondary font-poppins whitespace-pre-line">
            {tournament.description}
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

      {(tournament.priceSingleCategory || tournament.priceDoubleCategory) && (
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
      )}

      {/* Расписание событий */}
      {tournament.eventSchedule && tournament.eventSchedule.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-poppins font-semibold text-text mb-4">
            {t('tournamentDetails.eventSchedule')}:
          </h3>
          <div className="space-y-4">
            {tournament.eventSchedule.map((event, index) => (
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
                        {new Date(event.date).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                    {event.time && (
                      <div className="text-sm text-text-secondary font-poppins">
                        {event.time}
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
        </div>
      )}

      {/* Prizes placeholder - можно добавить отдельное поле в БД позже */}
      <div className="mt-4 pt-4 border-t border-border">
        <h3 className="font-poppins font-semibold text-text mb-2">
          {t('tournamentDetails.prizes')}:
        </h3>
        <p className="text-text-secondary font-poppins text-sm">
          {t('tournamentDetails.prizesInfo')}
        </p>
      </div>
    </div>
  );
}

