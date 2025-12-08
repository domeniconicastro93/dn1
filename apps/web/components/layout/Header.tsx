'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Search, Share2, ShoppingCart, Mail } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useStrikeSession } from '@/hooks/useStrikeSession';

export function Header() {
  const t = useTranslations('nav');
  const { authenticated, user, loading, logout } = useStrikeSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080427]/95 backdrop-blur supports-[backdrop-filter]:bg-[#080427]/60">
      <div className="container mx-auto px-5 md:px-20">
        <div className="flex h-[102px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-white">STRIKE</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <div className="h-[29px] w-px bg-white/20" />
            <div className="flex items-center gap-8">
              <Link
                href="/games"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
              >
                {t('games')}
              </Link>
              <Link
                href="/live"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
              >
                {t('live')}
              </Link>
              <Link
                href="/clips"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
              >
                Reels
              </Link>
              <Link
                href="/community"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
              >
                Arena
              </Link>
            </div>
            <div className="h-[29px] w-px bg-white/20" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything you want..."
                className="pl-10 pr-4 py-2 w-[272px] bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="h-[29px] w-px bg-white/20" />

            {/* Share */}
            <button className="p-2 text-white hover:text-gray-300 transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
            <div className="h-[29px] w-px bg-white/20" />

            {/* Language Selector & User Profile */}
            <div className="flex items-center gap-6">
              {/* Language Selector */}
              <LanguageSwitcher />

              {/* User Profile (shown when authenticated) */}
              {authenticated && !loading && user && (
                <div className="relative">
                  <button
                    className="flex items-center gap-3 px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="w-[54px] h-[54px] rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt={userDisplayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">{userInitial}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{userDisplayName}</span>
                      {user.handle && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <span>@{user.handle}</span>
                        </div>
                      )}
                    </div>
                  </button>
                  {/* User Menu Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#080427] border border-white/20 rounded-lg shadow-lg z-50">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/wallet"
                        className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Wallet
                      </Link>
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-[29px] w-px bg-white/20" />

            {/* Auth Button (shown when not authenticated) */}
            {!authenticated && !loading && (
              <div className="relative">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-full border border-white/30 hover:bg-white/10 transition"
                >
                  Login / Register
                </Link>
              </div>
            )}

            {/* Cart */}
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors">
                <ShoppingCart className="w-6 h-6" />
                <span className="text-sm font-medium">10</span>
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
