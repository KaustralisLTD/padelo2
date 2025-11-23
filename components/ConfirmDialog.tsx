'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      iconBg: 'from-red-500/20 to-orange-500/20',
      iconColor: 'text-red-400',
      buttonBg: 'bg-gradient-to-r from-red-500 to-orange-500',
    },
    warning: {
      iconBg: 'from-yellow-500/20 to-orange-500/20',
      iconColor: 'text-yellow-400',
      buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    },
    info: {
      iconBg: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
      buttonBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background-secondary rounded-xl border border-primary/30 max-w-md w-full shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${styles.iconBg} rounded-full flex items-center justify-center`}>
                    {variant === 'danger' ? (
                      <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : variant === 'warning' ? (
                      <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className={`w-8 h-8 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-orbitron font-bold text-center mb-4 gradient-text">
                  {title}
                </h3>
                <p className="text-text-secondary text-center mb-6 font-poppins whitespace-pre-line">
                  {message}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 border-2 border-border text-text-secondary font-poppins font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    className={`flex-1 px-6 py-3 ${styles.buttonBg} text-white font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

