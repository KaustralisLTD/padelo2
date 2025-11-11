# PadelO₂ Website

Innovative multi-language platform dedicated to the padel sports ecosystem.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Internationalization:** next-intl (14 languages)
- **Deployment:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── [locale]/          # Localized pages
│   ├── globals.css        # Global styles
│   ├── sitemap.ts         # SEO sitemap
│   └── robots.ts          # SEO robots.txt
├── components/
│   ├── sections/          # Page sections
│   ├── modals/            # Modal components
│   ├── Header.tsx         # Navigation header
│   ├── Footer.tsx         # Site footer
│   └── LanguageSelector.tsx
├── messages/              # Translation files (14 languages)
├── i18n.ts               # i18n configuration
└── middleware.ts          # Next.js middleware for i18n
```

## Languages Supported

- English (en)
- Spanish (es)
- Ukrainian (ua)
- Russian (ru)
- Catalan (ca)
- Chinese (zh)
- Dutch (nl)
- Danish (da)
- Swedish (sv)
- German (de)
- Norwegian (no)
- Italian (it)
- French (fr)
- Arabic (ar)

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically

### Environment Variables

No environment variables required for basic setup.

## Content Management

Translation files are located in `/messages/` directory. Each language has its own JSON file.

To add new translations:
1. Edit the corresponding JSON file in `/messages/`
2. Follow the existing structure
3. Restart the dev server

## Future Integrations (Phase 2)

- Tournament booking system
- User accounts
- E-commerce (Padel gear)
- AI-powered training tracker
- Map of padel centers worldwide

## License

© 2025 Kaus Australis LTD. All rights reserved.


