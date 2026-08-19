'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';
import { Menu, X, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface LandingNavbarProps {
  initialUser: any;
}

export function LandingNavbar({ initialUser }: LandingNavbarProps) {
  const { t } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'CHIEF_EDITOR':
        return '/chief-editor';
      case 'EDITOR':
        return '/editor';
      case 'GUEST_EDITOR':
        return '/guest-editor';
      case 'REVIEWER':
        return '/reviewer';
      case 'AUTHOR':
        return '/author';
      default:
        return '/';
    }
  };

  return (
    <>
      {/* Main Navbar Header */}
      <header className="h-20 bg-background border-b border-border sticky top-0 z-40 px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo.png"
            alt="IST Logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain shrink-0"
          />
          <span className="font-mono font-bold text-lg sm:text-xl text-primary tracking-tight">
            IST Online Journal
          </span>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-foreground/80">
          <Link href="/" className="hover:text-primary transition-colors">
            {t('landing.nav.home')}
          </Link>
          <a href="#about" className="hover:text-primary transition-colors">
            {t('landing.nav.about')}
          </a>
          <a href="#conferences" className="hover:text-primary transition-colors">
            {t('landing.nav.conferences')}
          </a>
          <a href="#archive" className="hover:text-primary transition-colors">
            {t('landing.nav.archive')}
          </a>
          <a href="#contact" className="hover:text-primary transition-colors">
            {t('landing.nav.contact')}
          </a>
        </nav>

        {/* Right Navigation Actions (Desktop Only) */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          
          {initialUser ? (
            <Link
              href={getDashboardUrl(initialUser.role)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-10 px-4 py-2 rounded-md flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>{t('common.dashboard')}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="border border-foreground bg-transparent hover:bg-muted text-foreground text-sm font-semibold h-10 px-4 py-2 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer"
              >
                <span>{t('landing.nav.signIn')}</span>
              </Link>
              <Link
                href="/register"
                className="bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold h-10 px-4 py-2 rounded-md flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <span>{t('landing.nav.signUp')}</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Open Button (Mobile/Tablet Only) */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-secondary transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Drawer (Backdrop & Content Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-72 max-w-xs bg-card h-full z-10 flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200 border-l border-border">
            {/* Drawer Header with Close Button */}
            <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="IST Logo"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
                <span className="font-mono font-bold text-sm text-primary uppercase">
                  IST Menu
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Vertical Navigation Links */}
            <nav className="flex flex-col gap-1 flex-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold text-foreground hover:bg-secondary/50 transition-all"
              >
                <span>{t('landing.nav.home')}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold text-foreground hover:bg-secondary/50 transition-all"
              >
                <span>{t('landing.nav.about')}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="#conferences"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold text-foreground hover:bg-secondary/50 transition-all"
              >
                <span>{t('landing.nav.conferences')}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="#archive"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold text-foreground hover:bg-secondary/50 transition-all"
              >
                <span>{t('landing.nav.archive')}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold text-foreground hover:bg-secondary/50 transition-all"
              >
                <span>{t('landing.nav.contact')}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </nav>

            {/* Bottom Actions Area */}
            <div className="border-t border-border pt-6 space-y-4">
              {/* Language Switcher and Theme Toggle Row */}
              <div className="flex items-center justify-between bg-secondary/30 p-2.5 rounded-xl border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground">Preferences</span>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>

              {/* Authentication Buttons (Stacked) */}
              <div className="flex flex-col gap-2">
                {initialUser ? (
                  <Link
                    href={getDashboardUrl(initialUser.role)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold h-11 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>{t('common.dashboard')}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full border border-foreground/30 bg-transparent hover:bg-secondary text-foreground text-sm font-bold h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span>{t('landing.nav.signIn')}</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold h-11 rounded-lg flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    >
                      <span>{t('landing.nav.signUp')}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
