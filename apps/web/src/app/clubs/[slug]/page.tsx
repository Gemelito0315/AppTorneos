'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  Trophy,
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Building2,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Zap,
  Info,
  DollarSign,
  Clock,
} from 'lucide-react';

interface OrgTournament {
  id: string;
  name: string;
  description: string | null;
  venue: string;
  startDate: string;
  endDate: string | null;
  status: string;
  posterUrl: string | null;
  entryFee: number | null;
  maxParticipants: number;
  modality: { name: string; code: string } | null;
  circuit: { id: string; name: string } | null;
  _count: { registrations: number };
}

interface OrgInfo {
  name: string;
  slug: string;
  city: string | null;
}

export default function ClubDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [tournaments, setTournaments] = useState<OrgTournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ organization: OrgInfo; tournaments: OrgTournament[] }>(
        `/public/organizations/${slug}/tournaments`
      );
      setOrgInfo(data.organization);
      setTournaments(data.tournaments || []);
    } catch (err: any) {
      setError(err.message || 'Club no encontrado');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTournaments = tournaments.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      t.venue.toLowerCase().includes(query) ||
      t.modality?.name?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    REGISTRATION_OPEN: 'Inscripciones',
    IN_PROGRESS: 'En Juego',
    COMPLETED: 'Finalizado',
    CANCELLED: 'Cancelado',
  };

  const statusCounts = tournaments.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-8 w-48 bg-billiard-card rounded-lg animate-pulse" />
        <div className="h-20 bg-billiard-card rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-billiard-card border border-billiard-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-gray-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Club no encontrado</h2>
        <p className="text-gray-400 text-sm">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-billiard-card border border-billiard-border text-sm text-gray-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al directorio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center space-x-1 text-xs text-gray-400 hover:text-billiard-green transition mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Directorio de Clubes</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-billiard-felt to-emerald-900 border border-billiard-green/30 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-billiard-green" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{orgInfo?.name}</h1>
              {orgInfo?.city && (
                <p className="text-sm text-gray-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{orgInfo.city}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="self-start flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-billiard-card hover:bg-billiard-felt border border-billiard-border text-xs text-gray-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-4 text-center">
          <Trophy className="w-5 h-5 text-billiard-gold mx-auto mb-1" />
          <p className="text-xl font-black text-white">{tournaments.length}</p>
          <p className="text-xs text-gray-400">Torneos</p>
        </div>
        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-4 text-center">
          <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-black text-emerald-400">{statusCounts['IN_PROGRESS'] || 0}</p>
          <p className="text-xs text-gray-400">En Juego</p>
        </div>
        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-4 text-center">
          <Users className="w-5 h-5 text-sky-400 mx-auto mb-1" />
          <p className="text-xl font-black text-white">
            {tournaments.reduce((sum, t) => sum + t._count.registrations, 0)}
          </p>
          <p className="text-xs text-gray-400">Inscripciones</p>
        </div>
        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-4 text-center">
          <Calendar className="w-5 h-5 text-billiard-gold mx-auto mb-1" />
          <p className="text-xl font-black text-white">{statusCounts['COMPLETED'] || 0}</p>
          <p className="text-xs text-gray-400">Finalizados</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl bg-billiard-card border border-billiard-border">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar torneo por nombre, sede o modalidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-billiard-darker/70 border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-billiard-muted flex-shrink-0 hidden sm:block" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-billiard-green text-billiard-darker'
                : 'bg-billiard-darker/60 text-gray-300 hover:text-white border border-billiard-border'
            }`}
          >
            Todos ({tournaments.length})
          </button>
          {Object.entries(statusLabels).map(([key, label]) => {
            const count = statusCounts[key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === key
                    ? 'bg-billiard-green text-billiard-darker'
                    : 'bg-billiard-darker/60 text-gray-300 hover:text-white border border-billiard-border'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Listado de Torneos */}
      {filteredTournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-billiard-border p-12 text-center space-y-3 bg-billiard-card/40">
          <Trophy className="w-10 h-10 text-gray-500 mx-auto" />
          <p className="text-gray-400 text-sm">
            {searchQuery || statusFilter !== 'all'
              ? 'No se encontraron torneos con ese criterio.'
              : 'Este club aún no ha creado torneos públicos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}`}
              className="group rounded-2xl bg-billiard-card border border-billiard-border hover:border-billiard-green/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col"
            >
              {/* Poster / Header */}
              {tournament.posterUrl ? (
                <div className="h-36 overflow-hidden">
                  <img
                    src={tournament.posterUrl}
                    alt={tournament.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-billiard-felt via-emerald-900/60 to-billiard-darker flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-billiard-gold/10 via-transparent to-transparent" />
                  <Trophy className="w-10 h-10 text-billiard-gold/40 relative z-10" />
                </div>
              )}

              {/* Badge de estado */}
              <div className="px-5 -mt-3 relative z-10">
                <StatusBadge status={tournament.status} />
              </div>

              {/* Content */}
              <div className="p-5 pt-3 flex-1 flex flex-col space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-billiard-green transition-colors line-clamp-2 leading-snug">
                    {tournament.name}
                  </h3>
                  {tournament.modality && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-billiard-felt border border-billiard-border text-[10px] font-semibold text-emerald-300">
                      {tournament.modality.name}
                    </span>
                  )}
                </div>

                {tournament.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {tournament.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-gray-400 mt-auto">
                  <p className="flex items-center space-x-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{tournament.venue}</span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>{formatDate(tournament.startDate)}</span>
                  </p>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-billiard-border/60 mt-auto">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1 text-xs">
                      <Users className="w-3 h-3 text-billiard-green" />
                      <span className="font-bold text-white">{tournament._count.registrations}</span>
                      <span className="text-gray-500">/ {tournament.maxParticipants}</span>
                    </span>
                    {tournament.entryFee && tournament.entryFee > 0 ? (
                      <span className="flex items-center space-x-1 text-xs text-billiard-gold">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-bold">{tournament.entryFee.toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold">Gratis</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-billiard-green flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
