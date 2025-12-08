'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="w-full bg-[#080427] border-t border-white/10">
      <div className="container mx-auto px-5 md:px-20 py-16">
        {/* Main Footer Content */}
        <div className="max-w-[1280px] mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand Section */}
            <div className="max-w-[224px]">
              <Link href="/" className="flex items-center mb-4">
                <span className="text-2xl font-bold text-white">STRIKE</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                Cloud gaming platform for the next generation. Play any game, anywhere, instantly.
              </p>
            </div>

            {/* Links Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-white font-semibold mb-2">Company</h3>
              <Link
                href="/about"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('about')}
              </Link>
              <Link
                href="/careers"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('careers')}
              </Link>
              <Link
                href="/blog"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('blog')}
              </Link>
              <Link
                href="/support"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('support')}
              </Link>
            </div>

            {/* Legal Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-white font-semibold mb-2">Legal</h3>
              <Link
                href="/legal/terms"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('terms')}
              </Link>
              <Link
                href="/legal/privacy"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('privacy')}
              </Link>
              <Link
                href="/legal/cookies"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('cookies')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-[1280px] mx-auto pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">{t('copyright')}</p>
            <nav className="flex items-center gap-6">
              <Link
                href="/legal/terms"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('terms')}
              </Link>
              <Link
                href="/legal/privacy"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('privacy')}
              </Link>
              <Link
                href="/legal/cookies"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {t('cookies')}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
