'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../lib/auth-context';
import { apiRequest } from '../../../../lib/api';
import {
  Trophy, Users, ArrowLeft, PlusCircle, X, AlertCircle, CheckCircle,
  Play, Clock, Target, Award, Swords, Trash2, Edit2,
  Medal, Hash, ChevronDown, ChevronUp, Save, UserPlus, UserMinus,
  LayoutGrid, GitBranch, Shuffle, ShieldCheck, CheckCircle2,
  FileText, Sparkles, ChevronRight, HelpCircle, RefreshCw, UserCheck,
  Filter, Eye, Layers
} from 'lucide-react';
import { TournamentBracket } from '../../../../components/TournamentBracket';

// ─── Tipos ────────────────────────────────────────────────────
interface Player {
  id: string;
  fullName: string;
  nickname?: string | null;
  photoUrl?: string | null;
  handicap: number;
  baseAverage: number;
  isActive?: boolean;
}

interface Registration {
  id: string;
  playerId: string;
  seedNumber?: number | null;
  handicap: number;
  player: Player;
  status: string; // CONFIRMED, WITHDRAWN, PENDING
}

interface Match {
  id: string;
  roundName: string;
  matchNumber: number;
  tableNumber?: number | null;
  status: string; // PENDING, IN_PROGRESS, FINISHED
  player1Id?: string | null;
  player1Name?: string | null;
  player1Photo?: string | null;
  player1Score: number;
  player1Innings: number;
  player1HighRun: number;
  player1Average: number;
  player2Id?: string | null;
  player2Name?: string | null;
  player2Photo?: string | null;
  player2Score: number;
  player2Innings: number;
  player2HighRun: number;
  player2Average: number;
  totalInnings: number;
  winnerId?: string | null;
  winnerName?: string | null;
}

