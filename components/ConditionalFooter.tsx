'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer in admin pages (check for /[locale]/admin pattern)
  if (pathname?.includes('/admin')) {
    return null;
  }
  
  return <Footer />;
}

