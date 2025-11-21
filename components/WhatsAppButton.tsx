'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

const WhatsAppButton = () => {
  const t = useTranslations('WhatsApp');
  const locale = useLocale();
  const [userInfo, setUserInfo] = useState<{ name?: string; userId?: string } | null>(null);
  
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      fetch('/api/auth/login', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.session) {
            setUserInfo({
              name: data.session.firstName && data.session.lastName 
                ? `${data.session.firstName} ${data.session.lastName}` 
                : data.session.email,
              userId: data.session.userId,
            });
          }
        })
        .catch(() => {});
    }
  }, []);
  
  const phoneNumber = '34662423738';
  let message = t('message');
  
  if (userInfo) {
    const userDetails = `\n\n👤 ${t('userInfo') || 'User Info'}: ${userInfo.name || 'N/A'}\n🆔 User ID: ${userInfo.userId || 'N/A'}`;
    message += userDetails;
  }
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('button')}
      className="group fixed bottom-5 right-5 inline-flex items-center gap-1.5 md:gap-2 rounded-full px-3 md:px-5 py-2.5 md:py-3 font-semibold text-[#0E0E10] bg-gradient-to-br from-[#00C4FF] to-[#00FFE0] shadow-[0_8px_22px_rgba(0,196,255,.25)] ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:saturate-110 hover:shadow-[0_10px_26px_rgba(0,196,255,.32)] z-50"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-4 w-4 md:h-5 md:w-5 text-[#0E0E10] flex-shrink-0"
        fill="currentColor"
      >
        <path d="M19.1 17.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.3-.1-.5.1s-.6.8-.7 1c-.1.2-.3.2-.5.1-1-.5-1.9-1.2-2.6-2.1-.2-.2-.2-.4 0-.6.1-.1.3-.3.4-.5.1-.2.1-.3 0-.5-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1.1 1.7-1.1 2.7 0 .4.1.8.2 1.2.5 1.4 1.5 2.6 2.8 3.4 1.2.7 2.6 1.1 4 1.1 1.1 0 2.2-.2 3.2-.8.4-.2.9-.6 1.1-1 .1-.2.1-.5 0-.6-.1-.1-.2-.1-.3-.2zM16 4.1c-6.6 0-11.9 5.3-11.9 11.9 0 2.1.6 4.1 1.6 5.9L4 28l6.3-1.7c1.7.9 3.6 1.3 5.6 1.3 6.6 0 11.9-5.3 11.9-11.9S22.6 4.1 16 4.1z" />
      </svg>
      <span className="font-poppins text-sm md:text-base">WhatsApp</span>
    </a>
  );
};

export default WhatsAppButton;