interface TournamentResult {
  id: string;
  position: number;
  pointsAwarded: number;
  playerId: string;
  player: Player;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  modality?: { name: string };
  circuit?: { name: string } | null;
  maxParticipants?: number | null;
  caromsTarget?: number | null;
  inningsLimit?: number | null;
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ name, photo, size = 'sm' }: { name: string; photo?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-sm' : size === 'md' ? 'w-9 h-9 text-xs' : 'w-7 h-7 text-[10px]';
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  if (photo) {
    return <img src={photo} alt={name} className={`${sz} rounded-full object-cover border border-billiard-green/30 flex-shrink-0`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-billiard-green/20 to-emerald-700/20 border border-billiard-green/30 flex items-center justify-center flex-shrink-0`}>
      <span className="font-black text-billiard-green">{initials}</span>
    </div>
  );
}

// ─── Badge de estado ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Borrador', cls: 'bg-gray-700 text-gray-300 border-gray-600' },
    OPEN: { label: 'Inscripciones', cls: 'bg-blue-900/50 text-blue-300 border-blue-700' },
    IN_PROGRESS: { label: 'En curso', cls: 'bg-billiard-green/20 text-billiard-green border-billiard-green/40' },
    FINISHED: { label: 'Finalizado', cls: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-red-900/30 text-red-400 border-red-700/40' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-700 text-gray-300 border-gray-600' };
  return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${s.cls}`}>{s.label}</span>;
}

// ─── Modal para Digitalizar Resultado (Acta de Partido) ───────
function DigitizeResultModal({
  match,
  tournamentId,
  caromsTarget,
  allMatches,
  onClose,
  onSave,
}: {
  match: Match;
  tournamentId: string;
  caromsTarget?: number | null;
  allMatches?: Match[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [p1Score, setP1Score] = useState<number>(match.player1Score || 0);
  const [p1Innings, setP1Innings] = useState<number>(match.player1Innings || match.totalInnings || 0);
  const [p1HighRun, setP1HighRun] = useState<number>(match.player1HighRun || 0);

  const [p2Score, setP2Score] = useState<number>(match.player2Score || 0);
  const [p2Innings, setP2Innings] = useState<number>(match.player2Innings || match.totalInnings || 0);
  const [p2HighRun, setP2HighRun] = useState<number>(match.player2HighRun || 0);

  const [tableNumber, setTableNumber] = useState<number>(match.tableNumber || 1);
  const [winnerId, setWinnerId] = useState<string>(match.winnerId || '');
  const [status, setStatus] = useState<string>(match.status === 'FINISHED' ? 'FINISHED' : 'FINISHED');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar ganador automáticamente si cambian los puntajes
  useEffect(() => {
    if (p1Score > p2Score && match.player1Id) {
      setWinnerId(match.player1Id);
    } else if (p2Score > p1Score && match.player2Id) {
      setWinnerId(match.player2Id);
    }
  }, [p1Score, p2Score, match.player1Id, match.player2Id]);

  const p1Avg = p1Innings > 0 ? (p1Score / p1Innings).toFixed(3) : '0.000';
  const p2Avg = p2Innings > 0 ? (p2Score / p2Innings).toFixed(3) : '0.000';
  const totalInnings = Math.max(p1Innings, p2Innings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const winnerName =
        winnerId === match.player1Id
          ? match.player1Name
          : winnerId === match.player2Id
          ? match.player2Name
          : null;

      const body = {
        roundName: match.roundName,
        matchNumber: match.matchNumber,
        tableNumber: Number(tableNumber) || null,
        status,
        player1Id: match.player1Id || null,
        player1Name: match.player1Name || null,
        player1Photo: match.player1Photo || null,
        player1Score: Number(p1Score),
        player1Innings: Number(p1Innings),
        player1HighRun: Number(p1HighRun),
        player2Id: match.player2Id || null,
        player2Name: match.player2Name || null,
        player2Photo: match.player2Photo || null,
        player2Score: Number(p2Score),
        player2Innings: Number(p2Innings),
        player2HighRun: Number(p2HighRun),
        totalInnings: Number(totalInnings),
        winnerId: winnerId || null,
        winnerName,
      };

      await apiRequest(`/tournaments/${tournamentId}/matches/${match.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      // ── Progresión automática de ganadores en el cuadro eliminatorio ──
      if (status === 'FINISHED' && winnerId && allMatches && allMatches.length > 0) {
        const round = match.roundName.toLowerCase();
        const winnerPhoto = winnerId === match.player1Id ? match.player1Photo : match.player2Photo;

        if (round.includes('semi')) {
          // Buscar la Gran Final
          const finalMatch = allMatches.find(
            (m) =>
              m.roundName.toLowerCase().includes('final') &&
              !m.roundName.toLowerCase().includes('semi') &&
              !m.roundName.toLowerCase().includes('cuart')
          );
          if (finalMatch) {
            const isSemi1 = round.includes('1') || match.matchNumber === 1 || !round.includes('2');
            const patchData = isSemi1
              ? { player1Id: winnerId, player1Name: winnerName, player1Photo: winnerPhoto }
              : { player2Id: winnerId, player2Name: winnerName, player2Photo: winnerPhoto };
            await apiRequest(`/tournaments/${tournamentId}/matches/${finalMatch.id}`, {
              method: 'PUT',
              body: JSON.stringify(patchData),
            });
          }
        } else if (round.includes('cuart')) {
          // Buscar Semifinales
          const semi1 = allMatches.find(
            (m) =>
              m.roundName.toLowerCase().includes('semi') &&
              (m.roundName.includes('1') || m.matchNumber === 1)
          );
          const semi2 = allMatches.find(
            (m) =>
              m.roundName.toLowerCase().includes('semi') &&
              (m.roundName.includes('2') || m.matchNumber === 2)
          );
          const isQ1 = round.includes('1');
          const isQ2 = round.includes('2');
          const isQ3 = round.includes('3');
          const isQ4 = round.includes('4');

          if (isQ1 && semi1) {
            await apiRequest(`/tournaments/${tournamentId}/matches/${semi1.id}`, {
              method: 'PUT',
              body: JSON.stringify({ player1Id: winnerId, player1Name: winnerName, player1Photo: winnerPhoto }),
            });
          } else if (isQ2 && semi1) {
            await apiRequest(`/tournaments/${tournamentId}/matches/${semi1.id}`, {
              method: 'PUT',
              body: JSON.stringify({ player2Id: winnerId, player2Name: winnerName, player2Photo: winnerPhoto }),
            });
          } else if (isQ3 && semi2) {
            await apiRequest(`/tournaments/${tournamentId}/matches/${semi2.id}`, {
              method: 'PUT',
              body: JSON.stringify({ player1Id: winnerId, player1Name: winnerName, player1Photo: winnerPhoto }),
            });
          } else if (isQ4 && semi2) {
            await apiRequest(`/tournaments/${tournamentId}/matches/${semi2.id}`, {
              method: 'PUT',
              body: JSON.stringify({ player2Id: winnerId, player2Name: winnerName, player2Photo: winnerPhoto }),
            });
          }
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar resultado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-billiard-green" />
              <span>Digitalizar Resultado de Partida</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {match.roundName} · Partida #{match.matchNumber} · {caromsTarget ? `Distancia: ${caromsTarget} carambolas` : 'Libre'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mesa y Estado */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Mesa de Juego</label>
              <input
                type="number"
                min={1}
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Estado de Partida</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green"
              >
                <option value="FINISHED">✅ Finalizada (Oficial)</option>
                <option value="PENDING">⏳ Pendiente</option>
              </select>
            </div>
          </div>

          {/* Comparativa Atletas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jugador 1 */}
            <div className={`p-4 rounded-2xl border transition-all ${
              winnerId === match.player1Id
                ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                : 'bg-billiard-darker/50 border-billiard-border'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar name={match.player1Name || 'J1'} photo={match.player1Photo} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-sm truncate">{match.player1Name || 'Jugador 1'}</p>
                  <p className="text-[10px] text-gray-400">Atleta 1</p>
                </div>
                {winnerId === match.player1Id && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Ganador
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Carambolas anotadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={p1Score}
                    onChange={(e) => setP1Score(Number(e.target.value))}
                    className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-base font-black text-white text-center focus:outline-none focus:border-billiard-green"
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Entradas</label>
                    <input
                      type="number"
                      min={0}
                      value={p1Innings}
                      onChange={(e) => setP1Innings(Number(e.target.value))}
                      className="w-full bg-billiard-card border border-billiard-border rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-billiard-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Mayor Serie</label>
                    <input
                      type="number"
                      min={0}
                      value={p1HighRun}
                      onChange={(e) => setP1HighRun(Number(e.target.value))}
                      className="w-full bg-billiard-card border border-billiard-border rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-billiard-green"
                    />
                  </div>
                </div>
                <div className="text-center pt-1 text-[11px] text-gray-400">
                  Promedio: <strong className="text-emerald-400">{p1Avg}</strong>
                </div>
              </div>
            </div>

            {/* Jugador 2 */}
            <div className={`p-4 rounded-2xl border transition-all ${
              winnerId === match.player2Id
                ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                : 'bg-billiard-darker/50 border-billiard-border'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar name={match.player2Name || 'J2'} photo={match.player2Photo} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-sm truncate">{match.player2Name || 'Jugador 2'}</p>
                  <p className="text-[10px] text-gray-400">Atleta 2</p>
                </div>
                {winnerId === match.player2Id && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Ganador
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Carambolas anotadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={p2Score}
                    onChange={(e) => setP2Score(Number(e.target.value))}
                    className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-base font-black text-white text-center focus:outline-none focus:border-billiard-green"
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Entradas</label>
                    <input
                      type="number"
                      min={0}
                      value={p2Innings}
                      onChange={(e) => setP2Innings(Number(e.target.value))}
                      className="w-full bg-billiard-card border border-billiard-border rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-billiard-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Mayor Serie</label>
                    <input
                      type="number"
                      min={0}
                      value={p2HighRun}
                      onChange={(e) => setP2HighRun(Number(e.target.value))}
                      className="w-full bg-billiard-card border border-billiard-border rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-billiard-green"
                    />
                  </div>
                </div>
                <div className="text-center pt-1 text-[11px] text-gray-400">
                  Promedio: <strong className="text-emerald-400">{p2Avg}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Selección Manual Ganador */}
          <div className="p-3 rounded-2xl bg-billiard-darker/40 border border-billiard-border/60 flex items-center justify-between text-xs">
            <span className="text-gray-400">Declarar Ganador:</span>
            <div className="flex gap-2">
              {match.player1Id && (
                <button
                  type="button"
                  onClick={() => setWinnerId(match.player1Id!)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                    winnerId === match.player1Id
                      ? 'bg-billiard-green text-billiard-darker'
                      : 'bg-billiard-card text-gray-300 hover:text-white border border-billiard-border'
                  }`}
                >
                  {match.player1Name || 'J1'}
                </button>
              )}
              {match.player2Id && (
                <button
                  type="button"
                  onClick={() => setWinnerId(match.player2Id!)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                    winnerId === match.player2Id
                      ? 'bg-billiard-green text-billiard-darker'
                      : 'bg-billiard-card text-gray-300 hover:text-white border border-billiard-border'
                  }`}
                >
                  {match.player2Name || 'J2'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setWinnerId('')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition text-xs ${
                  !winnerId ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-500'
                }`}
              >
                Empate / Sin definir
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Resultado Oficial'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal para Sorteo y Armado de Grupos ─────────────────────
function DrawGroupsModal({
  registrations,
  tournamentId,
  caromsTarget,
  onClose,
  onGenerated,
}: {
  registrations: Registration[];
  tournamentId: string;
  caromsTarget?: number | null;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const confirmedRegs = useMemo(
    () => registrations.filter((r) => r.status !== 'WITHDRAWN'),
    [registrations]
  );
  const count = confirmedRegs.length;

  const [groupSizePreference, setGroupSizePreference] = useState<'3' | '4' | 'auto'>('auto');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const calculated = useMemo(() => {
    if (count < 3) return { numGroups: 0, text: 'Mínimo 3 jugadores requeridos' };

    let targetSize = 3;
    if (groupSizePreference === '4') targetSize = 4;
    else if (groupSizePreference === '3') targetSize = 3;
    else {
      targetSize = count % 4 === 0 || count >= 8 ? 4 : 3;
    }

    const numGroups = Math.max(1, Math.round(count / targetSize));
    return {
      numGroups,
      text: `Se armarán ${numGroups} grupos (${count} atletas confirmados, clasifican 2 por grupo).`,
    };
  }, [count, groupSizePreference]);

  const handleGenerateDraw = async () => {
    if (count < 3) {
      setError('Debes tener al menos 3 atletas confirmados para realizar el sorteo.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // 1. Barajar aleatoriamente los inscritos confirmados
      const shuffled = [...confirmedRegs].sort(() => Math.random() - 0.5);

      // 2. Repartir en grupos (A, B, C...)
      const numGroups = calculated.numGroups;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const groups: { name: string; players: Registration[] }[] = [];

      for (let i = 0; i < numGroups; i++) {
        groups.push({
          name: `Grupo ${letters[i] || i + 1}`,
          players: [],
        });
      }

      shuffled.forEach((reg, index) => {
        const groupIndex = index % numGroups;
        groups[groupIndex].players.push(reg);
      });

      // 3. Generar enfrentamientos de todos contra todos (Round Robin)
      const newMatches: any[] = [];
      let matchCounter = 1;
      let tableAssign = 1;

      groups.forEach((grp) => {
        const pList = grp.players;
        for (let i = 0; i < pList.length; i++) {
          for (let j = i + 1; j < pList.length; j++) {
            const p1 = pList[i];
            const p2 = pList[j];

            newMatches.push({
              roundName: grp.name,
              matchNumber: matchCounter++,
              tableNumber: (tableAssign % 4) + 1,
              status: 'PENDING',
              player1Id: p1.playerId,
              player1Name: p1.player.fullName,
              player1Photo: p1.player.photoUrl || null,
              player1Score: 0,
              player1Innings: 0,
              player1HighRun: 0,
              player1Average: 0,
              player2Id: p2.playerId,
              player2Name: p2.player.fullName,
              player2Photo: p2.player.photoUrl || null,
              player2Score: 0,
              player2Innings: 0,
              player2HighRun: 0,
              player2Average: 0,
              totalInnings: 0,
              winnerId: null,
              winnerName: null,
            });
            tableAssign++;
          }
        }
      });

      // 4. Si replaceExisting es true, eliminar partidas previas
      if (replaceExisting) {
        try {
          await apiRequest(`/tournaments/${tournamentId}/matches/all`, { method: 'DELETE' });
        } catch {
          /* ignore */
        }
      }

      // 5. Crear partidas en lote
      await apiRequest(`/tournaments/${tournamentId}/matches/bulk`, {
        method: 'POST',
        body: JSON.stringify(newMatches),
      });

      onGenerated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al generar el sorteo y las partidas');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Shuffle className="w-5 h-5 text-billiard-gold" />
              <span>Sorteo y Armado de Grupos</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Genera los grupos de 3 o 4 jugadores y el fixture de enfrentamientos por default.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total atletas confirmados:</span>
              <strong className="text-emerald-400 font-bold text-sm">{count} atletas</strong>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed bg-billiard-card p-2.5 rounded-xl border border-billiard-border/40">
              💡 {calculated.text}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Tamaño preferido por grupo:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Automático', desc: 'Equilibrado' },
                { id: '3', label: 'Grupos de 3', desc: 'Clasifican 2' },
                { id: '4', label: 'Grupos de 4', desc: 'Clasifican 2' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGroupSizePreference(opt.id as any)}
                  className={`p-3 rounded-2xl border text-center transition ${
                    groupSizePreference === opt.id
                      ? 'border-billiard-gold bg-amber-500/10 text-white font-bold'
                      : 'border-billiard-border bg-billiard-card text-gray-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-billiard-darker/40 border border-billiard-border flex items-center space-x-3">
            <input
              type="checkbox"
              id="replace"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded border-billiard-border text-billiard-green focus:ring-billiard-green w-4 h-4"
            />
            <label htmlFor="replace" className="text-xs text-gray-300 cursor-pointer">
              Reemplazar partidas y grupos existentes previamente generados
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-billiard-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={generating || count < 3}
            onClick={handleGenerateDraw}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker font-black text-xs transition flex items-center space-x-2 shadow-lg disabled:opacity-40"
          >
            <Shuffle className="w-4 h-4" />
            <span>{generating ? 'Sorteando...' : 'Realizar Sorteo Aleatorio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal para Armar Cuadro Eliminatorio / Llaves (Fase Final) ───
function GenerateKnockoutModal({
  tournamentId,
  groupStandings,
  groupNames,
  matches,
  defaultCaromsTarget,
  onClose,
  onGenerated,
}: {
  tournamentId: string;
  groupStandings: Record<string, any[]>;
  groupNames: string[];
  matches: Match[];
  defaultCaromsTarget?: number | null;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [caromsTarget, setCaromsTarget] = useState<number>(
    defaultCaromsTarget ? Math.max(defaultCaromsTarget, 20) : 20
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // 1. Obtener clasificados por grupo (los 2 primeros de cada grupo)
  const qualifiedPerGroup = useMemo(() => {
    const map: Record<string, { first?: any; second?: any }> = {};
    groupNames.forEach((gn) => {
      const rows = groupStandings[gn] || [];
      map[gn] = {
        first: rows[0] || null,
        second: rows[1] || null,
      };
    });
    return map;
  }, [groupNames, groupStandings]);

  // Partidas pendientes en fase de grupos
  const pendingGroupMatches = useMemo(() => {
    return matches.filter(
      (m) => m.roundName.toLowerCase().startsWith('grupo') && m.status === 'PENDING'
    );
  }, [matches]);

  const totalQualifiers = groupNames.length * 2;

  const handleGenerateKnockout = async () => {
    if (groupNames.length < 1) {
      setError('Debes tener al menos 1 grupo formado para generar el cuadro eliminatorio.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const newMatches: any[] = [];
      let matchCounter = 1;

      // ── Caso A: 2 Grupos (4 clasificados) -> Semifinales y Gran Final
      if (groupNames.length === 2) {
        const gA = qualifiedPerGroup[groupNames[0]] || {};
        const gB = qualifiedPerGroup[groupNames[1]] || {};

        // Semifinal 1: 1°A vs 2°B
        newMatches.push({
          roundName: 'Semifinal 1',
          matchNumber: matchCounter++,
          tableNumber: 1,
          status: 'PENDING',
          player1Id: gA.first?.playerId || null,
          player1Name: gA.first?.name || `1° ${groupNames[0]}`,
          player1Photo: gA.first?.photo || null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: gB.second?.playerId || null,
          player2Name: gB.second?.name || `2° ${groupNames[1]}`,
          player2Photo: gB.second?.photo || null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Semifinal 2: 1°B vs 2°A
        newMatches.push({
          roundName: 'Semifinal 2',
          matchNumber: matchCounter++,
          tableNumber: 2,
          status: 'PENDING',
          player1Id: gB.first?.playerId || null,
          player1Name: gB.first?.name || `1° ${groupNames[1]}`,
          player1Photo: gB.first?.photo || null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: gA.second?.playerId || null,
          player2Name: gA.second?.name || `2° ${groupNames[0]}`,
          player2Photo: gA.second?.photo || null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Gran Final
        newMatches.push({
          roundName: 'Gran Final',
          matchNumber: matchCounter++,
          tableNumber: 1,
          status: 'PENDING',
          player1Id: null,
          player1Name: 'Ganador Semifinal 1',
          player1Photo: null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: null,
          player2Name: 'Ganador Semifinal 2',
          player2Photo: null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });
      }
      // ── Caso B: 4 Grupos (8 clasificados) -> Cuartos, Semifinales y Gran Final
      else if (groupNames.length === 4) {
        const [gnA, gnB, gnC, gnD] = groupNames;
        const qA = qualifiedPerGroup[gnA] || {};
        const qB = qualifiedPerGroup[gnB] || {};
        const qC = qualifiedPerGroup[gnC] || {};
        const qD = qualifiedPerGroup[gnD] || {};

        // Cuartos 1: 1°A vs 2°B
        newMatches.push({
          roundName: 'Cuartos de Final 1',
          matchNumber: matchCounter++,
          tableNumber: 1,
          status: 'PENDING',
          player1Id: qA.first?.playerId || null,
          player1Name: qA.first?.name || `1° ${gnA}`,
          player1Photo: qA.first?.photo || null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: qB.second?.playerId || null,
          player2Name: qB.second?.name || `2° ${gnB}`,
          player2Photo: qB.second?.photo || null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Cuartos 2: 1°C vs 2°D
        newMatches.push({
          roundName: 'Cuartos de Final 2',
          matchNumber: matchCounter++,
          tableNumber: 2,
          status: 'PENDING',
          player1Id: qC.first?.playerId || null,
          player1Name: qC.first?.name || `1° ${gnC}`,
          player1Photo: qC.first?.photo || null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: qD.second?.playerId || null,
          player2Name: qD.second?.name || `2° ${gnD}`,
          player2Photo: qD.second?.photo || null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Cuartos 3: 1°B vs 2°A
        newMatches.push({
          roundName: 'Cuartos de Final 3',
          matchNumber: matchCounter++,
          tableNumber: 3,
          status: 'PENDING',
          player1Id: qB.first?.playerId || null,
          player1Name: qB.first?.name || `1° ${gnB}`,
          player1Photo: qB.first?.photo || null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: qA.second?.playerId || null,
          player2Name: qA.second?.name || `2° ${gnA}`,
          player2Photo: qA.second?.photo || null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Cuartos 4: 1°D vs 2°C
        newMatches.push({
          roundName: 'Cuartos de Final 4',
          matchNumber: matchCounter++,
          tableNumber: 4,
          status: 'PENDING',
          player1Id: qD.first?.playerId || null,
          player1Name: qD.first?.name || `1° ${gnD}`,
          player1Photo: qD.first?.photo || null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: qC.second?.playerId || null,
          player2Name: qC.second?.name || `2° ${gnC}`,
          player2Photo: qC.second?.photo || null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Semifinal 1: Ganador Cuartos 1 vs Ganador Cuartos 2
        newMatches.push({
          roundName: 'Semifinal 1',
          matchNumber: matchCounter++,
          tableNumber: 1,
          status: 'PENDING',
          player1Id: null,
          player1Name: 'Ganador Cuartos 1',
          player1Photo: null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: null,
          player2Name: 'Ganador Cuartos 2',
          player2Photo: null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Semifinal 2: Ganador Cuartos 3 vs Ganador Cuartos 4
        newMatches.push({
          roundName: 'Semifinal 2',
          matchNumber: matchCounter++,
          tableNumber: 2,
          status: 'PENDING',
          player1Id: null,
          player1Name: 'Ganador Cuartos 3',
          player1Photo: null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: null,
          player2Name: 'Ganador Cuartos 4',
          player2Photo: null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });

        // Gran Final
        newMatches.push({
          roundName: 'Gran Final',
          matchNumber: matchCounter++,
          tableNumber: 1,
          status: 'PENDING',
          player1Id: null,
          player1Name: 'Ganador Semifinal 1',
          player1Photo: null,
          player1Score: 0,
          player1Innings: 0,
          player1HighRun: 0,
          player1Average: 0,
          player2Id: null,
          player2Name: 'Ganador Semifinal 2',
          player2Photo: null,
          player2Score: 0,
          player2Innings: 0,
          player2HighRun: 0,
          player2Average: 0,
          totalInnings: 0,
          winnerId: null,
          winnerName: null,
        });
      }
      // ── Caso C: 1, 3 o más grupos
      else {
        const allQual: any[] = [];
        groupNames.forEach((gn) => {
          const rows = groupStandings[gn] || [];
          if (rows[0]) allQual.push(rows[0]);
          if (rows[1]) allQual.push(rows[1]);
        });

        if (allQual.length >= 4) {
          newMatches.push({
            roundName: 'Semifinal 1',
            matchNumber: matchCounter++,
            tableNumber: 1,
            status: 'PENDING',
            player1Id: allQual[0]?.playerId || null,
            player1Name: allQual[0]?.name || 'Clasificado 1',
            player1Photo: allQual[0]?.photo || null,
            player1Score: 0,
            player1Innings: 0,
            player1HighRun: 0,
            player1Average: 0,
            player2Id: allQual[3]?.playerId || null,
            player2Name: allQual[3]?.name || 'Clasificado 4',
            player2Photo: allQual[3]?.photo || null,
            player2Score: 0,
            player2Innings: 0,
            player2HighRun: 0,
            player2Average: 0,
            totalInnings: 0,
            winnerId: null,
            winnerName: null,
          });

          newMatches.push({
            roundName: 'Semifinal 2',
            matchNumber: matchCounter++,
            tableNumber: 2,
            status: 'PENDING',
            player1Id: allQual[1]?.playerId || null,
            player1Name: allQual[1]?.name || 'Clasificado 2',
            player1Photo: allQual[1]?.photo || null,
            player1Score: 0,
            player1Innings: 0,
            player1HighRun: 0,
            player1Average: 0,
            player2Id: allQual[2]?.playerId || null,
            player2Name: allQual[2]?.name || 'Clasificado 3',
            player2Photo: allQual[2]?.photo || null,
            player2Score: 0,
            player2Innings: 0,
            player2HighRun: 0,
            player2Average: 0,
            totalInnings: 0,
            winnerId: null,
            winnerName: null,
          });

          newMatches.push({
            roundName: 'Gran Final',
            matchNumber: matchCounter++,
            tableNumber: 1,
            status: 'PENDING',
            player1Id: null,
            player1Name: 'Ganador Semifinal 1',
            player1Photo: null,
            player1Score: 0,
            player1Innings: 0,
            player1HighRun: 0,
            player1Average: 0,
            player2Id: null,
            player2Name: 'Ganador Semifinal 2',
            player2Photo: null,
            player2Score: 0,
            player2Innings: 0,
            player2HighRun: 0,
            player2Average: 0,
            totalInnings: 0,
            winnerId: null,
            winnerName: null,
          });
        } else {
          newMatches.push({
            roundName: 'Gran Final',
            matchNumber: matchCounter++,
            tableNumber: 1,
            status: 'PENDING',
            player1Id: allQual[0]?.playerId || null,
            player1Name: allQual[0]?.name || 'Clasificado 1',
            player1Photo: allQual[0]?.photo || null,
            player1Score: 0,
            player1Innings: 0,
            player1HighRun: 0,
            player1Average: 0,
            player2Id: allQual[1]?.playerId || null,
            player2Name: allQual[1]?.name || 'Clasificado 2',
            player2Photo: allQual[1]?.photo || null,
            player2Score: 0,
            player2Innings: 0,
            player2HighRun: 0,
            player2Average: 0,
            totalInnings: 0,
            winnerId: null,
            winnerName: null,
          });
        }
      }

      // Eliminar partidas previas de eliminación directa
      const priorKnockout = matches.filter(
        (m) => !m.roundName.toLowerCase().startsWith('grupo')
      );
      for (const pk of priorKnockout) {
        try {
          await apiRequest(`/tournaments/${tournamentId}/matches/${pk.id}`, { method: 'DELETE' });
        } catch {
          /* ignore */
        }
      }

      // Crear partidas eliminatorias
      await apiRequest(`/tournaments/${tournamentId}/matches/bulk`, {
        method: 'POST',
        body: JSON.stringify(newMatches),
      });

      // Actualizar estado del torneo a IN_PROGRESS
      await apiRequest(`/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          caromsTarget: caromsTarget,
        }),
      });

      onGenerated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al armar el cuadro eliminatorio');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-billiard-gold" />
              <span>Avanzar a Fase Eliminatoria / Llaves</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Configura los cruces oficiales entre los 2 mejores atletas de cada grupo.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pendingGroupMatches.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              ⚠️ Hay {pendingGroupMatches.length} partidas pendientes en grupos. Puedes armar las llaves con las posiciones actuales o terminarlas antes.
            </span>
          </div>
        )}

        {/* Clasificados por Grupo */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-300">Atletas Clasificados de Grupos ({totalQualifiers}):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {groupNames.map((gn) => {
              const q = qualifiedPerGroup[gn] || {};
              return (
                <div key={gn} className="p-3 rounded-2xl bg-billiard-darker/60 border border-billiard-border/70 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-billiard-gold tracking-wider">{gn}</span>
                  <div className="text-xs text-white flex items-center justify-between">
                    <span className="truncate">1° {q.first?.name || 'Por definir'}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">1° Lugar</span>
                  </div>
                  <div className="text-xs text-gray-300 flex items-center justify-between">
                    <span className="truncate">2° {q.second?.name || 'Por definir'}</span>
                    <span className="text-[10px] text-gray-400">2° Lugar</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distancia Fase Final */}
        <div className="p-3.5 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 space-y-2">
          <label className="block text-xs font-semibold text-gray-300">
            Distancia de Carambolas para la Fase Final:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={5}
              value={caromsTarget}
              onChange={(e) => setCaromsTarget(Number(e.target.value))}
              className="w-28 bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white font-bold text-center focus:outline-none focus:border-billiard-green"
            />
            <span className="text-xs text-gray-400">carambolas objetivo por partida</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-billiard-border/60">
          <button
            type="button"
            disabled={generating}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={generating || groupNames.length === 0}
            onClick={handleGenerateKnockout}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker font-black text-xs transition flex items-center space-x-2 shadow-lg disabled:opacity-40"
          >
            <GitBranch className="w-4 h-4" />
            <span>{generating ? 'Armando Llaves...' : '🏆 Generar Llaves y Comenzar Fase Final'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal para Publicar Podio y Resultados Oficiales ──────────────
function ResultsModal({
  registrations,
  tournamentId,
  onClose,
  onSave,
}: {
  registrations: Registration[];
  tournamentId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const confirmedRegs = registrations.filter((r) => r.status !== 'WITHDRAWN');
  const [resultsList, setResultsList] = useState<
    { playerId: string; position: number; pointsAwarded: number }[]
  >(() =>
    confirmedRegs.slice(0, 4).map((r, i) => ({
      playerId: r.playerId,
      position: i + 1,
      pointsAwarded: i === 0 ? 100 : i === 1 ? 60 : i === 2 ? 40 : 20,
    }))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateResult = (idx: number, field: 'playerId' | 'pointsAwarded', val: any) => {
    setResultsList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: field === 'pointsAwarded' ? Number(val) : val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const playerIds = resultsList.map((r) => r.playerId).filter(Boolean);
    if (new Set(playerIds).size !== playerIds.length) {
      setError('No puedes seleccionar el mismo jugador en dos posiciones distintas');
      setSaving(false);
      return;
    }

    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations/results`, {
        method: 'POST',
        body: JSON.stringify({ results: resultsList }),
      });
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar podio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-billiard-gold" />
              <span>Publicar Podio y Resultados Oficiales</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Asigna al campeón, subcampeón y semifinalistas del campeonato.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {resultsList.map((res, idx) => {
              const medalIcons: Record<number, string> = { 1: '🥇 1° Lugar', 2: '🥈 2° Lugar', 3: '🥉 3° Lugar', 4: '🎖️ 4° Lugar' };
              return (
                <div key={res.position} className="p-3 rounded-2xl bg-billiard-darker/60 border border-billiard-border grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{medalIcons[res.position] || `${res.position}°`}</span>
                  </div>
                  <div className="col-span-5">
                    <select
                      value={res.playerId}
                      onChange={(e) => updateResult(idx, 'playerId', e.target.value)}
                      className="w-full bg-billiard-card border border-billiard-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-billiard-green"
                    >
                      <option value="">-- Seleccionar --</option>
                      {confirmedRegs.map((r) => (
                        <option key={r.playerId} value={r.playerId}>
                          {r.player.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      value={res.pointsAwarded}
                      onChange={(e) => updateResult(idx, 'pointsAwarded', e.target.value)}
                      className="w-full bg-billiard-card border border-billiard-border rounded-xl px-2 py-1.5 text-xs text-right text-emerald-400 font-bold focus:outline-none focus:border-billiard-green"
                      placeholder="0 pts"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-billiard-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-billiard-darker font-bold text-xs transition-all flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Publicar Podio Oficial'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal para Gestión de Bajas y Cancelaciones ──────────────
function WithdrawModal({
  registration,
  tournamentId,
  matches,
  onClose,
  onSuccess,
  onOpenReplace,
}: {
  registration: Registration;
  tournamentId: string;
  matches: Match[];
  onClose: () => void;
  onSuccess: () => void;
  onOpenReplace: (reg: Registration) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Partidas del jugador
  const playerMatches = useMemo(
    () => matches.filter((m) => m.player1Id === registration.playerId || m.player2Id === registration.playerId),
    [matches, registration.playerId]
  );
  const pendingMatches = useMemo(
    () => playerMatches.filter((m) => m.status === 'PENDING'),
    [playerMatches]
  );
  const finishedMatches = useMemo(
    () => playerMatches.filter((m) => m.status === 'FINISHED'),
    [playerMatches]
  );

  // Acción 1: Retirar y declarar W.O. en partidas pendientes
  const handleDeclareWalkover = async () => {
    setLoading(true);
    setError('');
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations/${registration.playerId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'WITHDRAWN',
          markWalkover: true,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar retiro por W.O.');
    } finally {
      setLoading(false);
    }
  };

  // Acción 2: Dar de baja definitiva y eliminar partidas pendientes
  const handleRemoveRegistration = async () => {
    setLoading(true);
    setError('');
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations/${registration.playerId}`, {
        method: 'DELETE',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar inscripción');
    } finally {
      setLoading(false);
    }
  };

  // Acción 3: Marcar como retirado sin alterar partidas
  const handleMarkWithdrawnOnly = async () => {
    setLoading(true);
    setError('');
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations/${registration.playerId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'WITHDRAWN',
          removePendingMatches: true,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al marcar retiro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <UserMinus className="w-5 h-5 text-red-400" />
              <span>Baja / Retiro de Participante</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Gestiona la cancelación de {registration.player.fullName} antes o durante el torneo.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 flex items-center space-x-3">
          <Avatar name={registration.player.fullName} photo={registration.player.photoUrl} size="md" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-sm truncate">{registration.player.fullName}</p>
            {registration.player.nickname && (
              <p className="text-xs text-billiard-gold">"{registration.player.nickname}"</p>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">
              Partidas programadas: <strong className="text-white">{playerMatches.length}</strong> ({pendingMatches.length} pendientes, {finishedMatches.length} finalizadas)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-300 font-semibold">Selecciona cómo deseas manejar la baja:</p>

          {/* Opción A: Sustituir por otro atleta */}
          <div
            onClick={() => {
              onClose();
              onOpenReplace(registration);
            }}
            className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 hover:border-indigo-400 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reemplazar por otro jugador (Sustitución directa)</span>
              </p>
              <p className="text-[11px] text-gray-400">
                Ideal si llegó otro jugador de último momento. Heredará sus partidas pendientes sin romper el grupo.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition" />
          </div>

          {/* Opción B: Declarar W.O. */}
          {pendingMatches.length > 0 && (
            <div
              onClick={handleDeclareWalkover}
              className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 hover:border-amber-400 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Declarar W.O. (Walkover) en sus {pendingMatches.length} partidas pendientes</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  Sus rivales ganarán automáticamente los puntos reglamentarios. El jugador queda marcado como RETIRADO.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
            </div>
          )}

          {/* Opción C: Dar de baja definitiva */}
          <div
            onClick={handleRemoveRegistration}
            className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/40 hover:border-red-400 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-300 flex items-center space-x-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancelar inscripción y anular partidas pendientes</span>
              </p>
              <p className="text-[11px] text-gray-400">
                Elimina al atleta del torneo y suprime sus partidas pendientes para no dejar partidos huérfanos.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-billiard-border/60">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal para Sustitución / Reemplazo Directo ───────────────
function ReplacePlayerModal({
  registration,
  tournamentId,
  availablePlayers,
  onClose,
  onSuccess,
}: {
  registration: Registration;
  tournamentId: string;
  availablePlayers: Player[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [newQuickName, setNewQuickName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let targetPlayerId = selectedPlayerId;

    try {
      // Si escribió un nombre rápido, crearlo primero en el club
      if (!targetPlayerId && newQuickName.trim()) {
        const created = await apiRequest<Player>('/players', {
          method: 'POST',
          body: JSON.stringify({ fullName: newQuickName.trim() }),
        });
        targetPlayerId = created.id;
      }

      if (!targetPlayerId) {
        setError('Selecciona un jugador del club o escribe el nombre del nuevo atleta');
        setLoading(false);
        return;
      }

      await apiRequest(`/tournaments/${tournamentId}/registrations/${registration.playerId}/replace`, {
        method: 'POST',
        body: JSON.stringify({
          newPlayerId: targetPlayerId,
          removeOld: false,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al reemplazar jugador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-billiard-green" />
              <span>Sustitución de Atleta</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Reemplaza a <strong>{registration.player.fullName}</strong> por otro competidor.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleConfirmReplace} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              Opción A: Elegir del Directorio del Club
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                if (e.target.value) setNewQuickName('');
              }}
              className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green"
            >
              <option value="">-- Seleccionar sustituto --</option>
              {availablePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} {p.nickname ? `(${p.nickname})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center text-[11px] text-gray-500">— O bien —</div>

          <div className="p-3.5 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              Opción B: Registrar Atleta Nuevo al Vuelo
            </label>
            <input
              type="text"
              value={newQuickName}
              onChange={(e) => {
                setNewQuickName(e.target.value);
                if (e.target.value) setSelectedPlayerId('');
              }}
              placeholder="Nombre del nuevo competidor (ej: Carlos Ruiz)"
              className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green placeholder-gray-500"
            />
          </div>

          <p className="text-[11px] text-emerald-400/90 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl">
            ✨ Al confirmar, todas las partidas pendientes de {registration.player.fullName} serán automáticamente transferidas al nuevo atleta.
          </p>

          <div className="flex justify-end space-x-3 pt-3 border-t border-billiard-border/60">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (!selectedPlayerId && !newQuickName.trim())}
              className="px-5 py-2.5 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-xs transition flex items-center space-x-2 disabled:opacity-40"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? 'Reemplazando...' : 'Confirmar Sustitución'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal para Inscripción de Último Momento ─────────────────
function LateEnrollModal({
  tournamentId,
  availablePlayers,
  groupNames,
  registrations,
  matches,
  onClose,
  onSuccess,
}: {
  tournamentId: string;
  availablePlayers: Player[];
  groupNames: string[];
  registrations: Registration[];
  matches: Match[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [newQuickName, setNewQuickName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(groupNames[0] || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnrollLate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let targetPlayerId = selectedPlayerId;
    let targetPlayerName = '';

    try {
      // 1. Obtener o crear jugador
      if (!targetPlayerId && newQuickName.trim()) {
        const created = await apiRequest<Player>('/players', {
          method: 'POST',
          body: JSON.stringify({ fullName: newQuickName.trim() }),
        });
        targetPlayerId = created.id;
        targetPlayerName = created.fullName;
      } else if (targetPlayerId) {
        const found = availablePlayers.find((p) => p.id === targetPlayerId);
        targetPlayerName = found ? found.fullName : 'Jugador';
      }

      if (!targetPlayerId) {
        setError('Selecciona o registra un atleta');
        setLoading(false);
        return;
      }

      // 2. Inscribir al torneo
      await apiRequest(`/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ playerId: targetPlayerId }),
      });

      // 3. Si se eligió asignar a un grupo existente, generar enfrentamientos con los demás del grupo
      if (selectedGroup) {
        // Encontrar los jugadores que ya están en este grupo
        const groupMatches = matches.filter((m) => m.roundName === selectedGroup);
        const groupPlayerIds = new Set<string>();
        const groupPlayerMap = new Map<string, string>();

        groupMatches.forEach((m) => {
          if (m.player1Id) {
            groupPlayerIds.add(m.player1Id);
            groupPlayerMap.set(m.player1Id, m.player1Name || 'Jugador');
          }
          if (m.player2Id) {
            groupPlayerIds.add(m.player2Id);
            groupPlayerMap.set(m.player2Id, m.player2Name || 'Jugador');
          }
        });

        // Crear una partida contra cada uno de ellos
        const newMatches: any[] = [];
        let matchCounter = matches.length + 1;

        Array.from(groupPlayerIds).forEach((otherId) => {
          if (otherId !== targetPlayerId) {
            newMatches.push({
              roundName: selectedGroup,
              matchNumber: matchCounter++,
              tableNumber: 1,
              status: 'PENDING',
              player1Id: targetPlayerId,
              player1Name: targetPlayerName,
              player1Score: 0,
              player1Innings: 0,
              player1HighRun: 0,
              player1Average: 0,
              player2Id: otherId,
              player2Name: groupPlayerMap.get(otherId) || 'Oponente',
              player2Score: 0,
              player2Innings: 0,
              player2HighRun: 0,
              player2Average: 0,
              totalInnings: 0,
              winnerId: null,
              winnerName: null,
            });
          }
        });

        if (newMatches.length > 0) {
          await apiRequest(`/tournaments/${tournamentId}/matches/bulk`, {
            method: 'POST',
            body: JSON.stringify(newMatches),
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al inscribir atleta de último momento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-billiard-card border border-billiard-border shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-billiard-gold" />
              <span>Inscripción de Último Momento</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Inscribe a un jugador que llegó justo antes o durante el torneo.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEnrollLate} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              Seleccionar del Club
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                if (e.target.value) setNewQuickName('');
              }}
              className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green"
            >
              <option value="">-- Seleccionar jugador --</option>
              {availablePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} {p.nickname ? `(${p.nickname})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center text-[11px] text-gray-500">— O bien crear nuevo —</div>

          <div className="p-3.5 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60 space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              Registrar Atleta Nuevo
            </label>
            <input
              type="text"
              value={newQuickName}
              onChange={(e) => {
                setNewQuickName(e.target.value);
                if (e.target.value) setSelectedPlayerId('');
              }}
              placeholder="Nombre completo (ej: Juan Camilo)"
              className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green placeholder-gray-500"
            />
          </div>

          {/* Asignación a Grupo */}
          {groupNames.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <label className="block text-xs font-bold text-amber-300">
                Asignar a Grupo de Juego:
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green"
              >
                <option value="">-- Sin grupo (Reserva / Standby) --</option>
                {groupNames.map((gn) => (
                  <option key={gn} value={gn}>
                    {gn} (Se generarán sus partidas contra los miembros del grupo)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400">
                Al sumarlo a un grupo existente, se crean automáticamente los partidos pendientes contra los otros atletas de ese grupo.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-billiard-border/60">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-billiard-border text-gray-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (!selectedPlayerId && !newQuickName.trim())}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker font-black text-xs transition flex items-center space-x-2 disabled:opacity-40"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Inscribiendo...' : 'Inscribir Atleta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────
export default function TournamentManagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Pestañas organizadas
  const [activeTab, setActiveTab] = useState<'players' | 'groups' | 'bracket' | 'results'>('players');
  const hasInitializedTab = useRef(false);

  // Modales
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showKnockoutModal, setShowKnockoutModal] = useState(false);
  const [digitizingMatch, setDigitizingMatch] = useState<Match | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [withdrawingReg, setWithdrawingReg] = useState<Registration | null>(null);
  const [replacingReg, setReplacingReg] = useState<Registration | null>(null);
  const [showLateEnrollModal, setShowLateEnrollModal] = useState(false);

  // Inscripción rápida en vista
  const [quickPlayerName, setQuickPlayerName] = useState('');
  const [selectedClubPlayer, setSelectedClubPlayer] = useState('');
  const [addingPlayerLoading, setAddingPlayerLoading] = useState(false);

  // Control y filtros visuales para Fase de Grupos
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [groupViewMode, setGroupViewMode] = useState<'all' | 'standings' | 'matches'>('all');
  const [collapsedMatches, setCollapsedMatches] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (grpName: string) => {
    setCollapsedMatches((prev) => ({
      ...prev,
      [grpName]: !prev[grpName],
    }));
  };

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      const [t, regs, ms, res] = await Promise.allSettled([
        apiRequest<Tournament>(`/tournaments/${id}`),
        apiRequest<Registration[]>(`/tournaments/${id}/registrations`),
        apiRequest<Match[]>(`/tournaments/${id}/matches`),
        apiRequest<TournamentResult[]>(`/tournaments/${id}/registrations/results`),
      ]);

      if (t.status === 'fulfilled') setTournament(t.value);
      if (regs.status === 'fulfilled') {
        setRegistrations(regs.value || []);
      }
      if (ms.status === 'fulfilled') {
        const mList = ms.value || [];
        setMatches(mList);
        if (!hasInitializedTab.current) {
          hasInitializedTab.current = true;
          if (mList.length > 0) {
            setActiveTab('groups');
          }
        }
      }
      if (res.status === 'fulfilled') setResults(res.value || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del torneo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchClubPlayers = useCallback(async () => {
    try {
      const data = await apiRequest<Player[]>('/players');
      setAllPlayers(data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchAll();
      fetchClubPlayers();
    }
  }, [authLoading, user, router, fetchAll, fetchClubPlayers]);

  // Inscritos confirmados y retirados
  const confirmedRegistrations = useMemo(
    () => registrations.filter((r) => r.status !== 'WITHDRAWN'),
    [registrations]
  );
  const withdrawnRegistrations = useMemo(
    () => registrations.filter((r) => r.status === 'WITHDRAWN'),
    [registrations]
  );

  // Jugadores del club disponibles que no están activos en este torneo
  const availablePlayers = useMemo(() => {
    const registeredIds = new Set(confirmedRegistrations.map((r) => r.playerId));
    return allPlayers.filter((p) => p.isActive !== false && !registeredIds.has(p.id));
  }, [allPlayers, confirmedRegistrations]);

  // Inscribir jugador existente del club
  const handleEnrollClubPlayer = async () => {
    if (!selectedClubPlayer) return;
    setAddingPlayerLoading(true);
    setError('');
    setFeedbackMsg('');

    try {
      await apiRequest(`/tournaments/${id}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ playerId: selectedClubPlayer }),
      });
      setSelectedClubPlayer('');
      setFeedbackMsg('✅ Jugador inscrito exitosamente en el campeonato.');
      setTimeout(() => setFeedbackMsg(''), 4000);
      await fetchAll();
      await fetchClubPlayers();
    } catch (err: any) {
      alert(err.message || 'Error al inscribir jugador');
      await fetchAll();
      await fetchClubPlayers();
    } finally {
      setAddingPlayerLoading(false);
    }
  };

  // Crear atleta nuevo rápido y agregarlo de una vez al torneo
  const handleQuickAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickPlayerName.trim();
    if (!name) return;

    setAddingPlayerLoading(true);
    setError('');
    setFeedbackMsg('');

    try {
      // 1. Crear en el club
      const createdPlayer = await apiRequest<Player>('/players', {
        method: 'POST',
        body: JSON.stringify({ fullName: name }),
      });

      // 2. Inscribir al torneo
      await apiRequest(`/tournaments/${id}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ playerId: createdPlayer.id }),
      });

      setQuickPlayerName('');
      setFeedbackMsg(`✅ Atleta "${name}" creado e inscrito correctamente.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
      await fetchClubPlayers();
      await fetchAll();
    } catch (err: any) {
      alert(err.message || 'Error al agregar jugador');
      await fetchClubPlayers();
      await fetchAll();
    } finally {
      setAddingPlayerLoading(false);
    }
  };

  // ==============================================================
  // CÁLCULO DE GRUPOS, PARTIDAS Y TABLA DE POSICIONES POR GRUPO
  // ==============================================================
  const groupMatches = useMemo(() => {
    return matches.filter((m) => m.roundName.toLowerCase().startsWith('grupo'));
  }, [matches]);

  const knockoutMatches = useMemo(() => {
    return matches.filter((m) => !m.roundName.toLowerCase().startsWith('grupo'));
  }, [matches]);

  // Partida de la Gran Final (si existe)
  const finalMatch = useMemo(() => {
    return matches.find(
      (m) =>
        m.roundName.toLowerCase().includes('final') &&
        !m.roundName.toLowerCase().includes('semi') &&
        !m.roundName.toLowerCase().includes('cuart') &&
        !m.roundName.toLowerCase().includes('octav')
    );
  }, [matches]);

  // Simular resultados aleatorios en partidos pendientes de grupos (herramienta rápida)
  const handleSimulateGroupMatches = async () => {
    if (
      !window.confirm(
        '¿Simular resultados para las partidas pendientes de la fase de grupos? Esto completará la fase de grupos para que puedas armar las llaves de inmediato.'
      )
    )
      return;

    setLoading(true);
    try {
      const pendingGroup = matches.filter(
        (m) => m.roundName.toLowerCase().startsWith('grupo') && m.status === 'PENDING'
      );
      const target = tournament?.caromsTarget || 15;

      for (const m of pendingGroup) {
        if (!m.player1Id || !m.player2Id) continue;
        const p1Wins = Math.random() > 0.5;
        const p1Score = p1Wins ? target : Math.floor(target * (0.6 + Math.random() * 0.35));
        const p2Score = !p1Wins ? target : Math.floor(target * (0.6 + Math.random() * 0.35));
        const innings = Math.floor(12 + Math.random() * 10);
        const p1HighRun = Math.floor(3 + Math.random() * 5);
        const p2HighRun = Math.floor(3 + Math.random() * 5);

        await apiRequest(`/tournaments/${id}/matches/${m.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'FINISHED',
            player1Score: p1Score,
            player1Innings: innings,
            player1HighRun: p1HighRun,
            player2Score: p2Score,
            player2Innings: innings,
            player2HighRun: p2HighRun,
            totalInnings: innings,
            winnerId: p1Wins ? m.player1Id : m.player2Id,
            winnerName: p1Wins ? m.player1Name : m.player2Name,
          }),
        });
      }

      await fetchAll();
      setFeedbackMsg('✅ Partidas de grupos completadas con éxito. ¡Ya puedes avanzar a las llaves eliminatorias!');
      setTimeout(() => setFeedbackMsg(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al simular partidas');
    } finally {
      setLoading(false);
    }
  };


  // Nombres únicos de grupos (ej: ["Grupo A", "Grupo B", "Grupo C"])
  const groupNames = useMemo(() => {
    const set = new Set<string>();
    groupMatches.forEach((m) => set.add(m.roundName));
    return Array.from(set).sort();
  }, [groupMatches]);

  // Tablas de posiciones por cada grupo con regla de clasificación (pasan 2 mejores)
  const groupStandings = useMemo(() => {
    const tables: Record<
      string,
      {
        playerId: string;
        name: string;
        photo?: string | null;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        caroms: number;
        innings: number;
        average: number;
        highRun: number;
        points: number;
        rank: number;
        isQualified: boolean;
      }[]
    > = {};

    groupNames.forEach((grpName) => {
      const gMatches = groupMatches.filter((m) => m.roundName === grpName);
      const playerStats: Record<string, any> = {};

      gMatches.forEach((m) => {
        if (m.player1Id && !playerStats[m.player1Id]) {
          playerStats[m.player1Id] = {
            playerId: m.player1Id,
            name: m.player1Name || 'Jugador',
            photo: m.player1Photo,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            caroms: 0,
            innings: 0,
            highRun: 0,
            points: 0,
          };
        }
        if (m.player2Id && !playerStats[m.player2Id]) {
          playerStats[m.player2Id] = {
            playerId: m.player2Id,
            name: m.player2Name || 'Jugador',
            photo: m.player2Photo,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            caroms: 0,
            innings: 0,
            highRun: 0,
            points: 0,
          };
        }

        if (m.status === 'FINISHED') {
          if (m.player1Id && playerStats[m.player1Id]) {
            const p = playerStats[m.player1Id];
            p.played += 1;
            p.caroms += m.player1Score;
            p.innings += m.player1Innings || m.totalInnings;
            p.highRun = Math.max(p.highRun, m.player1HighRun || 0);

            if (m.winnerId === m.player1Id) {
              p.won += 1;
              p.points += 2;
            } else if (m.winnerId === null && m.player1Score === m.player2Score) {
              p.drawn += 1;
              p.points += 1;
            } else {
              p.lost += 1;
            }
          }

          if (m.player2Id && playerStats[m.player2Id]) {
            const p = playerStats[m.player2Id];
            p.played += 1;
            p.caroms += m.player2Score;
            p.innings += m.player2Innings || m.totalInnings;
            p.highRun = Math.max(p.highRun, m.player2HighRun || 0);

            if (m.winnerId === m.player2Id) {
              p.won += 1;
              p.points += 2;
            } else if (m.winnerId === null && m.player1Score === m.player2Score) {
              p.drawn += 1;
              p.points += 1;
            } else {
              p.lost += 1;
            }
          }
        }
      });

      const list = Object.values(playerStats).map((p: any) => ({
        ...p,
        average: p.innings > 0 ? Number((p.caroms / p.innings).toFixed(3)) : 0,
      }));

      list.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.average !== a.average) return b.average - a.average;
        if (b.caroms !== a.caroms) return b.caroms - a.caroms;
        return b.highRun - a.highRun;
      });

      tables[grpName] = list.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        isQualified: idx < 2,
      }));
    });

    return tables;
  }, [groupMatches, groupNames]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-billiard-green border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando campeonato...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Torneo no encontrado</h2>
        <Link href="/dashboard/tournaments" className="inline-block text-billiard-green hover:underline text-sm font-semibold">
          Volver a mis torneos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── HEADER Y NAVEGACIÓN ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tournaments"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis Torneos</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchAll();
              fetchClubPlayers();
            }}
            className="p-2 rounded-xl border border-billiard-border hover:bg-billiard-felt text-gray-400 hover:text-white transition"
            title="Refrescar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <StatusBadge status={tournament.status} />
        </div>
      </div>

      {/* ── BANNER RESUMEN DEL TORNEO ── */}
      <div className="rounded-3xl bg-billiard-card border border-billiard-border p-5 sm:p-7 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tournament.name}
              </h1>
              <StatusBadge status={tournament.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400">
              <div className="flex items-center space-x-1.5">
                <span>📍 {tournament.venue}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>🎱 {tournament.modality?.name || 'Tres Bandas'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>
                  🎯 Distancia:{' '}
                  <strong className="text-white">
                    {tournament.caromsTarget ? `${tournament.caromsTarget} carambolas` : 'Libre'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0 flex-wrap gap-y-2">
            {/* Botón Sorteo Rápido */}
            <button
              onClick={() => setShowDrawModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker transition shadow-md hover:scale-105"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>🎲 Sorteo y Armar Grupos</span>
            </button>

            {/* Inscribir Último Momento */}
            <button
              onClick={() => setShowLateEnrollModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Último Momento</span>
            </button>

            <Link
              href={`/tournaments/${id}`}
              target="_blank"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border bg-billiard-darker border-billiard-border hover:border-billiard-green/50 text-gray-300 hover:text-white transition"
            >
              <Play className="w-3.5 h-3.5 text-billiard-green" />
              <span>Vista Pública</span>
            </Link>
          </div>
        </div>

        {/* Resumen Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl bg-billiard-darker/70 border border-billiard-border p-3 text-center">
            <Users className="w-4 h-4 text-billiard-green mx-auto mb-1" />
            <p className="text-xl font-black text-white">{confirmedRegistrations.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Participantes {withdrawnRegistrations.length > 0 ? `(${withdrawnRegistrations.length} bajas)` : ''}
            </p>
          </div>

          <div className="rounded-2xl bg-billiard-darker/70 border border-billiard-border p-3 text-center">
            <LayoutGrid className="w-4 h-4 text-billiard-gold mx-auto mb-1" />
            <p className="text-xl font-black text-billiard-gold">{groupNames.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Grupos Formados</p>
          </div>

          <div className="rounded-2xl bg-billiard-darker/70 border border-billiard-border p-3 text-center">
            <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-black text-white">
              {matches.filter((m) => m.status === 'FINISHED').length} / {matches.length}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Partidas Jugadas</p>
          </div>

          <div className="rounded-2xl bg-billiard-darker/70 border border-billiard-border p-3 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-black text-white">
              {matches.filter((m) => m.status === 'PENDING').length}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Partidas Pendientes</p>
          </div>
        </div>
      </div>

      {/* Notificación de feedback */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── NAVEGACIÓN POR FASES (PESTAÑAS) ── */}
      <div className="flex gap-2 border-b border-billiard-border/60 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'players'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'players' ? 'text-emerald-400' : 'text-gray-500'}`} />
          <span>1. Participantes</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            activeTab === 'players' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-gray-400'
          }`}>
            {confirmedRegistrations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'groups'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${activeTab === 'groups' ? 'text-emerald-400' : 'text-gray-500'}`} />
          <span>2. Fase de Grupos</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            activeTab === 'groups' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-gray-400'
          }`}>
            {groupNames.length} {groupNames.length === 1 ? 'grupo' : 'grupos'}
          </span>
          {groupMatches.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono">
              {groupMatches.length} partidas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'bracket'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <GitBranch className={`w-4 h-4 ${activeTab === 'bracket' ? 'text-emerald-400' : 'text-gray-500'}`} />
          <span>3. Cuadro Eliminatorio / Llaves</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Trophy className={`w-4 h-4 ${activeTab === 'results' ? 'text-emerald-400' : 'text-gray-500'}`} />
          <span>4. Podio y Resultados Finales</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* ── PESTAÑA 1: PARTICIPANTES E INSCRIPCIONES ─────────── */}
      {/* ======================================================== */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {/* Panel de Registro Rápido */}
          <div className="rounded-3xl bg-billiard-card border border-billiard-border p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-billiard-green" />
                  <span>Inscribir Atletas al Campeonato</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Agrega a los jugadores antes o durante el torneo. Se actualizan de inmediato en el fixture.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLateEnrollModal(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Inscripción de Último Momento</span>
                </button>

                {confirmedRegistrations.length >= 3 && (
                  <button
                    onClick={() => setShowDrawModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker font-black text-xs transition shadow-md hover:scale-105"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Realizar Sorteo ({confirmedRegistrations.length} inscritos)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Opción A: Inscribir del Directorio del Club */}
              <div className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border/70 space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Seleccionar del Directorio del Club
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedClubPlayer}
                    onChange={(e) => setSelectedClubPlayer(e.target.value)}
                    className="flex-1 bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-billiard-green"
                  >
                    <option value="">-- Seleccionar jugador ({availablePlayers.length} disponibles) --</option>
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} {p.nickname ? `(${p.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleEnrollClubPlayer}
                    disabled={!selectedClubPlayer || addingPlayerLoading}
                    className="px-4 py-2 rounded-xl bg-billiard-green hover:bg-emerald-400 disabled:opacity-40 text-billiard-darker font-bold text-xs transition flex-shrink-0"
                  >
                    Inscribir
                  </button>
                </div>
                {availablePlayers.length === 0 && (
                  <p className="text-[11px] text-gray-500">Todos los jugadores del club ya están inscritos.</p>
                )}
              </div>

              {/* Opción B: Inscribir Nuevo Atleta Rápido */}
              <form
                onSubmit={handleQuickAddPlayer}
                className="p-4 rounded-2xl bg-billiard-darker/60 border border-billiard-border/70 space-y-2"
              >
                <label className="block text-xs font-semibold text-gray-300">
                  + Registrar Atleta Nuevo Rápido
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickPlayerName}
                    onChange={(e) => setQuickPlayerName(e.target.value)}
                    placeholder="Nombre completo (ej: Pedro Martínez)"
                    className="flex-1 bg-billiard-card border border-billiard-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green"
                  />
                  <button
                    type="submit"
                    disabled={!quickPlayerName.trim() || addingPlayerLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition flex-shrink-0"
                  >
                    Crear & Inscribir
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">Se guardará en tu club y quedará inscrito al instante.</p>
              </form>
            </div>
          </div>

          {/* Listado de Jugadores Inscritos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Jugadores Confirmados ({confirmedRegistrations.length})</span>
              </h3>

              {confirmedRegistrations.length < 3 && (
                <span className="text-xs text-amber-400">
                  * Agrega al menos 3 jugadores para realizar el sorteo automático.
                </span>
              )}
            </div>

            {registrations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-billiard-border p-12 text-center bg-billiard-card/30 space-y-3">
                <Users className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-gray-300 font-bold text-sm">Sin participantes inscritos aún</p>
                <p className="text-gray-500 text-xs max-w-sm mx-auto">
                  Utiliza las opciones superiores para agregar los competidores de este campeonato.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {registrations.map((reg, idx) => {
                  const isWithdrawn = reg.status === 'WITHDRAWN';
                  return (
                    <div
                      key={reg.id}
                      className={`rounded-2xl border p-3.5 flex items-center justify-between transition shadow-sm ${
                        isWithdrawn
                          ? 'bg-red-950/10 border-red-500/30 opacity-70'
                          : 'bg-billiard-card border-billiard-border hover:border-billiard-green/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-billiard-darker border border-billiard-border flex items-center justify-center text-xs font-black text-gray-400 flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <Avatar name={reg.player.fullName} photo={reg.player.photoUrl} size="md" />
                        <div className="min-w-0">
                          <p className={`font-bold text-xs sm:text-sm truncate ${isWithdrawn ? 'line-through text-gray-400' : 'text-white'}`}>
                            {reg.player.fullName}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px]">
                            {isWithdrawn ? (
                              <span className="text-red-400 font-bold">⚠️ Retirado / Baja</span>
                            ) : reg.player.nickname ? (
                              <span className="text-billiard-gold font-medium">"{reg.player.nickname}"</span>
                            ) : (
                              <span className="text-emerald-400">✓ Confirmado</span>
                            )}
                            {reg.handicap > 0 && (
                              <span className="text-gray-500">· Hcp: {reg.handicap}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {/* Botón Reemplazar Atleta */}
                        <button
                          onClick={() => setReplacingReg(reg)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 transition"
                          title="Sustituir por otro jugador"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Dar de Baja / Retirar */}
                        <button
                          onClick={() => setWithdrawingReg(reg)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                          title="Gestionar baja / retiro"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ── PESTAÑA 2: FASE DE GRUPOS (CLASIFICACIÓN & PARTIDAS) ─ */}
      {/* ======================================================== */}
      {activeTab === 'groups' && (
        <div className="space-y-8">
          {groupNames.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-billiard-border p-12 text-center bg-billiard-card/30 space-y-4">
              <LayoutGrid className="w-12 h-12 text-gray-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No hay grupos formados todavía</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Inscribe a los participantes y presiona "Sorteo y Armar Grupos" para que el sistema organice
                  los grupos de 3 o 4 personas y programe todos los partidos automáticamente.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDrawModal(true)}
                  disabled={confirmedRegistrations.length < 3}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-billiard-gold to-amber-500 text-billiard-darker font-black text-xs transition shadow-lg hover:scale-105 disabled:opacity-40"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>🎲 Realizar Sorteo Ahora ({confirmedRegistrations.length} atletas)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── BARRA SUPERIOR DE CONTROL (LIMPIA Y HOMOGÉNEA) ── */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-billiard-card border border-billiard-border shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <span>Fase de Grupos</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal">
                          {groupNames.length} {groupNames.length === 1 ? 'grupo' : 'grupos'} · {confirmedRegistrations.length} atletas
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        Clasifican los <strong className="text-gray-200">2 mejores atletas</strong> de cada grupo a la llave final.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones principales con jerarquía homogénea */}
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {/* Botón Principal: Avanzar a Eliminatorias */}
                  <button
                    onClick={() => setShowKnockoutModal(true)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition shadow-md hover:shadow-amber-500/20"
                  >
                    <GitBranch className="w-4 h-4 text-slate-950" />
                    <span>Avanzar a Llaves</span>
                  </button>

                  {/* Acciones secundarias en estilo neutro/elegante */}
                  <button
                    onClick={() => setShowLateEnrollModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-200 border border-white/10 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Inscribir Último Momento</span>
                  </button>

                  <button
                    onClick={() => setShowDrawModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 hover:text-white border border-white/10 transition"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-gray-400" />
                    <span>Re-sortear</span>
                  </button>

                  {matches.some((m) => m.roundName.toLowerCase().startsWith('grupo') && m.status === 'PENDING') && (
                    <button
                      onClick={handleSimulateGroupMatches}
                      className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-gray-200 border border-white/5 transition"
                      title="Simular resultados aleatorios para pruebas rápidas"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simular (Test)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── SUB-BARRA: FILTROS DE GRUPO Y MODO DE VISTA ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-billiard-darker/60 border border-billiard-border/60">
                {/* Selector de Pestaña de Grupo */}
                <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
                  <button
                    onClick={() => setSelectedGroupFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                      selectedGroupFilter === 'all'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    Todos ({groupNames.length})
                  </button>
                  {groupNames.map((gn) => {
                    const count = (groupStandings[gn] || []).length;
                    const isSelected = selectedGroupFilter === gn;
                    return (
                      <button
                        key={gn}
                        onClick={() => setSelectedGroupFilter(gn)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span>{gn}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Modos de vista: Completo | Solo Tablas | Solo Partidas */}
                <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => setGroupViewMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      groupViewMode === 'all'
                        ? 'bg-white/10 text-white font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Completo
                  </button>
                  <button
                    onClick={() => setGroupViewMode('standings')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      groupViewMode === 'standings'
                        ? 'bg-white/10 text-white font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Solo Clasificación
                  </button>
                  <button
                    onClick={() => setGroupViewMode('matches')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      groupViewMode === 'matches'
                        ? 'bg-white/10 text-white font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Solo Partidas
                  </button>
                </div>
              </div>

              {/* ── RENDER DE GRUPOS FILTRADOS ── */}
              {groupNames
                .filter((gn) => selectedGroupFilter === 'all' || selectedGroupFilter === gn)
                .map((grpName) => {
                  const standings = groupStandings[grpName] || [];
                  const gMatches = groupMatches.filter((m) => m.roundName === grpName);
                  const isMatchesCollapsed = collapsedMatches[grpName] ?? false;

                  return (
                    <div
                      key={grpName}
                      className="rounded-3xl bg-billiard-card/90 border border-billiard-border overflow-hidden shadow-lg space-y-4 p-5 sm:p-6"
                    >
                      {/* Cabecera del Grupo */}
                      <div className="flex items-center justify-between pb-3 border-b border-billiard-border/60">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {grpName.replace('Grupo ', '')}
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-white">{grpName}</h4>
                            <p className="text-[11px] text-gray-400">
                              {standings.length} competidores · {gMatches.length} partidas · Pasan 2 a llaves
                            </p>
                          </div>
                        </div>

                        {/* Botón para colapsar/expandir partidas de este grupo */}
                        {groupViewMode === 'all' && gMatches.length > 0 && (
                          <button
                            onClick={() => toggleGroupCollapse(grpName)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/10 transition"
                          >
                            <span>{isMatchesCollapsed ? `Ver Partidas (${gMatches.length})` : 'Ocultar Partidas'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMatchesCollapsed ? '' : 'rotate-180'
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* ── TABLA DE POSICIONES (ESTILIZADA, SOBRIA Y ELEGANTE) ── */}
                      {groupViewMode !== 'matches' && (
                        <div className="overflow-x-auto rounded-2xl border border-billiard-border/60 bg-billiard-darker/40">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-black/30 text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-white/5">
                                <th className="py-2.5 px-3 w-12 text-center">Pos</th>
                                <th className="py-2.5 px-3">Atleta</th>
                                <th className="py-2.5 px-2 text-center font-medium">PJ</th>
                                <th className="py-2.5 px-2 text-center font-medium">PG</th>
                                <th className="py-2.5 px-2 text-center font-medium">PE</th>
                                <th className="py-2.5 px-2 text-center font-medium">PP</th>
                                <th className="py-2.5 px-2 text-center font-medium">Caramb.</th>
                                <th className="py-2.5 px-2 text-center font-medium">Entr.</th>
                                <th className="py-2.5 px-2 text-center font-medium">Prom.</th>
                                <th className="py-2.5 px-2 text-center font-medium">Serie</th>
                                <th className="py-2.5 px-3 text-center font-medium">Pts</th>
                                <th className="py-2.5 px-3 text-center font-medium">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              {standings.map((row) => (
                                <tr
                                  key={row.playerId}
                                  className={`hover:bg-white/[0.03] transition ${
                                    row.isQualified ? 'bg-emerald-500/[0.03]' : ''
                                  }`}
                                >
                                  {/* Posición con badge sutil para clasificados */}
                                  <td className="py-3 px-3 text-center">
                                    {row.isQualified ? (
                                      <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold text-xs inline-flex items-center justify-center">
                                        {row.rank}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 font-semibold">{row.rank}</span>
                                    )}
                                  </td>

                                  {/* Atleta */}
                                  <td className="py-3 px-3">
                                    <div className="flex items-center space-x-2.5">
                                      <Avatar name={row.name} photo={row.photo} size="sm" />
                                      <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-none">
                                        {row.name}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Estadísticas neutras sin sobrecarga de color para ceros */}
                                  <td className="py-3 px-2 text-center text-gray-300 font-medium">{row.played}</td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={row.won > 0 ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                                      {row.won}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={row.drawn > 0 ? 'text-amber-400 font-semibold' : 'text-gray-400'}>
                                      {row.drawn}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={row.lost > 0 ? 'text-gray-300 font-medium' : 'text-gray-400'}>
                                      {row.lost}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center text-gray-200">{row.caroms}</td>
                                  <td className="py-3 px-2 text-center text-gray-400">{row.innings}</td>

                                  {/* Promedio destacado elegantemente en monospace */}
                                  <td className="py-3 px-2 text-center font-mono font-semibold text-emerald-400/90">
                                    {row.average.toFixed(3)}
                                  </td>

                                  <td className="py-3 px-2 text-center text-gray-300">{row.highRun}</td>

                                  {/* Puntos destacados en cajita limpia */}
                                  <td className="py-3 px-3 text-center">
                                    <span className="font-bold text-xs text-white bg-white/10 px-2 py-0.5 rounded-md">
                                      {row.points}
                                    </span>
                                  </td>

                                  {/* Estado */}
                                  <td className="py-3 px-3 text-center">
                                    {row.isQualified ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Clasifica</span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-gray-400 font-medium">En juego</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* ── PARTIDAS / ENFRENTAMIENTOS (DISEÑO COMPACTO Y ORDENADO) ── */}
                      {groupViewMode !== 'standings' && (!isMatchesCollapsed || groupViewMode === 'matches') && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
                            <span className="flex items-center space-x-1.5">
                              <Swords className="w-3.5 h-3.5 text-gray-400" />
                              <span>Enfrentamientos de {grpName} ({gMatches.length})</span>
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              {gMatches.filter((m) => m.status === 'FINISHED').length} finalizadas ·{' '}
                              {gMatches.filter((m) => m.status !== 'FINISHED').length} pendientes
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {gMatches.map((m) => {
                              const isFinished = m.status === 'FINISHED';
                              return (
                                <div
                                  key={m.id}
                                  className={`p-3 rounded-2xl border transition-all ${
                                    isFinished
                                      ? 'bg-black/30 border-white/5 opacity-85 hover:opacity-100'
                                      : 'bg-billiard-darker/70 border-billiard-border/80 hover:border-emerald-500/30'
                                  }`}
                                >
                                  {/* Cabecera de la partida */}
                                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                                    <span className="font-semibold text-gray-300 bg-white/5 px-2 py-0.5 rounded-md">
                                      Mesa #{m.tableNumber || 1}
                                    </span>
                                    <span
                                      className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                                        isFinished
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                      }`}
                                    >
                                      {isFinished ? 'Finalizado' : 'Pendiente'}
                                    </span>
                                  </div>

                                  {/* Contendientes en formato marcador deportivo */}
                                  <div className="space-y-1.5 py-1">
                                    {/* Atleta 1 */}
                                    <div className="flex items-center justify-between p-1.5 rounded-xl bg-black/20">
                                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                                        <Avatar name={m.player1Name || 'J1'} photo={m.player1Photo} size="sm" />
                                        <span
                                          className={`text-xs truncate ${
                                            m.winnerId === m.player1Id ? 'font-bold text-emerald-400' : 'text-gray-200'
                                          }`}
                                        >
                                          {m.player1Name || 'Por definir'}
                                        </span>
                                      </div>
                                      <span className="font-mono font-bold text-xs text-white bg-black/60 border border-white/10 px-2.5 py-0.5 rounded-md min-w-[28px] text-center">
                                        {m.player1Score}
                                      </span>
                                    </div>

                                    {/* Atleta 2 */}
                                    <div className="flex items-center justify-between p-1.5 rounded-xl bg-black/20">
                                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                                        <Avatar name={m.player2Name || 'J2'} photo={m.player2Photo} size="sm" />
                                        <span
                                          className={`text-xs truncate ${
                                            m.winnerId === m.player2Id ? 'font-bold text-emerald-400' : 'text-gray-200'
                                          }`}
                                        >
                                          {m.player2Name || 'Por definir'}
                                        </span>
                                      </div>
                                      <span className="font-mono font-bold text-xs text-white bg-black/60 border border-white/10 px-2.5 py-0.5 rounded-md min-w-[28px] text-center">
                                        {m.player2Score}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Pie de tarjeta con acción */}
                                  <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                                    <span className="font-mono text-[10px]">
                                      Entradas: <strong className="text-gray-300">{m.totalInnings || 0}</strong>
                                    </span>
                                    <button
                                      onClick={() => setDigitizingMatch(m)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold text-[11px] transition flex items-center space-x-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>{isFinished ? 'Acta' : 'Digitalizar'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ── PESTAÑA 3: CUADRO ELIMINATORIO / LLAVES ────────────── */}
      {/* ======================================================== */}
      {activeTab === 'bracket' && (
        <div className="space-y-6">
          {/* Cabecera de la Fase Final */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-billiard-card border border-billiard-border">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-billiard-green" />
                <span>Cuadro de Eliminación Directa</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Rondas de eliminación directa (Octavos, Cuartos, Semifinal y Gran Final).
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setShowKnockoutModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker transition shadow-md hover:scale-105"
              >
                <GitBranch className="w-4 h-4" />
                <span>{knockoutMatches.length > 0 ? '⚡ Re-armar Llaves con Clasificados' : '⚡ Armar Llaves con Clasificados'}</span>
              </button>

              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                ⚡ Llaves Oficiales
              </div>
            </div>
          </div>

          {/* Banner de Celebración si ya hay Campeón Oficial */}
          {finalMatch?.status === 'FINISHED' && finalMatch?.winnerName && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 border border-billiard-gold/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center space-x-4">
                <span className="text-5xl">🏆</span>
                <div>
                  <span className="text-[11px] uppercase font-black text-billiard-gold tracking-widest block">
                    ¡Gran Final Concluida!
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Campeón: {finalMatch.winnerName}
                  </h2>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Subcampeón:{' '}
                    <strong className="text-white">
                      {finalMatch.winnerId === finalMatch.player1Id
                        ? finalMatch.player2Name || 'Finalista'
                        : finalMatch.player1Name || 'Finalista'}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('results');
                  setShowResultsModal(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-billiard-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-billiard-darker font-black text-xs transition shadow-lg hover:scale-105 flex items-center space-x-2 flex-shrink-0"
              >
                <Trophy className="w-4 h-4" />
                <span>Oficializar Podio y Premiación →</span>
              </button>
            </div>
          )}

          {/* Si no hay partidas eliminatorias, mostrar llamada a la acción */}
          {knockoutMatches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-billiard-border p-12 text-center bg-billiard-card/30 space-y-4">
              <GitBranch className="w-12 h-12 text-billiard-gold mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Cuadro Eliminatorio Pendiente</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Para continuar a la siguiente fase, presiona el botón para avanzar a los clasificados de la fase de grupos y armar los cruces oficiales de llaves.
                </p>
              </div>
              <button
                onClick={() => setShowKnockoutModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-billiard-gold to-amber-500 text-billiard-darker font-black text-xs transition shadow-xl hover:scale-105"
              >
                <GitBranch className="w-4 h-4" />
                <span>⚡ Armar Llaves con Clasificados de Grupos</span>
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 rounded-3xl bg-billiard-card border border-billiard-border shadow-xl">
              <TournamentBracket
                matches={matches}
                onSelectMatch={(m) => setDigitizingMatch(matches.find((x) => x.id === m.id) || null)}
                caromsTarget={tournament?.caromsTarget}
              />
            </div>
          )}

          {knockoutMatches.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Swords className="w-4 h-4 text-billiard-gold" />
                <span>Partidas de la Fase Final</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {knockoutMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-billiard-card border border-billiard-border space-y-3 hover:border-billiard-green/40 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-billiard-gold">{m.roundName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          m.status === 'FINISHED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.status === 'FINISHED' ? 'Finalizada' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white truncate font-medium">{m.player1Name || 'Por definir'}</span>
                        <span className="font-mono font-black text-emerald-400">{m.player1Score}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white truncate font-medium">{m.player2Name || 'Por definir'}</span>
                        <span className="font-mono font-black text-emerald-400">{m.player2Score}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDigitizingMatch(m)}
                      className="w-full py-2 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{m.status === 'FINISHED' ? 'Editar Resultado' : 'Digitalizar Resultado'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ── PESTAÑA 4: RESULTADOS FINALES Y PODIO ─────────────── */}
      {/* ======================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-billiard-card border border-billiard-border">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-billiard-gold" />
                <span>Resultados Oficiales del Torneo</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Publica las posiciones finales y puntos para los atletas.
              </p>
            </div>

            {confirmedRegistrations.length > 0 && (
              <button
                onClick={() => setShowResultsModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-billiard-gold to-amber-500 text-billiard-darker font-bold text-xs transition shadow-md hover:scale-105"
              >
                <Trophy className="w-4 h-4" />
                <span>{results.length > 0 ? 'Editar Podio' : 'Publicar Podio'}</span>
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-billiard-border p-12 text-center bg-billiard-card/30 space-y-3">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-gray-300 font-bold text-sm">Sin resultados publicados todavía</p>
              <p className="text-gray-500 text-xs">
                Cuando finalice la gran final, haz clic en "Publicar Podio" para oficializar al campeón.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {results
                .sort((a, b) => a.position - b.position)
                .map((r) => {
                  const medalIcons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center space-x-4 rounded-2xl border p-4 transition ${
                        r.position === 1
                          ? 'border-yellow-500/40 bg-yellow-500/10'
                          : r.position === 2
                          ? 'border-gray-400/40 bg-gray-400/10'
                          : r.position === 3
                          ? 'border-amber-600/40 bg-amber-600/10'
                          : 'border-billiard-border bg-billiard-card'
                      }`}
                    >
                      <span className="text-3xl w-10 text-center">{medalIcons[r.position] || `#${r.position}`}</span>
                      <Avatar name={r.player.fullName} photo={r.player.photoUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-white truncate">{r.player.fullName}</p>
                        {r.player.nickname && <p className="text-xs text-billiard-gold">"{r.player.nickname}"</p>}
                      </div>
                      {r.pointsAwarded > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-black text-billiard-green">+{r.pointsAwarded}</p>
                          <p className="text-[10px] text-gray-500">puntos</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── MODALES ── */}
      {showDrawModal && (
        <DrawGroupsModal
          registrations={registrations}
          tournamentId={id}
          caromsTarget={tournament?.caromsTarget}
          onClose={() => setShowDrawModal(false)}
          onGenerated={async () => {
            await fetchAll();
            setActiveTab('groups');
          }}
        />
      )}

      {digitizingMatch && (
        <DigitizeResultModal
          match={digitizingMatch}
          tournamentId={id}
          caromsTarget={tournament?.caromsTarget}
          allMatches={matches}
          onClose={() => setDigitizingMatch(null)}
          onSave={fetchAll}
        />
      )}

      {showResultsModal && (
        <ResultsModal
          registrations={registrations}
          tournamentId={id}
          onClose={() => setShowResultsModal(false)}
          onSave={fetchAll}
        />
      )}

      {showKnockoutModal && (
        <GenerateKnockoutModal
          tournamentId={id}
          groupStandings={groupStandings}
          groupNames={groupNames}
          matches={matches}
          defaultCaromsTarget={tournament?.caromsTarget}
          onClose={() => setShowKnockoutModal(false)}
          onGenerated={async () => {
            await fetchAll();
            setActiveTab('bracket');
          }}
        />
      )}

      {withdrawingReg && (
        <WithdrawModal
          registration={withdrawingReg}
          tournamentId={id}
          matches={matches}
          onClose={() => setWithdrawingReg(null)}
          onSuccess={async () => {
            await fetchAll();
            await fetchClubPlayers();
          }}
          onOpenReplace={(reg) => {
            setReplacingReg(reg);
          }}
        />
      )}

      {replacingReg && (
        <ReplacePlayerModal
          registration={replacingReg}
          tournamentId={id}
          availablePlayers={availablePlayers}
          onClose={() => setReplacingReg(null)}
          onSuccess={async () => {
            await fetchAll();
            await fetchClubPlayers();
          }}
        />
      )}

      {showLateEnrollModal && (
        <LateEnrollModal
          tournamentId={id}
          availablePlayers={availablePlayers}
          groupNames={groupNames}
          registrations={registrations}
          matches={matches}
          onClose={() => setShowLateEnrollModal(false)}
          onSuccess={async () => {
            await fetchAll();
            await fetchClubPlayers();
          }}
        />
      )}
    </div>
  );
}
