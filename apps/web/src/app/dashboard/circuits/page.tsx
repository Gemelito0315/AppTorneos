'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiRequest } from '../../../lib/api';
import {
  Zap, PlusCircle, X, ChevronRight, Trophy, Flame, Star,
  AlertCircle, Calendar, CheckCircle2, Edit, Trash2, Users,
} from 'lucide-react';

interface Circuit {
  id: string;
  name: string;
  description: string | null;
  incentiveRule: string | null;
  targetStreak: number;
  status: string;
  isPublic: boolean;
  startDate: string | null;
  endDate: string | null;
  _count: { tournaments: number };
}

interface PlayerCircuitStats {
  playerId: string;
  playerName: string;
  playerNickname: string | null;
  totalPoints: number;
  wins: number;
  top3: number;
  tournamentsPlayed: number;
  currentStreak: number;
  maxStreak: number;
  hasAchievedIncentive: boolean;
}

interface CircuitDetail extends Circuit {
  leaderboard: PlayerCircuitStats[];
  tournaments: any[];
  pointsRuleJson: string | null;
}

// ───────────────────────────────────
// Modal crear/editar circuito
// ───────────────────────────────────
function CircuitFormModal({ onClose, onSave, initial }: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial?: Partial<Circuit>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    incentiveRule: initial?.incentiveRule ?? '',
    targetStreak: initial?.targetStreak ?? 3,
    pointsRuleJson: '{"1":10,"2":6,"3":4,"4":2,"other":1}',
    isPublic: initial?.isPublic ?? true,
    startDate: initial?.startDate ? initial.startDate.substring(0, 10) : '',
    endDate: initial?.endDate ? initial.endDate.substring(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar JSON de puntos
    try {
      if (form.pointsRuleJson) JSON.parse(form.pointsRuleJson);
    } catch {
      setError('El JSON de puntos no es válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        targetStreak: Number(form.targetStreak),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar circuito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-billiard-card border border-billiard-border shadow-2xl p-6 space-y-5 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {initial?.id ? 'Editar Circuito' : 'Nuevo Circuito / Liga'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info box sobre circuitos */}
        <div className="rounded-xl bg-billiard-felt/40 border border-billiard-green/20 p-4 text-xs text-gray-300 space-y-1">
          <p className="font-semibold text-emerald-400 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5" /> <span>¿Qué es un circuito?</span>
          </p>
          <p>Un circuito agrupa varios torneos del club y acumula puntos. Se rastrean rachas de victorias consecutivas y se muestran públicamente para motivar a los jugadores.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre del circuito *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              placeholder="Circuito Nocturno Viernes"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition resize-none"
              placeholder="Torneos semanales cada viernes..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Regla de incentivo <span className="text-billiard-gold">(motivación para los jugadores)</span>
            </label>
            <textarea
              rows={2}
              value={form.incentiveRule}
              onChange={(e) => setForm({ ...form, incentiveRule: e.target.value })}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition resize-none"
              placeholder="El campeón de 3 torneos seguidos gana un taco Predator Black 3/4"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Victorias para incentivo 🔥</label>
              <input
                type="number"
                min={1}
                value={form.targetStreak}
                onChange={(e) => setForm({ ...form, targetStreak: Number(e.target.value) })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">¿Público?</label>
              <select
                value={form.isPublic ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, isPublic: e.target.value === 'true' })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              >
                <option value="true">Sí (visible para todos)</option>
                <option value="false">No (solo administradores)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Puntos por posición (JSON)</label>
            <input
              value={form.pointsRuleJson}
              onChange={(e) => setForm({ ...form, pointsRuleJson: e.target.value })}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-billiard-green transition"
              placeholder='{"1":10,"2":6,"3":4,"other":1}'
            />
            <p className="text-xs text-gray-500 mt-1">1=Campeón, 2=Subcampeón, etc. "other" = demás posiciones</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-billiard-green hover:bg-emerald-400 disabled:opacity-50 text-billiard-darker font-bold text-sm transition-all"
          >
            {saving ? 'Guardando...' : initial?.id ? 'Actualizar Circuito' : 'Crear Circuito'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ───────────────────────────────────
// Marcador de un circuito
// ───────────────────────────────────
function CircuitLeaderboard({ circuit, onClose }: { circuit: CircuitDetail; onClose: () => void }) {
  const top3Colors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
  const top3Bg = ['bg-yellow-400/10 border-yellow-400/30', 'bg-gray-500/10 border-gray-500/30', 'bg-amber-600/10 border-amber-600/30'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-billiard-card border border-billiard-border shadow-2xl p-6 space-y-6 my-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white">{circuit.name}</h2>
            {circuit.description && <p className="text-xs text-gray-400 mt-1">{circuit.description}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Incentivo del circuito */}
        {circuit.incentiveRule && (
          <div className="rounded-xl bg-gradient-to-r from-billiard-gold/10 to-amber-500/5 border border-billiard-gold/30 p-4 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-billiard-gold/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-billiard-gold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-billiard-gold mb-1">
                🎯 Incentivo: {circuit.targetStreak} victorias seguidas
              </p>
              <p className="text-sm text-gray-200">{circuit.incentiveRule}</p>
            </div>
          </div>
        )}

        {/* Marcador */}
        {circuit.leaderboard.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Users className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-gray-400 text-sm">Aún no hay resultados registrados en este circuito.</p>
            <p className="text-gray-500 text-xs">Los torneos deben tener estado FINISHED y resultados cargados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Marcador Acumulado</h3>

            {/* Top 3 destacado */}
            {circuit.leaderboard.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 0, 2].map((pos) => {
                  const player = circuit.leaderboard[pos];
                  if (!player) return <div key={pos} />;
                  return (
                    <div
                      key={player.playerId}
                      className={`rounded-xl border p-3 text-center space-y-2 ${top3Bg[pos]}`}
                    >
                      <span className={`text-2xl font-black ${top3Colors[pos]}`}>#{pos + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-white truncate">{player.playerName}</p>
                        {player.playerNickname && (
                          <p className="text-xs text-gray-400">"{player.playerNickname}"</p>
                        )}
                      </div>
                      <p className={`text-lg font-black ${top3Colors[pos]}`}>{player.totalPoints} pts</p>
                      {player.currentStreak > 0 && (
                        <div className="flex items-center justify-center space-x-1 text-xs text-orange-400">
                          <Flame className="w-3 h-3" />
                          <span>{player.currentStreak} racha</span>
                        </div>
                      )}
                      {player.hasAchievedIncentive && (
                        <div className="flex items-center justify-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-billiard-gold/20 text-billiard-gold border border-billiard-gold/30">
                            ⭐ Incentivo
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabla completa */}
            <div className="rounded-xl overflow-hidden border border-billiard-border">
              <table className="w-full text-sm">
                <thead className="bg-billiard-darker">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-semibold">Jugador</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-semibold">Pts</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-semibold">🏆</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-semibold">Racha</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-semibold">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {circuit.leaderboard.map((player, idx) => (
                    <tr
                      key={player.playerId}
                      className="border-t border-billiard-border hover:bg-billiard-cardHover transition"
                    >
                      <td className="px-4 py-3">
                        <span className={`font-black text-sm ${idx < 3 ? top3Colors[idx] : 'text-gray-400'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-white font-medium text-xs">{player.playerName}</span>
                          {player.playerNickname && (
                            <span className="text-gray-500 text-xs ml-1">"{player.playerNickname}"</span>
                          )}
                          {player.hasAchievedIncentive && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-billiard-gold/20 text-billiard-gold">
                              ⭐
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-billiard-green text-sm">
                        {player.totalPoints}
                      </td>
                      <td className="px-3 py-3 text-center text-billiard-gold text-xs">{player.wins}</td>
                      <td className="px-3 py-3 text-center">
                        {player.currentStreak > 0 ? (
                          <span className="flex items-center justify-center space-x-1 text-orange-400 text-xs">
                            <Flame className="w-3 h-3" /> <span>{player.currentStreak}</span>
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-400">{player.maxStreak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Torneos del circuito */}
            {circuit.tournaments?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase">
                  Torneos incluidos ({circuit.tournaments.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {circuit.tournaments.map((t: any) => (
                    <span
                      key={t.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-billiard-darker border border-billiard-border text-gray-300"
                    >
                      {t.name} · {new Date(t.startDate).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────
// Página principal de circuitos
// ───────────────────────────────────
export default function CircuitsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCircuit, setEditCircuit] = useState<Circuit | undefined>(undefined);
  const [activeCircuit, setActiveCircuit] = useState<CircuitDetail | null>(null);
  const [error, setError] = useState('');

  const fetchCircuits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Circuit[]>('/circuits');
      setCircuits(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar circuitos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchCircuits();
  }, [authLoading, user, router, fetchCircuits]);

  const handleSave = async (data: any) => {
    if (editCircuit?.id) {
      await apiRequest(`/circuits/${editCircuit.id}`, { method: 'PATCH', body: JSON.stringify(data) });
    } else {
      await apiRequest('/circuits', { method: 'POST', body: JSON.stringify(data) });
    }
    await fetchCircuits();
    setEditCircuit(undefined);
  };

  const handleViewLeaderboard = async (id: string) => {
    try {
      const data = await apiRequest<CircuitDetail>(`/circuits/${id}`);
      setActiveCircuit(data);
    } catch (err: any) {
      alert(err.message || 'Error al cargar el marcador');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este circuito? Los torneos asociados quedarán sin circuito.')) return;
    try {
      await apiRequest(`/circuits/${id}`, { method: 'DELETE' });
      setCircuits((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Activo', PAUSED: 'Pausado', FINISHED: 'Finalizado',
  };
  const statusColor: Record<string, string> = {
    ACTIVE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    PAUSED: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    FINISHED: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  };

  if (authLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-billiard-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-billiard-card via-billiard-cardHover to-billiard-felt/30 border border-billiard-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-billiard-felt flex items-center justify-center">
            <Zap className="w-5 h-5 text-billiard-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Circuitos y Ligas</h1>
            <p className="text-xs text-gray-400">Torneos recurrentes con incentivos acumulativos</p>
          </div>
        </div>
        <button
          onClick={() => { setEditCircuit(undefined); setShowModal(true); }}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-billiard-gold hover:bg-amber-400 text-billiard-darker font-bold text-sm shadow-lg transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Circuito</span>
        </button>
      </div>

      {/* Explicación */}
      <div className="rounded-2xl bg-billiard-felt/20 border border-billiard-green/20 p-5 grid sm:grid-cols-3 gap-4">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-400" />, title: 'Rachas de Victorias', desc: 'Rastrea quién gana torneos consecutivos dentro del circuito.' },
          { icon: <Star className="w-5 h-5 text-billiard-gold" />, title: 'Incentivos Visibles', desc: 'Los jugadores ven el incentivo y se motivan a participar.' },
          { icon: <Trophy className="w-5 h-5 text-billiard-green" />, title: 'Marcador Público', desc: 'Cada club tiene su URL pública para ver el marcador en tiempo real.' },
        ].map((item, i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-billiard-card flex items-center justify-center flex-shrink-0 mt-0.5">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" /> <span>{error}</span>
        </div>
      )}

      {/* Lista de circuitos */}
      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-billiard-card border border-billiard-border animate-pulse" />
          ))}
        </div>
      ) : circuits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-billiard-border p-14 text-center bg-billiard-card/30 space-y-4">
          <Zap className="w-12 h-12 text-gray-600 mx-auto" />
          <div>
            <p className="text-gray-300 text-sm font-semibold">Aún no tienes circuitos</p>
            <p className="text-gray-500 text-xs mt-1">Crea uno para agrupar torneos semanales o mensuales con incentivos.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {circuits.map((circuit) => (
            <div
              key={circuit.id}
              className="rounded-2xl bg-billiard-card border border-billiard-border hover:border-billiard-gold/30 transition-all p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <h3 className="font-bold text-white text-base">{circuit.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[circuit.status] || statusColor.ACTIVE}`}>
                    {statusLabel[circuit.status] || circuit.status}
                  </span>
                  {circuit.isPublic && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-400/10">
                      Público
                    </span>
                  )}
                </div>
                {circuit.description && (
                  <p className="text-xs text-gray-400">{circuit.description}</p>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Trophy className="w-3 h-3" />
                    <span>{circuit._count.tournaments} torneos</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>Meta: {circuit.targetStreak} victorias seguidas</span>
                  </span>
                </div>
                {circuit.incentiveRule && (
                  <p className="text-xs text-billiard-gold/80 italic">"{circuit.incentiveRule}"</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleViewLeaderboard(circuit.id)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-billiard-felt hover:bg-billiard-cardHover border border-billiard-border text-xs text-white font-semibold transition"
                >
                  <Trophy className="w-3.5 h-3.5 text-billiard-gold" />
                  <span>Ver Marcador</span>
                </button>
                <button
                  onClick={() => { setEditCircuit(circuit); setShowModal(true); }}
                  className="p-2 rounded-lg hover:bg-billiard-felt border border-transparent hover:border-billiard-border text-gray-400 hover:text-white transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(circuit.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-gray-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showModal && (
        <CircuitFormModal
          initial={editCircuit}
          onClose={() => { setShowModal(false); setEditCircuit(undefined); }}
          onSave={handleSave}
        />
      )}

      {/* Modal marcador */}
      {activeCircuit && (
        <CircuitLeaderboard
          circuit={activeCircuit}
          onClose={() => setActiveCircuit(null)}
        />
      )}
    </div>
  );
}
