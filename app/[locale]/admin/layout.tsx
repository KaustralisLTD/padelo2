'use client';

import { ReactNode, useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 transition-all duration-300" style={{ marginLeft: `${sidebarWidth}px` }}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

