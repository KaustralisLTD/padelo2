'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvestmentModal = ({ isOpen, onClose }: InvestmentModalProps) => {
  const t = useTranslations('InvestmentModal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    investmentSize: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Implement form submission
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      alert('Form submitted successfully!');
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background-secondary border border-gray-800 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-orbitron font-bold gradient-text">
                  {t('title')}
                </h3>
                <button
                  onClick={onClose}
                  className="text-text-secondary hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('company')}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-poppins text-text-secondary mb-2">
                    {t('investmentSize')}
                  </label>
                  <select
                    required
                    value={formData.investmentSize}
                    onChange={(e) => setFormData({ ...formData, investmentSize: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">{t('selectSize')}</option>
                    <option value="small">{t('sizes.small')}</option>
                    <option value="medium">{t('sizes.medium')}</option>
                    <option value="large">{t('sizes.large')}</option>
                    <option value="enterprise">{t('sizes.enterprise')}</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-700 text-text-secondary font-poppins rounded-lg hover:border-primary transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSubmitting ? t('submitting') : t('submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InvestmentModal;


