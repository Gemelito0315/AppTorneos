'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, SupportedLocale } from '../lib/i18n';
import { useAuth } from '../lib/auth-context';
import { Trophy, Menu, X, Globe, User, LogOut, PlusCircle, LayoutDashboard, Users, Zap, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, locale, setLocale } = useTranslation();
  const { user, organization, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages: { code: SupportedLocale; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-billiard-darker/90 border-b border-billiard-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-billiard-felt to-billiard-green flex items-center justify-center border border-billiard-green/40 shadow-lg group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-billiard-gold" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                Billar<span className="text-billiard-green">Pro</span>
              </span>
              <span className="text-[10px] block text-billiard-muted -mt-1 font-mono uppercase tracking-widest">
                Tournament Engine
              </span>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Clubes</span>
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1.5 text-gray-300 hover:text-billiard-green transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <Link
                  href="/dashboard/players"
                  className="flex items-center space-x-1.5 text-gray-300 hover:text-billiard-green transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Jugadores</span>
                </Link>
                <Link
                  href="/dashboard/circuits"
                  className="flex items-center space-x-1.5 text-gray-300 hover:text-billiard-gold transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Circuitos</span>
                </Link>
                <Link
                  href="/dashboard/tournaments/new"
                  className="flex items-center space-x-1.5 text-billiard-gold hover:text-billiard-goldLight transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('nav.newTournament')}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Selector de Idioma y Auth Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Selector de idioma */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-billiard-card border border-billiard-border hover:border-billiard-green/50 text-xs text-gray-200 transition-colors"
                title="Cambiar idioma"
              >
                <Globe className="w-3.5 h-3.5 text-billiard-green" />
                <span className="uppercase font-semibold">{locale}</span>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-billiard-card border border-billiard-border shadow-xl py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-xs text-left transition-colors ${
                        locale === lang.code
                          ? 'bg-billiard-felt text-white font-semibold'
                          : 'text-gray-300 hover:bg-billiard-cardHover hover:text-white'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-billiard-border pl-4">
                <div className="text-right">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-billiard-green truncate max-w-[140px]">
                    {organization?.name || user.role}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-billiard-card transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-billiard-green hover:bg-emerald-400 text-billiard-darker transition-colors shadow-md shadow-emerald-900/30"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Botón Móvil */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-2 text-gray-300 hover:text-white"
            >
              <span className="uppercase text-xs font-bold">{locale}</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-billiard-border bg-billiard-darker/95 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-200"
          >
            Clubes
          </Link>

          {user ? (
            <>
              <div className="py-2 border-t border-billiard-border">
                <p className="text-xs text-billiard-muted">Conectado como:</p>
                <p className="text-sm font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-billiard-green">{organization?.name}</p>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-billiard-green"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href="/dashboard/players"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-200"
              >
                Jugadores
              </Link>
              <Link
                href="/dashboard/circuits"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-billiard-gold"
              >
                Circuitos
              </Link>
              <Link
                href="/dashboard/tournaments/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-billiard-gold"
              >
                {t('nav.newTournament')}
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left py-2 text-base font-medium text-red-400"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-billiard-border space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-medium text-gray-200 bg-billiard-card rounded-lg"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-semibold text-billiard-darker bg-billiard-green rounded-lg"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

          {/* Idiomas en móvil */}
          <div className="pt-3 border-t border-billiard-border flex justify-around">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  locale === lang.code
                    ? 'bg-billiard-green text-billiard-darker font-bold'
                    : 'text-gray-400'
                }`}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
