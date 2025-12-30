'use client';

import { ReactNode, useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LanguageSelector from '@/components/LanguageSelector';
import Script from 'next/script';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 = 256px (w-64)

  useEffect(() => {
    const updateSidebarWidth = () => {
      const saved = localStorage.getItem('adminSidebarCollapsed');
      const isCollapsed = saved ? JSON.parse(saved) : false;
      setSidebarWidth(isCollapsed ? 80 : 256); // 20 * 4 = 80px (w-20)
    };

    updateSidebarWidth();
    // Listen for storage changes (when sidebar is toggled in another tab)
    window.addEventListener('storage', updateSidebarWidth);
    // Also listen for custom event (when sidebar is toggled in same tab)
    const handleSidebarToggle = () => updateSidebarWidth();
    window.addEventListener('adminSidebarToggle', handleSidebarToggle);
    // Also check periodically (fallback)
    const interval = setInterval(updateSidebarWidth, 200);

    return () => {
      window.removeEventListener('storage', updateSidebarWidth);
      window.removeEventListener('adminSidebarToggle', handleSidebarToggle);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Убеждаемся, что PWA манифест подключен для админ панели */}
      <Script
        id="ensure-pwa-admin"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Убеждаемся, что манифест подключен для админ страниц
              if (typeof document !== 'undefined') {
                const ensureManifest = () => {
                  const head = document.head || document.getElementsByTagName('head')[0];
                  
                  // Проверяем наличие манифеста
                  let manifestLink = document.querySelector('link[rel="manifest"]');
                  if (!manifestLink) {
                    manifestLink = document.createElement('link');
                    manifestLink.setAttribute('rel', 'manifest');
                    manifestLink.setAttribute('href', '/manifest.json');
                    head.appendChild(manifestLink);
                  }
                  
                  // Проверяем наличие мета-тегов для PWA
                  const metaTags = [
                    { name: 'mobile-web-app-capable', content: 'yes' },
                    { name: 'apple-mobile-web-app-capable', content: 'yes' },
                    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
                  ];
                  
                  metaTags.forEach(tag => {
                    let meta = document.querySelector(\`meta[name="\${tag.name}"]\`);
                    if (!meta) {
                      meta = document.createElement('meta');
                      meta.setAttribute('name', tag.name);
                      meta.setAttribute('content', tag.content);
                      head.appendChild(meta);
                    }
                  });
                };
                
                // Выполняем сразу и после загрузки DOM
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', ensureManifest);
                } else {
                  ensureManifest();
                }
                
                // Также проверяем периодически (на случай если теги удаляются)
                setTimeout(ensureManifest, 100);
                setTimeout(ensureManifest, 500);
              }
            })();
          `,
        }}
      />
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <main 
          className="transition-all duration-300" 
          style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)` }}
        >
          {/* Language Selector in top right */}
          <div className="fixed top-4 right-4 z-50">
            <LanguageSelector variant="header" />
          </div>
          <div className="w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

