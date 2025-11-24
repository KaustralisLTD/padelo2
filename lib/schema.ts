// Schema.org JSON-LD structured data generator

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.padelo2.com';

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
  eventStatus?: string;
  offers?: {
    url?: string;
    price?: string | number;
    priceCurrency?: string;
    availability?: string;
    validFrom?: string;
    validThrough?: string;
  };
  performer?: {
    name: string;
    '@type'?: string;
  };
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
    logo: `${baseUrl}/logo-header.png`,
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
  // Calculate default dates if not provided (next month for start, +3 days for end)
  const defaultStartDate = event.startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const defaultEndDate = event.endDate || new Date(new Date(defaultStartDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.name,
    description: event.description,
    startDate: defaultStartDate, // Required field
    endDate: defaultEndDate, // Required field
    sport: 'Padel',
  };

  // Location is required - use default if not provided
  if (event.location) {
    schema.location = {
      '@type': 'Place',
      name: event.location.name,
      address: event.location.address ? {
        '@type': 'PostalAddress',
        addressLocality: event.location.address,
      } : {
        '@type': 'PostalAddress',
        addressLocality: 'Worldwide',
      },
    };
  } else {
    // Default location
    schema.location = {
      '@type': 'Place',
      name: 'Various Locations',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Worldwide',
      },
    };
  }

  // Organizer
  if (event.organizer) {
    schema.organizer = {
      '@type': 'Organization',
      name: event.organizer.name,
      url: event.organizer.url,
    };
  }

  // Image
  if (event.image) {
    schema.image = event.image;
  }

  // Event status (default to EventScheduled if not provided)
  schema.eventStatus = event.eventStatus || 'https://schema.org/EventScheduled';

  // Offers (required for some event types)
  if (event.offers) {
    schema.offers = {
      '@type': 'Offer',
      url: event.offers.url || `${baseUrl}/${locale}/tournaments`,
      price: event.offers.price || '0',
      priceCurrency: event.offers.priceCurrency || 'EUR',
      availability: event.offers.availability || 'https://schema.org/InStock',
      validFrom: event.offers.validFrom || new Date().toISOString(),
      validThrough: event.offers.validThrough || defaultEndDate,
    };
  } else {
    // Default offers
    schema.offers = {
      '@type': 'Offer',
      url: `${baseUrl}/${locale}/tournaments`,
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      validThrough: defaultEndDate,
    };
  }

  // Performer (optional but recommended)
  if (event.performer) {
    schema.performer = {
      '@type': event.performer['@type'] || 'SportsTeam',
      name: event.performer.name,
    };
  } else {
    // Default performer
    schema.performer = {
      '@type': 'SportsTeam',
      name: 'Padel Players',
    };
  }

  return schema;
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
      hasMerchantReturnPolicy?: {
        '@type': string;
        applicableCountry: string;
        returnPolicyCategory: string;
        merchantReturnDays: number;
        returnMethod: string;
        returnFees: string;
      };
      shippingDetails?: {
        '@type': string;
        shippingRate?: {
          '@type': string;
          value: string;
          currency: string;
        };
        shippingDestination?: {
          '@type': string;
          addressCountry: string;
        };
        deliveryTime?: {
          '@type': string;
          businessDays: {
            '@type': string;
            dayOfWeek: string[];
          };
          cutoffTime?: string;
          handlingTime?: {
            '@type': string;
            minValue: number;
            maxValue: number;
            unitCode: string;
          };
          transitTime?: {
            '@type': string;
            minValue: number;
            maxValue: number;
            unitCode: string;
          };
        };
      };
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
    const isPreOrder = (product.offers.availability || 'https://schema.org/PreOrder') === 'https://schema.org/PreOrder';
    const priceValue = product.offers.price || '0';
    
    schema.offers = {
      '@type': 'Offer',
      availability: product.offers.availability || 'https://schema.org/PreOrder',
      priceCurrency: product.offers.priceCurrency || 'EUR',
      priceValidUntil: priceValidUntil, // Required field
      // Always include price field (required by Google)
      price: typeof priceValue === 'number' ? priceValue.toString() : priceValue,
    };

    // For PreOrder, also add priceSpecification
    if (isPreOrder && priceValue === '0') {
      schema.offers.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: '0',
        priceCurrency: product.offers.priceCurrency || 'EUR',
        valueAddedTaxIncluded: true,
      };
    }

    // Add hasMerchantReturnPolicy if provided or use default
    if (product.offers.hasMerchantReturnPolicy) {
      schema.offers.hasMerchantReturnPolicy = product.offers.hasMerchantReturnPolicy;
    } else {
      // Default return policy - use ISO country code array for international shipping
      schema.offers.hasMerchantReturnPolicy = {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'PT', 'IE', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'MT', 'LU', 'CY'],
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      };
    }

    // Add shippingDetails if provided or use default
    if (product.offers.shippingDetails) {
      schema.offers.shippingDetails = product.offers.shippingDetails;
    } else {
      // Default shipping details - use ISO country code array for international shipping
      schema.offers.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'PT', 'IE', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'MT', 'LU', 'CY'],
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 5,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 7,
            maxValue: 14,
            unitCode: 'DAY',
          },
        },
      };
    }
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

