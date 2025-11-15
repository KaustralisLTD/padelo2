'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function MerchandiseContent() {
  const t = useTranslations('Merchandise');
  const [showForm, setShowForm] = useState(false);

  const categories = [
    { key: 'apparel', icon: '👕' },
    { key: 'trophies', icon: '🏆' },
    { key: 'medals', icon: '🥇' },
    { key: 'accessories', icon: '🎒' },
    { key: 'promotional', icon: '📢' },
  ];

  const products = [
    {
      category: 'apparel',
      items: [
        { key: 'tShirts', name: t('products.tShirts'), description: t('products.tShirtsDesc') },
        { key: 'poloShirts', name: t('products.poloShirts'), description: t('products.poloShirtsDesc') },
        { key: 'hoodies', name: t('products.hoodies'), description: t('products.hoodiesDesc') },
        { key: 'shorts', name: t('products.shorts'), description: t('products.shortsDesc') },
        { key: 'caps', name: t('products.caps'), description: t('products.capsDesc') },
        { key: 'socks', name: t('products.socks'), description: t('products.socksDesc') },
      ],
    },
    {
      category: 'trophies',
      items: [
        { key: 'cups', name: t('products.cups'), description: t('products.cupsDesc') },
        { key: 'plaques', name: t('products.plaques'), description: t('products.plaquesDesc') },
        { key: 'figurines', name: t('products.figurines'), description: t('products.figurinesDesc') },
        { key: 'crystal', name: t('products.crystal'), description: t('products.crystalDesc') },
      ],
    },
    {
      category: 'medals',
      items: [
        { key: 'goldMedals', name: t('products.goldMedals'), description: t('products.goldMedalsDesc') },
        { key: 'silverMedals', name: t('products.silverMedals'), description: t('products.silverMedalsDesc') },
        { key: 'bronzeMedals', name: t('products.bronzeMedals'), description: t('products.bronzeMedalsDesc') },
        { key: 'participationMedals', name: t('products.participationMedals'), description: t('products.participationMedalsDesc') },
      ],
    },
    {
      category: 'accessories',
      items: [
        { key: 'bags', name: t('products.bags'), description: t('products.bagsDesc') },
        { key: 'waterBottles', name: t('products.waterBottles'), description: t('products.waterBottlesDesc') },
        { key: 'towels', name: t('products.towels'), description: t('products.towelsDesc') },
        { key: 'wristbands', name: t('products.wristbands'), description: t('products.wristbandsDesc') },
        { key: 'keychains', name: t('products.keychains'), description: t('products.keychainsDesc') },
      ],
    },
    {
      category: 'promotional',
      items: [
        { key: 'banners', name: t('products.banners'), description: t('products.bannersDesc') },
        { key: 'flags', name: t('products.flags'), description: t('products.flagsDesc') },
        { key: 'posters', name: t('products.posters'), description: t('products.postersDesc') },
        { key: 'stickers', name: t('products.stickers'), description: t('products.stickersDesc') },
        { key: 'badges', name: t('products.badges'), description: t('products.badgesDesc') },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-poppins font-bold mb-3 text-center text-text mt-8">
          {t('headline')}
        </h2>
        
        <p className="text-xl text-text-secondary font-poppins text-center mb-12">
          {t('subhead')}
        </p>

        <div className="mb-12">
          <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-8">
            {t('body')}
          </p>
        </div>

        {/* Product Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {categories.map((category) => (
            <div
              key={category.key}
              className="bg-background-secondary rounded-lg border border-border p-6 hover:border-primary transition-colors"
            >
              <div className="text-4xl mb-4 text-center">{category.icon}</div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text text-center">
                {t(`categories.${category.key}`)}
              </h3>
              <p className="text-text-secondary font-poppins text-sm text-center">
                {t(`categories.${category.key}Desc`)}
              </p>
            </div>
          ))}
        </div>

        {/* Products by Category */}
        <div className="space-y-12 mb-12">
          {products.map((productCategory) => (
            <div key={productCategory.category} className="bg-background-secondary rounded-lg border border-border p-6">
              <h3 className="text-2xl font-orbitron font-semibold mb-6 text-text flex items-center gap-3">
                <span className="text-3xl">
                  {categories.find(c => c.key === productCategory.category)?.icon}
                </span>
                {t(`categories.${productCategory.category}`)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productCategory.items.map((item) => (
                  <div
                    key={item.key}
                    className="bg-background rounded-lg border border-border/50 p-4 hover:border-primary transition-colors"
                  >
                    <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                      {item.name}
                    </h4>
                    <p className="text-sm text-text-secondary font-poppins">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Customization Section */}
        <div className="bg-gradient-primary/10 rounded-lg border border-primary/30 p-8 mb-12">
          <h3 className="text-2xl font-orbitron font-semibold mb-4 text-text text-center">
            {t('customization.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                {t('customization.logo')}
              </h4>
              <p className="text-text-secondary font-poppins text-sm">
                {t('customization.logoDesc')}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                {t('customization.colors')}
              </h4>
              <p className="text-text-secondary font-poppins text-sm">
                {t('customization.colorsDesc')}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                {t('customization.text')}
              </h4>
              <p className="text-text-secondary font-poppins text-sm">
                {t('customization.textDesc')}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                {t('customization.quantity')}
              </h4>
              <p className="text-text-secondary font-poppins text-sm">
                {t('customization.quantityDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Order Process */}
        <div className="mb-12">
          <h3 className="text-2xl font-orbitron font-semibold mb-6 text-text text-center">
            {t('orderProcess.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-orbitron font-bold text-primary">{step}</span>
                </div>
                <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                  {t(`orderProcess.step${step}Title`)}
                </h4>
                <p className="text-sm text-text-secondary font-poppins">
                  {t(`orderProcess.step${step}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-background-secondary rounded-lg border border-border p-8">
          <h3 className="text-2xl font-orbitron font-semibold mb-4 text-text text-center">
            {t('contact.title')}
          </h3>
          <p className="text-text-secondary font-poppins text-center mb-6">
            {t('contact.description')}
          </p>
          <ContactForm email="merchandise@padelo2.com" subject="Merchandise Inquiry" />
        </div>
      </div>
    </div>
  );
}

