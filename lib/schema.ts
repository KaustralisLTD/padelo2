// Schema.org JSON-LD structured data generator

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

export interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface EventSchema {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name: string;
    address?: string;
  };
  organizer?: {
    name: string;
    url: string;
  };
  image?: string;
}

export interface BreadcrumbSchema {
  items: Array<{
    name: string;
    url: string;
  }>;
}

// Generate Organization schema
export function generateOrganizationSchema(
  locale: string,
  data?: Partial<OrganizationSchema>
): object {
  const defaultData: OrganizationSchema = {
    name: 'PadelO₂',
    url: `${baseUrl}/${locale}`,
    logo: `${baseUrl}/logo-hero.png`,
    description: 'Innovative padel sports ecosystem combining tournaments, training, AI-powered machines, and global court construction.',
    contactPoint: {
      contactType: 'Customer Service',
      email: 'info@padelo2.com',
    },
    sameAs: [
      // Add social media links when available
    ],
    ...data,
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: defaultData.name,
    url: defaultData.url,
    logo: defaultData.logo,
    description: defaultData.description,
    contactPoint: defaultData.contactPoint ? {
      '@type': 'ContactPoint',
      ...defaultData.contactPoint,
    } : undefined,
    sameAs: defaultData.sameAs,
  };
}

// Generate Event schema for tournaments
export function generateEventSchema(
  locale: string,
  event: EventSchema
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location ? {
      '@type': 'Place',
      name: event.location.name,
      address: event.location.address ? {
        '@type': 'PostalAddress',
        addressLocality: event.location.address,
      } : undefined,
    } : undefined,
    organizer: event.organizer ? {
      '@type': 'Organization',
      name: event.organizer.name,
      url: event.organizer.url,
    } : undefined,
    image: event.image,
    sport: 'Padel',
  };
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(breadcrumbs: BreadcrumbSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Generate WebSite schema with SearchAction
export function generateWebSiteSchema(locale: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PadelO₂',
    url: `${baseUrl}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Generate Service schema
export function generateServiceSchema(
  locale: string,
  service: {
    name: string;
    description: string;
    serviceType: string;
    provider: string;
    areaServed?: string;
  }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.serviceType,
    provider: {
      '@type': 'Organization',
      name: service.provider,
      url: `${baseUrl}/${locale}`,
    },
    areaServed: service.areaServed || 'Worldwide',
  };
}

// Generate FAQPage schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate Product schema for AI machines
export function generateProductSchema(
  locale: string,
  product: {
    name: string;
    description: string;
    brand: string;
    category: string;
    image?: string;
    offers?: {
      availability?: string;
      priceCurrency?: string;
      price?: string | number;
      priceValidUntil?: string;
    };
    aggregateRating?: {
      ratingValue: number;
      reviewCount: number;
      bestRating?: number;
      worstRating?: number;
    };
    review?: Array<{
      author: string;
      datePublished?: string;
      reviewBody: string;
      reviewRating: {
        ratingValue: number;
        bestRating?: number;
        worstRating?: number;
      };
    }>;
  }
): object {
  // Calculate priceValidUntil (1 year from now if not provided)
  const priceValidUntil = product.offers?.priceValidUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: product.category,
    description: product.description,
    image: product.image ? [product.image] : undefined,
  };

  // Add offers with required fields
  if (product.offers) {
    schema.offers = {
      '@type': 'Offer',
      availability: product.offers.availability || 'https://schema.org/PreOrder',
      priceCurrency: product.offers.priceCurrency || 'EUR',
      price: product.offers.price || '0', // Required field - using '0' as default for PreOrder
      priceValidUntil: priceValidUntil, // Required field
    };
  }

  // Add aggregateRating if provided
  if (product.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount,
      bestRating: product.aggregateRating.bestRating || 5,
      worstRating: product.aggregateRating.worstRating || 1,
    };
  }

  // Add reviews if provided
  if (product.review && product.review.length > 0) {
    schema.review = product.review.map((rev) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: rev.author,
      },
      datePublished: rev.datePublished || new Date().toISOString(),
      reviewBody: rev.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: rev.reviewRating.ratingValue,
        bestRating: rev.reviewRating.bestRating || 5,
        worstRating: rev.reviewRating.worstRating || 1,
      },
    }));
  }

  return schema;
}

// Generate Service schema for court construction (enhanced)
export function generateCourtConstructionServiceSchema(locale: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Padel court construction',
    provider: {
      '@type': 'Organization',
      name: 'PadelO₂',
      url: `${baseUrl}/${locale}`,
    },
    areaServed: 'Worldwide',
    description: 'Indoor/outdoor & panoramic padel courts, turnkey installation with glass walls, foundations, lighting & maintenance.',
  };
}

