'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { TournamentCard } from '../../components/TournamentCard';
import {
  Trophy,
  PlusCircle,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, organization, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [players, setPlayers] = useState<number>(0);
  const [circuits, setCircuits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tourneysData, playersData, circuitsData] = await Promise.all([
        apiRequest<any[]>('/tournaments'),
        apiRequest<any[]>('/players'),
        apiRequest<any[]>('/circuits'),
      ]);
      setTournaments(tourneysData || []);
      setPlayers((playersData || []).length);
      setCircuits((circuitsData || []).length);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del club');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchClubTournaments();
    }
  }, [authLoading, user, router, fetchClubTournaments]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('dashboard.confirmDelete'))) {
      return;
    }

    try {
      await apiRequest(`/tournaments/${id}`, { method: 'DELETE' });
      setTournaments((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error eliminando el torneo');
    }
  };

  if (authLoading || (!user && !error)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-billiard-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeTournaments = tournaments.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'REGISTRATION_OPEN',
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del Club */}
      <div className="rounded-3xl bg-gradient-to-r from-billiard-card via-billiard-cardHover to-billiard-felt/30 border border-billiard-border p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-billiard-felt border border-billiard-green/40 text-emerald-300">
            <Building2 className="w-3.5 h-3.5 text-billiard-gold" />
            <span>{organization?.name || 'Club Deportivo'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Administrador: <span className="font-semibold text-white">{user?.fullName}</span> • Ciudad:{' '}
            <span className="text-emerald-400">{organization?.city || 'No especificada'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/tournaments/new"
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('dashboard.createBtn')}</span>
          </Link>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-5">
          <p className="text-xs text-gray-400 font-medium">Torneos Creados</p>
          <p className="text-3xl font-black text-white mt-2">{tournaments.length}</p>
        </div>

        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-5">
          <p className="text-xs text-gray-400 font-medium">En Inscripción / En Juego</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">
            {activeTournaments.length}
          </p>
        </div>

        <div
          className="rounded-2xl bg-billiard-card border border-billiard-border p-5 cursor-pointer hover:border-billiard-green/40 transition"
          onClick={() => router.push('/dashboard/players')}
        >
          <p className="text-xs text-gray-400 font-medium flex items-center space-x-1">
            <Users className="w-3.5 h-3.5" /> <span>Jugadores</span>
          </p>
          <p className="text-3xl font-black text-billiard-green mt-2">{players}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
            <ArrowRight className="w-3 h-3" /> <span>Ver directorio</span>
          </p>
        </div>

        <div
          className="rounded-2xl bg-billiard-card border border-billiard-border p-5 cursor-pointer hover:border-billiard-gold/40 transition"
          onClick={() => router.push('/dashboard/circuits')}
        >
          <p className="text-xs text-gray-400 font-medium flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-billiard-gold" /> <span>Circuitos</span>
          </p>
          <p className="text-3xl font-black text-billiard-gold mt-2">{circuits}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
            <ArrowRight className="w-3 h-3" /> <span>Ver ligas</span>
          </p>
        </div>
      </div>

      {/* Sección Mis Torneos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-billiard-gold" />
            <span>{t('dashboard.myTournaments')}</span>
          </h2>

          <button
            onClick={fetchClubTournaments}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-billiard-card hover:bg-billiard-felt border border-billiard-border text-xs text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recargar</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-billiard-card border border-billiard-border animate-pulse p-6"
              />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-billiard-border p-12 text-center space-y-4 bg-billiard-card/30">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto" />
            <p className="text-gray-300 text-sm max-w-sm mx-auto">
              {t('dashboard.empty')}
            </p>
            <Link
              href="/dashboard/tournaments/new"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-billiard-green text-billiard-darker font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dashboard.createBtn')}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                isOwner={true}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
