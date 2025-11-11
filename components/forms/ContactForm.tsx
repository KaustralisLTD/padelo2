'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';

interface ContactFormProps {
  email: string;
  subject?: string;
}

const ContactForm = ({ email, subject }: ContactFormProps) => {
  const t = useTranslations('Contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    topic: subject || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          to: email,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '', topic: subject || '' });
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
      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.name')}
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.email')}
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {!subject && (
        <div>
          <label className="block text-sm font-poppins text-text-secondary mb-2">
            {t('form.topic')}
          </label>
          <select
            required
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">{t('form.selectTopic')}</option>
            <option value="general">{t('form.topics.general')}</option>
            <option value="investments">{t('form.topics.investments')}</option>
            <option value="partnerships">{t('form.topics.partnerships')}</option>
            <option value="support">{t('form.topics.support')}</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-poppins text-text-secondary mb-2">
          {t('form.message')}
        </label>
        <textarea
          required
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {submitStatus === 'success' && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-poppins">
          {t('form.success', { defaultValue: 'Message sent successfully!' })}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-poppins">
          {t('form.error', { defaultValue: 'Error sending message. Please try again.' })}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? t('form.sending') : t('form.submit')}
      </button>
    </form>
  );
};

export default ContactForm;

