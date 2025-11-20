'use client';

import { useTranslations } from 'next-intl';

export default function TermsContent() {
  const t = useTranslations('Terms');

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        
        <p className="text-sm text-text-secondary font-poppins text-center mb-12">
          {t('effectiveDate')}
        </p>

        <div className="prose prose-invert max-w-none space-y-8 text-text-secondary font-poppins">
          {/* General */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('general.title')}</h2>
            <p className="mb-4">{t('general.text1')}</p>
            <p className="mb-4">{t('general.text2')}</p>
            
            <div className="mb-4">
              <p className="mb-2">{t('general.definitions')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t('general.client')}</strong> {t('general.clientDesc')}</li>
                <li><strong>{t('general.padelo2')}</strong> {t('general.padelo2Desc')}</li>
                <li><strong>{t('general.representatives')}</strong> {t('general.representativesDesc')}</li>
                <li><strong>{t('general.party')}</strong> {t('general.partyDesc')}</li>
              </ul>
            </div>
            
            <p className="mb-4">{t('general.text3')}</p>
            <p className="mb-4">{t('general.text4')}</p>
            <p className="mb-4">{t('general.text5')}</p>
          </section>

          {/* Privacy Statement */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('privacy.title')}</h2>
            <p className="mb-4">{t('privacy.text1')}</p>
            <p className="mb-4">{t('privacy.text2')}</p>
          </section>

          {/* License to Use */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('license.title')}</h2>
            <p className="mb-4">{t('license.text1')}</p>
            <p className="mb-4">{t('license.text2')}</p>
            
            <p className="mb-2 font-semibold">{t('license.restrictions')}</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>{t('license.restriction1')}</li>
              <li>{t('license.restriction2')}</li>
              <li>{t('license.restriction3')}</li>
              <li>{t('license.restriction4')}</li>
              <li>{t('license.restriction5')}</li>
              <li>{t('license.restriction6')}</li>
            </ul>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('content.title')}</h2>
            <p className="mb-4">{t('content.text1')}</p>
            <p className="mb-4">{t('content.text2')}</p>
            <p className="mb-4">{t('content.text3')}</p>
          </section>

          {/* Payment and Billing */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('payment.title')}</h2>
            <p className="mb-4">{t('payment.text1')}</p>
            <p className="mb-4">{t('payment.text2')}</p>
            <p className="mb-4">{t('payment.text3')}</p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('ip.title')}</h2>
            <p className="mb-4">{t('ip.text1')}</p>
            <p className="mb-4">{t('ip.text2')}</p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('termination.title')}</h2>
            <p className="mb-4">{t('termination.text1')}</p>
            <p className="mb-4">{t('termination.text2')}</p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('disclaimers.title')}</h2>
            <p className="mb-4">{t('disclaimers.text1')}</p>
            <p className="mb-4">{t('disclaimers.text2')}</p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('liability.title')}</h2>
            <p className="mb-4">{t('liability.text1')}</p>
            <p className="mb-4">{t('liability.text2')}</p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('indemnification.title')}</h2>
            <p className="mb-4">{t('indemnification.text1')}</p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('dispute.title')}</h2>
            <p className="mb-4">{t('dispute.text1')}</p>
            <p className="mb-4">{t('dispute.text2')}</p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('changes.title')}</h2>
            <p className="mb-4">{t('changes.text1')}</p>
            <p className="mb-4">{t('changes.text2')}</p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-orbitron font-semibold text-text mb-4">{t('contact.title')}</h2>
            <p className="mb-4">
              {t('contact.text1')}{' '}
              <a href="mailto:contact@padelo2.com" className="text-primary hover:underline">
                contact@padelo2.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

