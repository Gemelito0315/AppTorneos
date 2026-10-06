'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n';
import { apiRequest } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  Trophy,
  Calendar,
  MapPin,
  Building2,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
  ShieldCheck,
  CheckCircle,
  Users,
  Flame,
  Activity,
  RefreshCw,
  Search,
  Award,
  Medal,
  Clock,
  Radio,
  CheckCircle2,
  XCircle,
  GitBranch,
  Settings,
  UserPlus,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { TournamentBracket } from '../../../components/TournamentBracket';

export default function PublicTournamentPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const params = useParams();
  const id = params?.id as string;

  const [tournament, setTournament] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Pestañas: 'groups' (Fase de grupos y posiciones), 'bracket' (Cuadro eliminatorio), 'players' (Inscritos), 'podium' (Resultados), 'info' (Detalles)
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket' | 'players' | 'podium' | 'info'>('groups');

  // Atleta seleccionado para ver su ficha técnica
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [athleteFilter, setAthleteFilter] = useState<'all' | 'won' | 'draw' | 'lost' | 'pending'>('all');

  // Filtros de búsqueda
  const [playerSearch, setPlayerSearch] = useState<string>('');

  const fetchPublicTournament = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const data = await apiRequest<any>(`/tournaments/public/${id}`);
      setTournament(data);
    } catch (err: any) {
      setError(err.message || 'Torneo no encontrado o no disponible');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPublicTournament();
  }, [fetchPublicTournament]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-billiard-green border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Cargando datos del torneo...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Torneo No Encontrado</h1>
        <p className="text-sm text-gray-400">{error}</p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-billiard-card hover:bg-billiard-cardHover text-gray-200 border border-billiard-border text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('tournaments.backToList')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const registrations = tournament.registrations || [];
  const matches = tournament.matches || [];
  const results = tournament.results || [];

  const isOwner = Boolean(
    user && tournament && (
      user.organizationId === tournament.organizationId ||
      user.organizationId === tournament.organization?.id ||
      user.role === 'SUPERADMIN' ||
      user.role === 'ADMIN_CLUB'
    )
  );

  // Fase de Grupos y Eliminatoria
  const groupMatches = matches.filter((m: any) => m.roundName?.toLowerCase().startsWith('grupo'));
  const knockoutMatches = matches.filter((m: any) => !m.roundName?.toLowerCase().startsWith('grupo'));

  const groupNamesSet = new Set<string>();
  groupMatches.forEach((m: any) => groupNamesSet.add(m.roundName));
  const groupNames = Array.from(groupNamesSet).sort();

  // Tablas de posiciones de cada grupo con los 2 mejores clasificados
  const groupStandings: Record<string, any[]> = {};
  groupNames.forEach((grpName) => {
    const gMatches = groupMatches.filter((m: any) => m.roundName === grpName);
    const playerStats: Record<string, any> = {};

    gMatches.forEach((m: any) => {
      if (m.player1Id && !playerStats[m.player1Id]) {
        playerStats[m.player1Id] = {
          playerId: m.player1Id,
          name: m.player1Name || 'Jugador',
          photo: m.player1Photo,
          played: 0, won: 0, drawn: 0, lost: 0, caroms: 0, innings: 0, highRun: 0, points: 0,
        };
      }
      if (m.player2Id && !playerStats[m.player2Id]) {
        playerStats[m.player2Id] = {
          playerId: m.player2Id,
          name: m.player2Name || 'Jugador',
          photo: m.player2Photo,
          played: 0, won: 0, drawn: 0, lost: 0, caroms: 0, innings: 0, highRun: 0, points: 0,
        };
      }
    });

    gMatches.forEach((m: any) => {
      if (m.status === 'FINISHED' && m.player1Id && m.player2Id) {
        const s1 = playerStats[m.player1Id];
        const s2 = playerStats[m.player2Id];
        if (s1 && s2) {
          s1.played++; s2.played++;
          s1.caroms += m.player1Score || 0;
          s2.caroms += m.player2Score || 0;
          s1.innings += m.player1Innings || m.totalInnings || 0;
          s2.innings += m.player2Innings || m.totalInnings || 0;
          s1.highRun = Math.max(s1.highRun, m.player1HighRun || 0);
          s2.highRun = Math.max(s2.highRun, m.player2HighRun || 0);

          if (m.winnerId === m.player1Id || m.player1Score > m.player2Score) {
            s1.won++; s1.points += 2; s2.lost++;
          } else if (m.winnerId === m.player2Id || m.player2Score > m.player1Score) {
            s2.won++; s2.points += 2; s1.lost++;
          } else {
            s1.drawn++; s2.drawn++; s1.points += 1; s2.points += 1;
          }
        }
      }
    });

    const sorted = Object.values(playerStats).map((p: any) => {
      const avg = p.innings > 0 ? Number((p.caroms / p.innings).toFixed(3)) : 0.0;
      return { ...p, average: avg };
    }).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.average !== a.average) return b.average - a.average;
      if (b.highRun !== a.highRun) return b.highRun - a.highRun;
      return b.caroms - a.caroms;
    });

    groupStandings[grpName] = sorted.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      isQualified: idx < 2, // Pasan los 2 mejores de cada grupo
    }));
  });

  // Filtrado de jugadores
  const filteredPlayers = registrations.filter((reg: any) => {
    const q = playerSearch.toLowerCase().trim();
    if (!q) return true;
    const name = reg.player?.fullName?.toLowerCase() || '';
    const nick = reg.player?.nickname?.toLowerCase() || '';
    return name.includes(q) || nick.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Barra Superior de Navegación y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('tournaments.backToList')}</span>
        </Link>

        <div className="flex items-center flex-wrap gap-2">
          {isOwner && (
            <Link
              href={`/dashboard/tournaments/${id}`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/50 text-xs font-bold transition-all shadow-sm hover:scale-105"
              title="Panel de Administración del Torneo"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gestionar Torneo (Inscribir / Partidas)</span>
            </Link>
          )}

          {/* Actualizar */}
          <button
            onClick={() => fetchPublicTournament(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-billiard-card hover:bg-billiard-felt border border-billiard-border text-xs text-gray-300 transition-colors"
            title="Refrescar datos del torneo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-billiard-green' : 'text-gray-400'}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-billiard-card hover:bg-billiard-felt border border-billiard-border text-xs text-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-billiard-green" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-billiard-gold" />
                <span>Compartir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero del Torneo */}
      <div className="rounded-3xl bg-gradient-to-b from-billiard-card via-billiard-dark to-billiard-darker border border-billiard-border p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-billiard-green/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-billiard-felt text-emerald-300 border border-billiard-green/40 shadow-sm">
                🎱 {tournament.modality?.name || 'Billar'}
              </span>
              <StatusBadge status={tournament.status} />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {tournament.name}
            </h1>

            {tournament.description && (
              <p className="text-sm text-gray-300 leading-relaxed">
                {tournament.description}
              </p>
            )}
          </div>

          {/* Tarjeta rápida de Sede & Club */}
          <div className="rounded-2xl bg-billiard-darker/80 border border-billiard-border/80 p-4 min-w-[240px] space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-gray-400">
              <Building2 className="w-4 h-4 text-billiard-green flex-shrink-0" />
              <span className="text-white font-semibold">{tournament.organization?.name || 'Club'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{tournament.venue}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Calendar className="w-4 h-4 text-billiard-gold flex-shrink-0" />
              <span>{formatDate(tournament.startDate)}</span>
            </div>
          </div>
        </div>

        {/* Parámetros de Juego Oficiales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-billiard-border/60">
          <div className="rounded-xl bg-billiard-card/60 border border-billiard-border/60 p-3">
            <span className="text-[11px] text-gray-400 block">Atletas Inscritos</span>
            <span className="text-xl font-black text-white mt-0.5 block">{registrations.length}</span>
          </div>

          <div className="rounded-xl bg-billiard-card/60 border border-billiard-border/60 p-3">
            <span className="text-[11px] text-gray-400 block">Distancia de Juego</span>
            <span className="text-xl font-black text-billiard-gold mt-0.5 block">
              {tournament.caromsTarget ? `${tournament.caromsTarget} Carambolas` : 'Libre'}
            </span>
          </div>

          <div className="rounded-xl bg-billiard-card/60 border border-billiard-border/60 p-3">
            <span className="text-[11px] text-gray-400 block">Límite de Entradas</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {tournament.inningsLimit ? `${tournament.inningsLimit} Entradas` : 'Sin límite'}
            </span>
          </div>

          <div className="rounded-xl bg-billiard-card/60 border border-billiard-border/60 p-3">
            <span className="text-[11px] text-gray-400 block">Total de Partidas</span>
            <span className="text-xl font-black text-white mt-0.5 block">{matches.length}</span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de Navegación */}
      <div className="flex items-center space-x-2 border-b border-billiard-border/70 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'groups'
              ? 'bg-billiard-green text-billiard-darker shadow-lg shadow-emerald-950/40'
              : 'text-gray-400 hover:text-white hover:bg-billiard-card'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Fase de Grupos ({groupNames.length} Grupos)</span>
        </button>

        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'bracket'
              ? 'bg-billiard-green text-billiard-darker shadow-lg shadow-emerald-950/40'
              : 'text-gray-400 hover:text-white hover:bg-billiard-card'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Cuadro Eliminatorio</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'players'
              ? 'bg-billiard-green text-billiard-darker shadow-lg shadow-emerald-950/40'
              : 'text-gray-400 hover:text-white hover:bg-billiard-card'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Jugadores Inscritos ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('podium')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'podium'
              ? 'bg-billiard-green text-billiard-darker shadow-lg shadow-emerald-950/40'
              : 'text-gray-400 hover:text-white hover:bg-billiard-card'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Podio y Resultados</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'info'
              ? 'bg-billiard-green text-billiard-darker shadow-lg shadow-emerald-950/40'
              : 'text-gray-400 hover:text-white hover:bg-billiard-card'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Información & Sede</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: FASE DE GRUPOS OFICIAL (TABLAS Y PARTIDAS)     */}
      {/* ======================================================== */}
      {activeTab === 'groups' && (
        <div className="space-y-8">
          {groupNames.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-billiard-border p-12 text-center bg-billiard-card/30 space-y-3">
              <LayoutGrid className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Fase de grupos pendiente de sorteo</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                El organizador del torneo realizará el sorteo y la publicación de grupos en breve.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupNames.map((grpName) => {
                const standings = groupStandings[grpName] || [];
                const gMatches = groupMatches.filter((m: any) => m.roundName === grpName);

                return (
                  <div
                    key={grpName}
                    className="rounded-3xl bg-billiard-card border border-billiard-border p-5 sm:p-6 space-y-5 shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Cabecera del Grupo */}
                      <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-black text-sm">
                            🎱
                          </span>
                          <div>
                            <h4 className="text-base font-black text-white">{grpName}</h4>
                            <span className="text-[11px] text-gray-400">{standings.length} Atletas</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                          Clasifican los 2 mejores
                        </span>
                      </div>

                      {/* TABLA OFICIAL DE POSICIONES */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-billiard-border/60 text-[10px] text-gray-400 uppercase tracking-wider">
                              <th className="pb-2 pl-1 font-bold">Pos</th>
                              <th className="pb-2 font-bold">Atleta</th>
                              <th className="pb-2 text-center font-bold">PJ</th>
                              <th className="pb-2 text-center font-bold">PG</th>
                              <th className="pb-2 text-center font-bold">PE</th>
                              <th className="pb-2 text-center font-bold">PP</th>
                              <th className="pb-2 text-center font-bold">Caramb.</th>
                              <th className="pb-2 text-center font-bold">Ent.</th>
                              <th className="pb-2 text-center font-bold text-emerald-300">Prom.</th>
                              <th className="pb-2 text-center font-bold text-billiard-gold">Serie</th>
                              <th className="pb-2 text-right pr-1 font-black text-white">PTS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-billiard-border/40 font-medium">
                            {standings.map((row: any) => (
                              <tr
                                key={row.playerId}
                                className={`transition ${
                                  row.isQualified
                                    ? 'bg-emerald-950/25'
                                    : 'hover:bg-billiard-darker/40'
                                }`}
                              >
                                <td className="py-2.5 pl-1">
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${
                                      row.rank === 1
                                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                        : row.rank === 2
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-billiard-darker text-gray-500'
                                    }`}
                                  >
                                    {row.rank}
                                  </span>
                                </td>

                                <td className="py-2.5">
                                  <div className="min-w-[120px]">
                                    <p className="font-bold text-white text-xs truncate">{row.name}</p>
                                    {row.isQualified && (
                                      <span className="text-[9px] text-emerald-400 font-extrabold block">
                                        ✓ Clasificado
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-2.5 text-center text-gray-300">{row.played}</td>
                                <td className="py-2.5 text-center text-emerald-400 font-bold">{row.won}</td>
                                <td className="py-2.5 text-center text-gray-400">{row.drawn}</td>
                                <td className="py-2.5 text-center text-red-400 font-bold">{row.lost}</td>
                                <td className="py-2.5 text-center text-white font-bold">{row.caroms}</td>
                                <td className="py-2.5 text-center text-gray-400">{row.innings}</td>
                                <td className="py-2.5 text-center text-emerald-300 font-mono font-bold">
                                  {row.average.toFixed(3)}
                                </td>
                                <td className="py-2.5 text-center text-billiard-gold font-bold">
                                  {row.highRun}
                                </td>
                                <td className="py-2.5 text-right pr-1 font-black text-white text-sm">
                                  {row.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* PARTIDAS DE ESTE GRUPO */}
                      <div className="space-y-2.5 pt-3 border-t border-billiard-border/60">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                          Partidas ({gMatches.length})
                        </span>

                        <div className="space-y-2">
                          {gMatches.map((m: any) => {
                            const isFinished = m.status === 'FINISHED';
                            const p1Won = m.winnerId === m.player1Id;
                            const p2Won = m.winnerId === m.player2Id;

                            return (
                              <div
                                key={m.id}
                                className="p-3 rounded-2xl bg-billiard-darker/60 border border-billiard-border flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                                    <span>Match #{m.matchNumber}</span>
                                    {m.tableNumber && <span>· Mesa {m.tableNumber}</span>}
                                    {isFinished ? (
                                      <span className="text-emerald-400 font-bold">✓ Finalizada</span>
                                    ) : (
                                      <span className="text-gray-400">⏳ Programada</span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <span className={`truncate ${p1Won ? 'font-bold text-emerald-300' : 'text-gray-200'}`}>
                                      {m.player1Name || 'J1'} {isFinished && `(${m.player1Score})`}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold">vs</span>
                                    <span className={`truncate ${p2Won ? 'font-bold text-emerald-300' : 'text-gray-200'}`}>
                                      {m.player2Name || 'J2'} {isFinished && `(${m.player2Score})`}
                                    </span>
                                  </div>
                                </div>

                                {isFinished && (
                                  <div className="text-right text-[11px] text-gray-400 flex-shrink-0">
                                    <span>{m.totalInnings || m.player1Innings} Entradas</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
 
      {/* ======================================================== */}
      {/* PESTAÑA: CUADRO ELIMINATORIO / BRACKET                    */}
      {/* ======================================================== */}
      {activeTab === 'bracket' && (
        <div className="space-y-6">
          <TournamentBracket
            matches={matches}
            caromsTarget={tournament?.caromsTarget}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: LISTA DE JUGADORES / PERFIL DE ATLETA         */}
      {/* ======================================================== */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {selectedPlayer ? (
            /* =================================================== */
            /* VISTA DE PERFIL DE ATLETA (ESTILO CREATEVENTO)     */
            /* =================================================== */
            (() => {
              // Calcular estadísticas de este atleta en el torneo
              const athleteMatches = matches.filter(
                (m: any) => m.player1Id === selectedPlayer.id || m.player2Id === selectedPlayer.id,
              );

              let caroms = 0;
              let innings = 0;
              let won = 0;
              let lost = 0;
              let draw = 0;
              let pending = 0;

              athleteMatches.forEach((m: any) => {
                const isP1 = m.player1Id === selectedPlayer.id;
                const myScore = isP1 ? m.player1Score : m.player2Score;
                const myInnings = isP1 ? m.player1Innings : m.player2Innings;
                const oppScore = isP1 ? m.player2Score : m.player1Score;

                caroms += myScore || 0;
                innings += myInnings || 0;

                if (m.status === 'FINISHED') {
                  if (m.winnerId === selectedPlayer.id) won++;
                  else if (m.winnerId && m.winnerId !== selectedPlayer.id) lost++;
                  else if (myScore === oppScore) draw++;
                  else lost++;
                } else {
                  pending++;
                }
              });

              // Estadísticas reales del atleta en el torneo
              const totalCaroms = caroms;
              const totalInnings = innings;
              const generalAverage = totalInnings > 0
                ? (totalCaroms / totalInnings).toFixed(3)
                : (selectedPlayer.baseAverage ? Number(selectedPlayer.baseAverage).toFixed(3) : '0.000');
              const tournamentResult = results.find((r: any) => r.playerId === selectedPlayer.id);

              const filteredAthleteMatches = athleteMatches.filter((m: any) => {
                const isP1 = m.player1Id === selectedPlayer.id;
                const myScore = isP1 ? m.player1Score : m.player2Score;
                const oppScore = isP1 ? m.player2Score : m.player1Score;
                const isWinner = m.winnerId === selectedPlayer.id;
                const isLoser = m.winnerId && m.winnerId !== selectedPlayer.id;

                if (athleteFilter === 'won') return isWinner;
                if (athleteFilter === 'lost') return isLoser;
                if (athleteFilter === 'draw') return m.status === 'FINISHED' && !isWinner && !isLoser && myScore === oppScore;
                if (athleteFilter === 'pending') return m.status !== 'FINISHED';
                return true;
              });

              return (
                <div className="space-y-6 animate-fadeIn">
                  {/* Botón Volver */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-billiard-card hover:bg-billiard-felt border border-billiard-border text-xs text-gray-300 hover:text-white transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver al listado de jugadores</span>
                    </button>

                    <span className="text-xs text-gray-400 font-medium">
                      Ficha Oficial de Competidor
                    </span>
                  </div>

                  {/* 1. Tarjeta Principal del Atleta (Diseño Cabecera con Foto) */}
                  <div className="rounded-3xl bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 border border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Banner mini evento oficial */}
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-10 rounded-lg bg-emerald-900 border border-emerald-700 flex items-center justify-center text-xs font-black text-emerald-300">
                          🎱 PRO
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                            EVENTO OFICIAL
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {tournament.name}
                          </span>
                        </div>
                      </div>

                      {/* Logo BillarPro */}
                      <div className="text-right hidden sm:block">
                        <span className="text-base font-black tracking-tight text-blue-600">
                          Billar<span className="text-emerald-600">Pro</span>
                        </span>
                      </div>
                    </div>

                    {/* Foto central y Nombre */}
                    <div className="flex flex-col items-center justify-center text-center -mt-2 sm:-mt-4 space-y-3">
                      <div className="relative">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-200 flex items-center justify-center">
                          {/* Avatar estilizado con foto o iniciales */}
                          {selectedPlayer.photoUrl ? (
                            <img
                              src={selectedPlayer.photoUrl}
                              alt={selectedPlayer.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center text-white text-3xl font-black">
                              {selectedPlayer.fullName
                                .split(' ')
                                .map((n: string) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                          {selectedPlayer.fullName}
                        </h2>
                        {selectedPlayer.nickname && (
                          <p className="text-sm font-semibold text-amber-600">
                            "{selectedPlayer.nickname}"
                          </p>
                        )}
                      </div>

                      {/* Badges / Etiquetas inferiores */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <span>🏷️</span> <span>{tournament.modality?.name || '3 Bandas'}</span>
                        </span>

                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                          <span>🛡️</span> <span>{tournament.organization?.city || 'Medellín'}</span>
                        </span>

                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold">
                          <span>🎂</span> <span>Hándicap {selectedPlayer.handicap ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Información General (Métricas) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-white flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span>Información General</span>
                    </h3>

                    <div className="rounded-3xl bg-white text-slate-900 border border-slate-200 p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      {/* Posición */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          POSICIÓN
                        </span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-3xl font-black text-slate-900">
                            {tournamentResult
                              ? `#${tournamentResult.position}`
                              : athleteMatches.length > 0
                              ? (won > 0 ? (lost === 0 ? '#1' : '#2') : '#-')
                              : '-'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {tournamentResult ? 'Oficial en podio' : (athleteMatches.length > 0 ? 'En disputa' : 'Inscrito')}
                        </span>
                      </div>

                      {/* Promedio General */}
                      <div className="space-y-1 md:border-l md:border-slate-200 md:pl-6">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          PROMEDIO GENERAL
                        </span>
                        <div className="text-3xl font-black text-blue-600">
                          {generalAverage}
                        </div>
                        <span className="text-xs text-slate-500">Carambolas / Entradas</span>
                      </div>

                      {/* Cajas de Carambolas y Entradas */}
                      <div className="grid grid-cols-2 gap-3 md:border-l md:border-slate-200 md:pl-6">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-2xl font-black text-slate-900 block">{totalCaroms}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                            CARAMBOLAS
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-2xl font-black text-slate-900 block">{totalInnings}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                            ENTRADAS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Resumen de Partidas */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-white flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Resumen de Partidas</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Ganadas */}
                      <div className="p-4 rounded-2xl bg-white border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                          ✓
                        </div>
                        <div>
                          <span className="text-lg font-black text-slate-900 leading-none block">{won}</span>
                          <span className="text-[11px] font-semibold text-slate-500">Ganadas</span>
                        </div>
                      </div>

                      {/* Empatadas */}
                      <div className="p-4 rounded-2xl bg-white border-l-4 border-l-amber-500 border border-slate-200 shadow-sm flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                          =
                        </div>
                        <div>
                          <span className="text-lg font-black text-slate-900 leading-none block">{draw}</span>
                          <span className="text-[11px] font-semibold text-slate-500">Empatadas</span>
                        </div>
                      </div>

                      {/* Perdidas */}
                      <div className="p-4 rounded-2xl bg-white border-l-4 border-l-red-500 border border-slate-200 shadow-sm flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                          ✕
                        </div>
                        <div>
                          <span className="text-lg font-black text-slate-900 leading-none block">{lost}</span>
                          <span className="text-[11px] font-semibold text-slate-500">Perdidas</span>
                        </div>
                      </div>

                      {/* Pendientes */}
                      <div className="p-4 rounded-2xl bg-white border-l-4 border-l-blue-400 border border-slate-200 shadow-sm flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          ⏱
                        </div>
                        <div>
                          <span className="text-lg font-black text-slate-900 leading-none block">{pending}</span>
                          <span className="text-[11px] font-semibold text-slate-500">Pendientes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Listado de Partidas de este Atleta */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-white flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Listado de Partidas</span>
                      </h3>

                      {/* Pills de Filtrado */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <button
                          onClick={() => setAthleteFilter('all')}
                          className={`px-3 py-1.5 rounded-full font-bold transition ${
                            athleteFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-billiard-card text-gray-400 hover:text-white border border-billiard-border'
                          }`}
                        >
                          Todas ({athleteMatches.length})
                        </button>

                        <button
                          onClick={() => setAthleteFilter('won')}
                          className={`px-3 py-1.5 rounded-full font-bold transition ${
                            athleteFilter === 'won'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-billiard-card text-gray-400 hover:text-white border border-billiard-border'
                          }`}
                        >
                          Ganadas ({won})
                        </button>

                        <button
                          onClick={() => setAthleteFilter('draw')}
                          className={`px-3 py-1.5 rounded-full font-bold transition ${
                            athleteFilter === 'draw'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-billiard-card text-gray-400 hover:text-white border border-billiard-border'
                          }`}
                        >
                          Empatadas ({draw})
                        </button>

                        <button
                          onClick={() => setAthleteFilter('lost')}
                          className={`px-3 py-1.5 rounded-full font-bold transition ${
                            athleteFilter === 'lost'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-billiard-card text-gray-400 hover:text-white border border-billiard-border'
                          }`}
                        >
                          Perdidas ({lost})
                        </button>

                        <button
                          onClick={() => setAthleteFilter('pending')}
                          className={`px-3 py-1.5 rounded-full font-bold transition ${
                            athleteFilter === 'pending'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-billiard-card text-gray-400 hover:text-white border border-billiard-border'
                          }`}
                        >
                          Pendientes ({pending})
                        </button>
                      </div>
                    </div>

                    {/* Lista de Partidas con el diseño exacto */}
                    {filteredAthleteMatches.length === 0 ? (
                      <div className="rounded-3xl bg-white text-slate-800 p-8 text-center space-y-2 border border-slate-200">
                        <p className="text-sm font-bold text-slate-600">No hay partidas en esta categoría.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredAthleteMatches.map((m: any) => {
                          const isP1 = m.player1Id === selectedPlayer.id;
                          const isWinner = m.winnerId === selectedPlayer.id;
                          const isLoser = m.winnerId && m.winnerId !== selectedPlayer.id;
                          const isLive = m.status === 'IN_PROGRESS';

                          const myName = isP1 ? m.player1Name : m.player2Name;
                          const myScore = isP1 ? m.player1Score : m.player2Score;
                          const myInnings = isP1 ? m.player1Innings : m.player2Innings;
                          const myAverage = isP1 ? m.player1Average : m.player2Average;

                          const oppName = isP1 ? m.player2Name : m.player1Name;
                          const oppScore = isP1 ? m.player2Score : m.player1Score;
                          const oppInnings = isP1 ? m.player2Innings : m.player1Innings;
                          const oppAverage = isP1 ? m.player2Average : m.player1Average;

                          return (
                            <div
                              key={m.id}
                              className={`rounded-3xl bg-white text-slate-900 border p-5 shadow-sm space-y-3 transition hover:shadow-md ${
                                isWinner
                                  ? 'border-l-4 border-l-emerald-500 border-slate-200'
                                  : isLoser
                                  ? 'border-l-4 border-l-red-500 border-slate-200'
                                  : 'border-l-4 border-l-blue-500 border-slate-200'
                              }`}
                            >
                              {/* Badges superiores de la partida */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                    <span>🟦</span> <span>{m.roundName || 'Partida'}</span>
                                  </span>

                                  {m.tableNumber && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                      <span>Mesa {m.tableNumber}</span>
                                    </span>
                                  )}

                                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px]">
                                    <span>🕒</span> <span>En Vivo / Oficial</span>
                                  </span>
                                </div>

                                {/* Encabezados de columnas */}
                                <div className="flex items-center space-x-5 text-[11px] font-extrabold text-slate-400">
                                  <span className="w-8 text-right">CAR</span>
                                  <span className="w-8 text-right">ENT</span>
                                  <span className="w-12 text-right">PROM</span>
                                </div>
                              </div>

                              {/* Fila del Atleta Seleccionado (con badge TÚ) */}
                              <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                                    {myName?.[0] || 'J'}
                                  </div>
                                  <span className="font-bold text-slate-900">{myName}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                                    TÚ
                                  </span>
                                </div>

                                <div className="flex items-center space-x-5 font-bold">
                                  <span className={`w-8 text-right font-black ${isWinner ? 'text-emerald-600 text-base' : 'text-slate-900'}`}>
                                    {myScore}
                                  </span>
                                  <span className="w-8 text-right text-slate-600">{myInnings || m.totalInnings || 0}</span>
                                  <span className="w-12 text-right text-slate-800">{myAverage?.toFixed(3) || '0.000'}</span>
                                </div>
                              </div>

                              {/* Fila del Rival */}
                              <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-t border-slate-100">
                                <div className="flex items-center space-x-3">
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                    {oppName?.[0] || 'R'}
                                  </div>
                                  <span className="font-semibold text-slate-700">{oppName || 'Por definir'}</span>
                                </div>

                                <div className="flex items-center space-x-5 font-bold">
                                  <span className={`w-8 text-right font-black ${isLoser ? 'text-emerald-600 text-base' : 'text-slate-700'}`}>
                                    {oppScore}
                                  </span>
                                  <span className="w-8 text-right text-slate-600">{oppInnings || m.totalInnings || 0}</span>
                                  <span className="w-12 text-right text-slate-800">{oppAverage?.toFixed(3) || '0.000'}</span>
                                </div>
                              </div>

                              {/* Pie de la Partida: Victoria / Derrota */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                                <div>
                                  {isWinner && (
                                    <span className="text-emerald-600 flex items-center space-x-1">
                                      <span>🏆</span> <span>Victoria</span>
                                    </span>
                                  )}
                                  {isLoser && (
                                    <span className="text-red-500 flex items-center space-x-1">
                                      <span>✕</span> <span>Derrota</span>
                                    </span>
                                  )}
                                  {isLive && (
                                    <span className="text-blue-600 flex items-center space-x-1 animate-pulse">
                                      <span>●</span> <span>En Juego</span>
                                    </span>
                                  )}
                                  {m.status === 'PENDING' && (
                                    <span className="text-slate-400">Programada</span>
                                  )}
                                </div>

                                <span className="text-[11px] text-slate-400 font-normal">
                                  📅 Match #{m.matchNumber}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* =================================================== */
            /* DIRECTORIO GENERAL DE JUGADORES                     */
            /* =================================================== */
            <>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-billiard-card border border-billiard-border">
                <div className="relative flex-grow max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar atleta por nombre o apodo..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-billiard-darker/70 border border-billiard-border rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-billiard-green" />
                    <span>Total atletas: <strong className="text-white">{filteredPlayers.length}</strong></span>
                  </div>

                  {isOwner && (
                    <Link
                      href={`/dashboard/tournaments/${id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker text-xs font-bold transition shadow-sm hover:scale-105"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Inscribir Jugadores</span>
                    </Link>
                  )}
                </div>
              </div>

              {filteredPlayers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-billiard-border p-10 text-center space-y-4 bg-billiard-card/30">
                  <div className="w-14 h-14 rounded-2xl bg-billiard-darker border border-billiard-border flex items-center justify-center mx-auto text-gray-400">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <p className="text-gray-200 font-bold text-base">No hay jugadores inscritos todavía</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {isOwner
                        ? 'Como administrador del torneo, puedes registrar a los atletas de tu club o dar de alta nuevos jugadores participantes.'
                        : 'Aún no se han registrado atletas en este torneo. Vuelve a consultar pronto.'}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <Link
                        href={`/dashboard/tournaments/${id}`}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-xs transition shadow-lg shadow-emerald-950/40 hover:scale-105"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Inscribir Jugadores al Torneo</span>
                      </Link>
                      <Link
                        href="/dashboard/players"
                        className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-billiard-darker hover:bg-billiard-felt border border-billiard-border text-gray-300 hover:text-white font-medium text-xs transition"
                      >
                        <Users className="w-4 h-4 text-billiard-green" />
                        <span>Ir al Directorio de Jugadores</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredPlayers.map((reg: any, idx: number) => {
                    const player = reg.player || {};
                    return (
                      <div
                        key={reg.id || idx}
                        onClick={() => setSelectedPlayer(player)}
                        className="group cursor-pointer rounded-2xl bg-billiard-card border border-billiard-border hover:border-billiard-green/60 p-4 transition-all duration-300 space-y-3 shadow-md hover:shadow-emerald-950/30 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-billiard-darker border border-billiard-border flex items-center justify-center text-[10px] font-black text-gray-400">
                            #{reg.seedNumber || idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                            Confirmado
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-billiard-darker border border-billiard-border flex items-center justify-center flex-shrink-0">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-billiard-green">
                                {player.fullName
                                  ? player.fullName
                                      .split(' ')
                                      .map((n: string) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()
                                  : 'J'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white group-hover:text-billiard-green transition-colors truncate">
                              {player.fullName || 'Jugador'}
                            </h4>
                            {player.nickname ? (
                              <p className="text-xs text-billiard-gold font-medium truncate">
                                "{player.nickname}"
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-500 truncate">
                                Atleta
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-billiard-border/60 text-[11px]">
                          <div>
                            <span className="text-gray-500 block">Hándicap</span>
                            <span className="font-bold text-gray-200">{reg.handicap ?? player.handicap ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Prom. Base</span>
                            <span className="font-bold text-emerald-400">{player.baseAverage ? player.baseAverage.toFixed(3) : '0.000'}</span>
                          </div>
                        </div>

                        <div className="pt-2 text-right">
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                            <span>Ver ficha y partidas</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: PODIO Y RESULTADOS OFICIALES                  */}
      {/* ======================================================== */}
      {activeTab === 'podium' && (
        <div className="space-y-6">
          {results.length > 0 ? (
            <div className="space-y-8">
              {/* Podio visual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {results.slice(0, 3).map((res: any) => {
                  const is1st = res.position === 1;
                  const is2nd = res.position === 2;
                  const is3rd = res.position === 3;

                  return (
                    <div
                      key={res.id}
                      className={`rounded-3xl border p-6 text-center space-y-3 shadow-xl ${
                        is1st
                          ? 'bg-gradient-to-b from-billiard-gold/20 via-billiard-card to-billiard-darker border-billiard-gold/50 order-first md:order-2 scale-105'
                          : is2nd
                          ? 'bg-billiard-card border-gray-400/40 order-2 md:order-1'
                          : 'bg-billiard-card border-amber-700/40 order-3'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner bg-billiard-darker border border-billiard-border">
                        {is1st ? '🥇' : is2nd ? '🥈' : '🥉'}
                      </div>
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                          {is1st ? 'Campeón 🏆' : is2nd ? 'Subcampeón' : 'Tercer Lugar'}
                        </span>
                        <h3 className="text-lg font-black text-white mt-1">
                          {res.player?.fullName}
                        </h3>
                        {res.player?.nickname && (
                          <p className="text-xs text-billiard-gold">"{res.player.nickname}"</p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-billiard-border/60 text-xs">
                        <span className="text-emerald-400 font-bold">+{res.pointsAwarded} Puntos</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla completa de resultados */}
              <div className="rounded-2xl bg-billiard-card border border-billiard-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-billiard-darker/60 text-gray-400 border-b border-billiard-border">
                    <tr>
                      <th className="p-3">Posición</th>
                      <th className="p-3">Atleta</th>
                      <th className="p-3">Puntos Otorgados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-billiard-border">
                    {results.map((res: any) => (
                      <tr key={res.id} className="hover:bg-billiard-felt/20">
                        <td className="p-3 font-bold text-white">#{res.position}</td>
                        <td className="p-3 text-white font-medium">{res.player?.fullName}</td>
                        <td className="p-3 text-emerald-400 font-bold">+{res.pointsAwarded} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-billiard-card border border-billiard-border p-12 text-center space-y-4 max-w-2xl mx-auto">
              <Trophy className="w-12 h-12 text-billiard-gold mx-auto" />
              <h3 className="text-lg font-bold text-white">Torneo en Disputa</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                El podio oficial y los puntos acumulativos de la liga se asignarán una vez concluida la Gran Final. Sigue las partidas en vivo en la pestaña de Partidas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: INFORMACIÓN Y CONTACTO DE SEDE                 */}
      {/* ======================================================== */}
      {activeTab === 'info' && (
        <div className="rounded-3xl bg-billiard-card border border-billiard-border p-6 sm:p-8 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-billiard-green" />
            <span>Detalles del Club y Organización</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border space-y-1">
              <span className="text-gray-400 block">Sede del Evento</span>
              <p className="text-sm font-bold text-white">{tournament.venue}</p>
            </div>

            <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border space-y-1">
              <span className="text-gray-400 block">Organización Anfitriona</span>
              <p className="text-sm font-bold text-white">{tournament.organization?.name} ({tournament.organization?.city || 'Colombia'})</p>
            </div>

            <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border space-y-1">
              <span className="text-gray-400 block">Fecha y Hora de Inicio</span>
              <p className="text-sm font-bold text-white capitalize">{formatDate(tournament.startDate)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border space-y-1">
              <span className="text-gray-400 block">Fecha y Hora de Clausura</span>
              <p className="text-sm font-bold text-white capitalize">{formatDate(tournament.endDate)}</p>
            </div>
          </div>

          {(tournament.contactPhone || tournament.contactEmail) && (
            <div className="pt-4 border-t border-billiard-border space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Contacto Directo</span>
              <div className="flex flex-wrap gap-3">
                {tournament.contactPhone && (
                  <a
                    href={`https://wa.me/${tournament.contactPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-billiard-felt hover:bg-emerald-900/60 border border-billiard-green/40 text-emerald-300 text-xs font-bold transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>WhatsApp: {tournament.contactPhone}</span>
                  </a>
                )}
                {tournament.contactEmail && (
                  <a
                    href={`mailto:${tournament.contactEmail}`}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-billiard-darker hover:bg-billiard-felt border border-billiard-border text-gray-300 text-xs font-medium transition"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{tournament.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
