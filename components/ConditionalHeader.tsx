'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header in admin pages (check for /[locale]/admin pattern)
  if (pathname?.includes('/admin')) {
    return null;
  }
  
  return <Header />;
}

