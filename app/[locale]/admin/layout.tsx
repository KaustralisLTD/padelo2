'use client';

import { ReactNode, useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LanguageSelector from '@/components/LanguageSelector';

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
  );
}

