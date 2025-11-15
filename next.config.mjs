import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Раскомментируйте только для статического экспорта
  images: {
    // unoptimized: true, // Раскомментируйте только для статического экспорта
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  // trailingSlash: true, // Раскомментируйте только для статического экспорта
};

export default withNextIntl(nextConfig);


