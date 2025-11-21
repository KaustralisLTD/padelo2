'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CourtBooking {
  id: number;
  courtId: number;
  courtName: string;
  startTime: string;
  endTime: string;
  type: 'court' | 'training' | 'ai_training' | 'tournament' | 'event';
  title: string;
  participants?: string[];
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface Court {
  id: number;
  name: string;
  location?: string;
}

export function ParticipantScheduleContent() {
  const t = useTranslations('ParticipantSchedule');
  const locale = useLocale();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('padel');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Генерируем временные слоты с 8:30 до 20:30 с интервалом 30 минут
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 8 && minute < 30) continue; // Пропускаем до 8:30
        if (hour === 20 && minute > 30) break; // Останавливаемся на 20:30
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // TODO: Заменить на реальный API endpoint
    // Временные данные для демонстрации
    setCourts([
      { id: 1, name: 'Padel 01', location: 'Centre Court' },
      { id: 2, name: 'Padel 02', location: 'Centre Court' },
      { id: 3, name: 'Padel 03' },
      { id: 4, name: 'Padel 04' },
      { id: 5, name: 'Padel 05' },
      { id: 6, name: 'Padel 06' },
    ]);

    // Пример бронирований
    const today = new Date();
    today.setHours(14, 30, 0, 0);
    setBookings([
      {
        id: 1,
        courtId: 1,
        courtName: 'Padel 01',
        startTime: '14:30',
        endTime: '15:30',
        type: 'event',
        title: 'Padelos Exhibition & Pro-Am Event',
        status: 'confirmed',
      },
    ]);

    setLoading(false);
  }, [locale, router, selectedDate]);

  const getBookingForSlot = (courtId: number, timeSlot: string): CourtBooking | null => {
    return bookings.find(
      (booking) =>
        booking.courtId === courtId &&
        booking.startTime <= timeSlot &&
        booking.endTime > timeSlot
    ) || null;
  };

  const getBookingHeight = (booking: CourtBooking): number => {
    const start = timeSlots.indexOf(booking.startTime);
    const end = timeSlots.indexOf(booking.endTime);
    return (end - start) * 60; // 60px на слот
  };

  const getBookingTop = (booking: CourtBooking): number => {
    const start = timeSlots.indexOf(booking.startTime);
    return start * 60; // 60px на слот
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const upcomingBookings = bookings
    .filter((b) => {
      const bookingDate = new Date(`${selectedDate.toDateString()} ${b.startTime}`);
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return bookingDate >= now && bookingDate <= twoHoursLater;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold gradient-text">
            {t('title')}
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('createBooking')}
            </button>
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-3 bg-background-secondary border border-border text-text font-orbitron font-semibold rounded-lg hover:border-primary transition-colors"
            >
              {t('backToDashboard')}
            </Link>
          </div>
        </div>

        {/* Filters and Date Navigation */}
        <div className="bg-background-secondary p-4 rounded-lg border border-border mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            {/* Date Display and Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-primary/20 text-primary font-poppins font-semibold rounded-lg hover:bg-primary/30 transition-colors"
              >
                {t('today') || 'Today'}
              </button>
              <div className="text-xl font-orbitron font-semibold text-text min-w-[200px] text-center">
                {formatDate(selectedDate)}
              </div>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('searchByName') || 'Search by name'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
              >
                <option value="padel">{t('sportPadel') || 'Padel'}</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
              >
                <option value="all">{t('typeAll') || 'All Types'}</option>
                <option value="court">{t('typeCourt') || 'Court Booking'}</option>
                <option value="training">{t('typeTraining') || 'Training'}</option>
                <option value="ai_training">{t('typeAITraining') || 'AI Training'}</option>
                <option value="tournament">{t('typeTournament') || 'Tournament'}</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-poppins">{error}</p>
          </div>
        )}

        {/* Main Content: Schedule Grid */}
        <div className="flex gap-6">
          {/* Schedule Table */}
          <div className="flex-1 bg-background-secondary rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-background border-b border-gray-800/30">
                    <th className="w-32 p-3 text-left text-sm font-orbitron font-semibold text-text-secondary sticky left-0 bg-background z-10">
                      {t('time') || 'Time'}
                    </th>
                    {courts.map((court) => (
                      <th
                        key={court.id}
                        className="min-w-[180px] p-3 text-center text-sm font-orbitron font-semibold text-text border-l border-gray-800/30"
                      >
                        <div>{court.name}</div>
                        {court.location && (
                          <div className="text-xs text-text-secondary font-poppins mt-1">
                            {court.location}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot, slotIndex) => (
                    <tr key={timeSlot} className="border-b border-gray-800/20 hover:bg-background/30">
                      <td className="w-32 p-2 text-sm font-poppins text-text-secondary sticky left-0 bg-background-secondary z-10">
                        {new Date(`2000-01-01 ${timeSlot}`).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      {courts.map((court) => {
                        const booking = getBookingForSlot(court.id, timeSlot);
                        const isStartOfBooking = booking && booking.startTime === timeSlot;

                        return (
                          <td
                            key={court.id}
                            className="min-w-[180px] p-0 relative border-l border-gray-800/20"
                          >
                            {isStartOfBooking && (
                              <div
                                className={`absolute left-0 right-0 z-20 p-2 rounded ${
                                  booking.type === 'event'
                                    ? 'bg-purple-500/20 border border-purple-500'
                                    : booking.type === 'tournament'
                                    ? 'bg-yellow-500/20 border border-yellow-500'
                                    : booking.type === 'training'
                                    ? 'bg-green-500/20 border border-green-500'
                                    : booking.type === 'ai_training'
                                    ? 'bg-blue-500/20 border border-blue-500'
                                    : 'bg-primary/20 border border-primary'
                                }`}
                                style={{
                                  height: `${getBookingHeight(booking)}px`,
                                  top: `${getBookingTop(booking)}px`,
                                }}
                              >
                                <div className="text-xs font-poppins font-semibold text-text">
                                  {booking.title}
                                </div>
                                {booking.participants && booking.participants.length > 0 && (
                                  <div className="text-xs text-text-secondary mt-1">
                                    {booking.participants.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                            {!booking && (
                              <div
                                className="h-[60px] cursor-pointer hover:bg-primary/5 transition-colors"
                                onClick={() => {
                                  // TODO: Open booking modal for this slot
                                  setShowCreateModal(true);
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar: Upcoming Bookings */}
          <div className="w-80 bg-background-secondary rounded-lg border border-border p-4">
            <div className="flex gap-2 mb-4">
              <button className="flex-1 px-4 py-2 bg-primary text-background font-orbitron font-semibold rounded-lg text-sm">
                {t('upcoming') || 'Upcoming'}
              </button>
              <button className="flex-1 px-4 py-2 bg-background border border-border text-text font-orbitron font-semibold rounded-lg text-sm hover:border-primary transition-colors">
                {t('late') || 'Late'}
              </button>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-text-secondary font-poppins font-semibold mb-2">
                  {t('noUpcomingBookings') || 'No Upcoming Bookings'}
                </p>
                <p className="text-text-secondary font-poppins text-sm">
                  {t('upcomingBookingsHint') ||
                    'Your upcoming bookings in next 2 hours will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 bg-background rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="text-sm font-orbitron font-semibold text-text mb-1">
                      {booking.title}
                    </div>
                    <div className="text-xs text-text-secondary font-poppins">
                      {booking.courtName} • {booking.startTime} - {booking.endTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Booking Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary rounded-lg border border-border p-6 max-w-md w-full">
              <h2 className="text-2xl font-orbitron font-semibold mb-4 text-text">
                {t('createBooking')}
              </h2>
              <p className="text-text-secondary font-poppins mb-4">
                {t('comingSoon')}
              </p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full px-6 py-3 bg-background border border-border text-text font-orbitron font-semibold rounded-lg hover:border-primary transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
