'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n';
import { apiRequest } from '../lib/api';
import {
  Trophy,
  Search,
  Sparkles,
  RefreshCw,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Building2,
  Landmark,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  country: string;
  createdAt: string;
  _count: { tournaments: number; players: number };
}

export default function HomePage() {
  const { t } = useTranslation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Organization[]>('/public/organizations');
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error cargando clubes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      org.name.toLowerCase().includes(query) ||
      org.city?.toLowerCase().includes(query) ||
      org.description?.toLowerCase().includes(query)
    );
  });

  const countryFlags: Record<string, string> = {
    CO: '🇨🇴',
    MX: '🇲🇽',
    AR: '🇦🇷',
    BR: '🇧🇷',
    US: '🇺🇸',
    ES: '🇪🇸',
    EC: '🇪🇨',
    PE: '🇵🇪',
    CL: '🇨🇱',
    VE: '🇻🇪',
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-billiard-border/60 bg-gradient-to-b from-billiard-darker via-billiard-dark to-billiard-felt/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-billiard-felt border border-billiard-green/40 text-emerald-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-billiard-gold" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {t('hero.title')}
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Descubre los clubes de billar registrados en la plataforma, explora sus torneos y sigue los campeonatos en tiempo real.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#clubes"
              className="px-6 py-3 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all hover:scale-105"
            >
              🏢 Explorar Clubes
            </a>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-billiard-card hover:bg-billiard-cardHover text-gray-200 border border-billiard-border font-semibold text-sm transition-all hover:border-billiard-green/50"
            >
              {t('hero.ctaCreate')}
            </Link>
          </div>
        </div>
      </section>

      {/* Directorio de Clubes */}
      <section id="clubes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-billiard-green text-sm font-semibold mb-1">
              <Landmark className="w-4 h-4" />
              <span>Directorio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Clubes Registrados
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {organizations.length} {organizations.length === 1 ? 'club inscrito' : 'clubes inscritos'} en la plataforma
            </p>
          </div>

          <button
            onClick={fetchData}
            className="self-start md:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-billiard-card hover:bg-billiard-felt border border-billiard-border text-xs text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Barra de Búsqueda */}
        <div className="p-3 rounded-2xl bg-billiard-card border border-billiard-border">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar club por nombre o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-billiard-darker/70 border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
            />
          </div>
        </div>

        {/* Listado de Clubes */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-billiard-card border border-billiard-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-billiard-border p-12 text-center space-y-3 bg-billiard-card/40">
            <Building2 className="w-10 h-10 text-gray-500 mx-auto" />
            <p className="text-gray-400 text-sm">
              {searchQuery
                ? 'No se encontraron clubes con ese criterio de búsqueda.'
                : 'Aún no hay clubes registrados en la plataforma.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/clubs/${org.slug}`}
                className="group relative rounded-2xl bg-billiard-card border border-billiard-border hover:border-billiard-green/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-emerald-950/20"
              >
                {/* Header con gradiente */}
                <div className="relative h-24 bg-gradient-to-br from-billiard-felt via-emerald-900/80 to-billiard-darker flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800/30 via-transparent to-transparent" />
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-billiard-green/40 shadow-lg relative z-10 group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-billiard-darker/60 border-2 border-billiard-green/30 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-billiard-green" />
                    </div>
                  )}
                  {/* Badge de país */}
                  <div className="absolute top-3 right-3 text-lg z-10">
                    {countryFlags[org.country] || '🌐'}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-billiard-green transition-colors leading-tight">
                      {org.name}
                    </h3>
                    {org.city && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{org.city}, {org.country}</span>
                      </p>
                    )}
                  </div>

                  {org.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-4 pt-2 border-t border-billiard-border/60">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <Trophy className="w-3.5 h-3.5 text-billiard-gold" />
                      <span className="font-bold text-white">{org._count.tournaments}</span>
                      <span className="text-gray-500">torneos</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs">
                      <Users className="w-3.5 h-3.5 text-billiard-green" />
                      <span className="font-bold text-white">{org._count.players}</span>
                      <span className="text-gray-500">jugadores</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Desde {new Date(org.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })}</span>
                    </span>
                    <span className="text-xs font-semibold text-billiard-green flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver club</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
