'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Pricing {
  id: number;
  club_id: number;
  type: 'court_booking' | 'tournament' | 'membership' | 'lesson';
  name: string;
  description?: string;
  price: number;
  currency: string;
  time_slot_start?: string;
  time_slot_end?: string;
  day_of_week?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface Club {
  id: number;
  name: string;
}

export default function PricingSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [formData, setFormData] = useState({
    type: 'court_booking' as 'court_booking' | 'tournament' | 'membership' | 'lesson',
    name: '',
    description: '',
    price: '',
    currency: 'EUR',
    timeSlotStart: '',
    timeSlotEnd: '',
    dayOfWeek: '',
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  useEffect(() => {
    if (selectedClubId) {
      fetchPricing(selectedClubId);
    } else {
      setPricing([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClubId]);

  const fetchClubs = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/clubs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
        if (data.clubs && data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async (clubId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/admin/clubs/${clubId}/pricing`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPricing(data.pricing || []);
      } else {
        setError('Failed to load pricing');
      }
    } catch (err) {
      setError('Failed to load pricing');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/pricing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timeSlotStart: formData.timeSlotStart || null,
          timeSlotEnd: formData.timeSlotEnd || null,
          dayOfWeek: formData.dayOfWeek || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Pricing created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchPricing(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create pricing');
      }
    } catch (err) {
      setError('Failed to create pricing');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !selectedClubId || !editingPricing) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/pricing/${editingPricing.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timeSlotStart: formData.timeSlotStart || null,
          timeSlotEnd: formData.timeSlotEnd || null,
          dayOfWeek: formData.dayOfWeek || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Pricing updated successfully');
        setShowCreateModal(false);
        setEditingPricing(null);
        resetForm();
        fetchPricing(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update pricing');
      }
    } catch (err) {
      setError('Failed to update pricing');
    }
  };

  const handleDelete = async (pricingId: number) => {
    if (!token || !selectedClubId) return;
    if (!confirm('Are you sure you want to delete this pricing?')) return;

    try {
      const response = await fetch(`/api/admin/clubs/${selectedClubId}/pricing/${pricingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Pricing deleted successfully');
        fetchPricing(selectedClubId);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete pricing');
      }
    } catch (err) {
      setError('Failed to delete pricing');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'court_booking',
      name: '',
      description: '',
      price: '',
      currency: 'EUR',
      timeSlotStart: '',
      timeSlotEnd: '',
      dayOfWeek: '',
      isActive: true,
    });
    setEditingPricing(null);
  };

  const openEditModal = (pricingItem: Pricing) => {
    setEditingPricing(pricingItem);
    setFormData({
      type: pricingItem.type,
      name: pricingItem.name,
      description: pricingItem.description || '',
      price: pricingItem.price.toString(),
      currency: pricingItem.currency,
      timeSlotStart: pricingItem.time_slot_start || '',
      timeSlotEnd: pricingItem.time_slot_end || '',
      dayOfWeek: pricingItem.day_of_week || '',
      isActive: pricingItem.is_active,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingPricing(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-text-secondary font-poppins">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 pt-20 pl-4">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('settings.clubModules.pricing.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.clubModules.pricing.description')}
        </p>
      </div>

      {/* Club Selection */}
      {clubs.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            Select Club
          </label>
          <select
            value={selectedClubId || ''}
            onChange={(e) => setSelectedClubId(parseInt(e.target.value))}
            className="w-full md:w-auto px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 font-poppins">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 font-poppins">
          {error}
        </div>
      )}

      {/* Pricing List */}
      {selectedClubId && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-poppins font-semibold text-text">
              Pricing ({pricing.length})
            </h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Pricing
            </button>
          </div>

          {pricing.length === 0 ? (
            <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
              <p className="text-text-secondary font-poppins">No pricing found. Add your first pricing rule.</p>
            </div>
          ) : (
            <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Time Slot</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Day</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 text-text font-poppins capitalize">{item.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-text font-poppins">{item.name}</td>
                      <td className="px-6 py-4 text-text font-poppins font-semibold">
                        {item.price} {item.currency}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins">
                        {item.time_slot_start && item.time_slot_end
                          ? `${item.time_slot_start} - ${item.time_slot_end}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins capitalize">
                        {item.day_of_week || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-poppins font-semibold ${
                          item.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && selectedClubId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-2xl font-poppins font-bold gradient-text">
                {editingPricing ? 'Edit Pricing' : 'Add Pricing'}
              </h3>
            </div>
            <form onSubmit={editingPricing ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="court_booking">Court Booking</option>
                  <option value="tournament">Tournament</option>
                  <option value="membership">Membership</option>
                  <option value="lesson">Lesson</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Time Slot Start
                  </label>
                  <input
                    type="time"
                    value={formData.timeSlotStart}
                    onChange={(e) => setFormData({ ...formData, timeSlotStart: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    Time Slot End
                  </label>
                  <input
                    type="time"
                    value={formData.timeSlotEnd}
                    onChange={(e) => setFormData({ ...formData, timeSlotEnd: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-poppins text-text-secondary mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Any Day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <span className="text-text font-poppins">Active</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingPricing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-background border border-border text-text font-poppins font-semibold rounded-lg hover:bg-background-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

