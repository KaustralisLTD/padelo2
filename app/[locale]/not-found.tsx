import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function NotFound() {
  const locale = 'en'; // Default locale, will be handled by middleware
  
  return (
    <div className="container mx-auto px-4 py-20 mt-20 text-center">
      <h1 className="text-6xl font-orbitron font-bold mb-4 gradient-text">404</h1>
      <h2 className="text-2xl font-orbitron font-semibold mb-6 text-text">
        Page Not Found
      </h2>
      <p className="text-text-secondary font-poppins mb-8">
        The page you are looking for does not exist.
      </p>
      <Link
        href={`/${locale}`}
        className="inline-block px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        Go Home
      </Link>
    </div>
  );
}


