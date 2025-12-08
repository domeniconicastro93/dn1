'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SUPPORTED_LOCALES,
  getLocaleName,
  type SupportedLocale,
} from '@strike/shared-i18n';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as SupportedLocale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocaleName = getLocaleName(currentLocale);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (locale: SupportedLocale) => {
    setIsOpen(false);
    // Use next-intl's router which handles locale switching automatically
    router.replace(pathname, { locale });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">{currentLocaleName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#080427] border border-white/20 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors ${
                  locale === currentLocale
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{getLocaleName(locale)}</span>
                  {locale === currentLocale && (
                    <span className="text-purple-400">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

