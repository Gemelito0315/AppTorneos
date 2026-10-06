'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiRequest } from '../../../lib/api';
import {
  Users, PlusCircle, Search, Trophy, X,
  Phone, Mail, Star, TrendingUp, AlertCircle, Edit, Trash2,
  Camera, User, Award, Activity, Hash, ChevronDown, ChevronUp,
  CheckCircle, Clock, Target, Flame,
} from 'lucide-react';

interface PlayerResult {
  id: string;
  position: number;
  pointsAwarded: number;
  tournament: {
    id: string;
    name: string;
    startDate: string;
    status: string;
  };
}

interface Player {
  id: string;
  fullName: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  handicap: number;
  baseAverage: number;
  photoUrl: string | null;
  notes: string | null;
  isActive: boolean;
  results: PlayerResult[];
  _count: { registrations: number };
}

// ──────────────────────────────────────────────────────────────
// Avatar component
// ──────────────────────────────────────────────────────────────
function PlayerAvatar({ player, size = 'md' }: { player: Pick<Player, 'fullName' | 'photoUrl'>; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-lg', lg: 'w-20 h-20 text-2xl' };
  const initials = player.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={player.fullName}
        className={`${sizes[size]} rounded-full object-cover border-2 border-billiard-green/40 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-billiard-green/30 to-emerald-600/20 border-2 border-billiard-green/30 flex items-center justify-center flex-shrink-0`}>
      <span className="font-black text-billiard-green">{initials}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Photo upload helper (redimensiona y comprime a Base64 ligero)
// ──────────────────────────────────────────────────────────────
function PhotoUpload({ value, onChange }: { value: string; onChange: (base64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Redimensionar a tamaño óptimo para avatar (máx 400x400)
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Comprime a JPEG con calidad 0.82 (~25-45 KB)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            onChange(compressedBase64);
          } else {
            onChange(event.target?.result as string);
          }
        } catch {
          onChange(event.target?.result as string);
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => setIsProcessing(false);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-24 h-24 rounded-full border-2 border-dashed border-billiard-border hover:border-billiard-green cursor-pointer transition overflow-hidden flex items-center justify-center bg-billiard-darker relative group"
      >
        {isProcessing ? (
          <div className="w-6 h-6 border-2 border-billiard-green border-t-transparent rounded-full animate-spin" />
        ) : value ? (
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-gray-500 group-hover:text-billiard-green transition" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs text-billiard-green hover:underline flex items-center space-x-1"
      >
        <Camera className="w-3 h-3" />
        <span>{value ? 'Cambiar foto' : 'Subir foto'}</span>
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-red-400 hover:underline"
        >
          Quitar foto
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Modal de creación/edición
// ──────────────────────────────────────────────────────────────
function PlayerFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<Player>;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? '',
    nickname: initial?.nickname ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    handicap: initial?.handicap !== undefined ? String(initial.handicap) : '0',
    baseAverage: initial?.baseAverage !== undefined ? String(initial.baseAverage) : '0',
    photoUrl: initial?.photoUrl ?? '',
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError('El nombre completo es el único campo obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        fullName: form.fullName.trim(),
      };
      if (form.nickname.trim()) payload.nickname = form.nickname.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.photoUrl) payload.photoUrl = form.photoUrl;
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const h = form.handicap.trim() !== '' ? Number(form.handicap) : 0;
      payload.handicap = !isNaN(h) ? Math.round(h) : 0;

      const avg = form.baseAverage.trim() !== '' ? Number(form.baseAverage) : 0;
      payload.baseAverage = !isNaN(avg) ? avg : 0.0;

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar jugador');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-billiard-card border border-billiard-border shadow-2xl p-6 space-y-5 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-billiard-green" />
            <span>{initial?.id ? 'Editar Jugador' : 'Nuevo Jugador'}</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-billiard-felt text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Foto */}
          <div className="flex justify-center">
            <PhotoUpload
              value={form.photoUrl}
              onChange={(v) => setForm({ ...form, photoUrl: v })}
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre completo *</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              placeholder="Carlos Andrés Montoya"
            />
            <p className="text-[11px] text-gray-500 mt-1">Único campo requerido para registrar el jugador.</p>
          </div>

          {/* Apodo + Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Apodo / Alias (Opcional)</label>
              <input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
                placeholder="El Maestro"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Teléfono (Opcional)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Correo electrónico (Opcional)</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
              placeholder="jugador@email.com"
            />
          </div>

          {/* Handicap + Promedio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Hándicap (Opcional, defecto 0)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.handicap}
                onChange={(e) => setForm({ ...form, handicap: e.target.value })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Promedio base (Opcional, defecto 0.0)</label>
              <input
                type="number"
                step={0.001}
                min={0}
                value={form.baseAverage}
                onChange={(e) => setForm({ ...form, baseAverage: e.target.value })}
                className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
                placeholder="0.000"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notas internas (Opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-billiard-darker border border-billiard-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition resize-none"
              placeholder="Juega los viernes, categoría A..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-billiard-green hover:bg-emerald-400 disabled:opacity-50 text-billiard-darker font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-billiard-darker/40 border-t-billiard-darker rounded-full animate-spin" /><span>Guardando...</span></>
            ) : (
              <><CheckCircle className="w-4 h-4" /><span>Guardar Jugador</span></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Tarjeta expandida del jugador
// ──────────────────────────────────────────────────────────────
function PlayerCard({
  player,
  onEdit,
  onDelete,
}: {
  player: Player;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const wins = player.results.filter(r => r.position === 1).length;
  const podiums = player.results.filter(r => r.position <= 3).length;
  const totalPoints = player.results.reduce((acc, r) => acc + r.pointsAwarded, 0);
  const bestPos = player.results.length > 0 ? Math.min(...player.results.map(r => r.position)) : null;

  const medalColors: Record<number, string> = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-amber-600',
  };

  return (
    <div className={`rounded-2xl bg-billiard-card border transition-all duration-300 ${!player.isActive ? 'opacity-60' : 'hover:border-billiard-green/50 hover:shadow-lg hover:shadow-billiard-green/10'} border-billiard-border`}>
      {/* Header */}
      <div className="p-5 space-y-4">
        <div className="flex items-start space-x-4">
          <PlayerAvatar player={player} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-base leading-snug truncate">{player.fullName}</h3>
                {player.nickname && (
                  <span className="text-xs text-billiard-gold font-medium">"{player.nickname}"</span>
                )}
              </div>
              {!player.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 border border-gray-600 flex-shrink-0">
                  Inactivo
                </span>
              )}
            </div>

            {/* Contacto */}
            <div className="mt-1.5 space-y-0.5">
              {player.phone && (
                <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                  <Phone className="w-3 h-3" /> <span>{player.phone}</span>
                </div>
              )}
              {player.email && (
                <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                  <Mail className="w-3 h-3" /> <span className="truncate">{player.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-billiard-darker p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">Torneos</p>
            <p className="text-lg font-black text-white">{player._count.registrations}</p>
          </div>
          <div className="rounded-xl bg-billiard-darker p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">Victorias</p>
            <p className="text-lg font-black text-billiard-gold">{wins}</p>
          </div>
          <div className="rounded-xl bg-billiard-darker p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">Podios</p>
            <p className="text-lg font-black text-amber-500">{podiums}</p>
          </div>
          <div className="rounded-xl bg-billiard-darker p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">Pts</p>
            <p className="text-lg font-black text-emerald-400">{totalPoints}</p>
          </div>
        </div>

        {/* Hándicap y Promedio */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center space-x-2 bg-billiard-felt/50 rounded-lg px-3 py-2">
            <Target className="w-3.5 h-3.5 text-billiard-green flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400">Hándicap</p>
              <p className="text-sm font-bold text-white">{player.handicap} pts</p>
            </div>
          </div>
          <div className="flex-1 flex items-center space-x-2 bg-billiard-felt/50 rounded-lg px-3 py-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400">Promedio</p>
              <p className="text-sm font-bold text-white">{player.baseAverage > 0 ? player.baseAverage.toFixed(3) : '—'}</p>
            </div>
          </div>
          {bestPos && (
            <div className="flex-1 flex items-center space-x-2 bg-billiard-felt/50 rounded-lg px-3 py-2">
              <Award className={`w-3.5 h-3.5 ${medalColors[bestPos] || 'text-gray-400'} flex-shrink-0`} />
              <div>
                <p className="text-[10px] text-gray-400">Mejor pos.</p>
                <p className="text-sm font-bold text-white">#{bestPos}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        {player.notes && (
          <p className="text-xs text-gray-500 italic border-l-2 border-billiard-green/30 pl-2">{player.notes}</p>
        )}

        {/* Acciones */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-billiard-felt hover:bg-billiard-cardHover border border-billiard-border text-xs text-gray-300 transition"
          >
            <Activity className="w-3 h-3" />
            <span>Historial</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-billiard-felt hover:bg-billiard-cardHover border border-billiard-border text-xs text-gray-300 transition"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-gray-500 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Historial expandible */}
      {expanded && (
        <div className="border-t border-billiard-border px-5 pb-5 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historial de torneos</p>
          {player.results.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">Sin resultados registrados aún.</p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
              {player.results.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-billiard-darker rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-black ${medalColors[r.position] || 'text-gray-400'}`}>
                      #{r.position}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-white leading-tight">{r.tournament.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(r.tournament.startDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {r.pointsAwarded > 0 && (
                    <span className="text-xs text-billiard-green font-bold">+{r.pointsAwarded} pts</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Página principal de jugadores
// ──────────────────────────────────────────────────────────────
export default function PlayersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | undefined>(undefined);
  const [error, setError] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'wins' | 'points'>('name');

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Player[]>('/players');
      setPlayers(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar jugadores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchPlayers();
  }, [authLoading, user, router, fetchPlayers]);

  const handleSave = async (data: any) => {
    if (editPlayer?.id) {
      await apiRequest(`/players/${editPlayer.id}`, { method: 'PATCH', body: JSON.stringify(data) });
    } else {
      await apiRequest('/players', { method: 'POST', body: JSON.stringify(data) });
    }
    await fetchPlayers();
    setEditPlayer(undefined);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Desactivar este jugador? Su historial se conservará.')) return;
    try {
      await apiRequest(`/players/${id}`, { method: 'DELETE' });
      await fetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Error al desactivar');
    }
  };

  const wins = (p: Player) => p.results.filter(r => r.position === 1).length;
  const totalPoints = (p: Player) => p.results.reduce((acc, r) => acc + r.pointsAwarded, 0);

  let filtered = players
    .filter(p => `${p.fullName} ${p.nickname || ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter(p => filterActive === 'all' ? true : filterActive === 'active' ? p.isActive : !p.isActive);

  if (sortBy === 'wins') filtered = [...filtered].sort((a, b) => wins(b) - wins(a));
  else if (sortBy === 'points') filtered = [...filtered].sort((a, b) => totalPoints(b) - totalPoints(a));
  else filtered = [...filtered].sort((a, b) => a.fullName.localeCompare(b.fullName));

  const activeCount = players.filter(p => p.isActive).length;

  if (authLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-billiard-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-billiard-card via-billiard-cardHover to-billiard-felt/30 border border-billiard-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-billiard-green/20 to-emerald-600/10 border border-billiard-green/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-billiard-green" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Directorio de Jugadores</h1>
              <p className="text-xs text-gray-400">
                <span className="text-billiard-green font-semibold">{activeCount}</span> activos · {players.length} total
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEditPlayer(undefined); setShowModal(true); }}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-sm shadow-lg transition-all hover:scale-105 hover:shadow-billiard-green/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Jugador</span>
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-billiard-darker/60 border border-billiard-border p-3 text-center">
            <Trophy className="w-4 h-4 text-billiard-gold mx-auto mb-1" />
            <p className="text-lg font-black text-white">{players.reduce((acc, p) => acc + wins(p), 0)}</p>
            <p className="text-[10px] text-gray-400">Victorias totales</p>
          </div>
          <div className="rounded-xl bg-billiard-darker/60 border border-billiard-border p-3 text-center">
            <Star className="w-4 h-4 text-billiard-green mx-auto mb-1" />
            <p className="text-lg font-black text-white">{players.reduce((acc, p) => acc + totalPoints(p), 0)}</p>
            <p className="text-[10px] text-gray-400">Puntos otorgados</p>
          </div>
          <div className="rounded-xl bg-billiard-darker/60 border border-billiard-border p-3 text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-black text-white">{players.reduce((acc, p) => acc + p._count.registrations, 0)}</p>
            <p className="text-[10px] text-gray-400">Inscripciones</p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o apodo..."
            className="w-full bg-billiard-card border border-billiard-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-billiard-green transition"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition ${filterActive === f ? 'bg-billiard-green text-billiard-darker border-billiard-green' : 'bg-billiard-card border-billiard-border text-gray-400 hover:text-white'}`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl text-xs font-medium border bg-billiard-card border-billiard-border text-gray-400 focus:outline-none focus:border-billiard-green transition"
          >
            <option value="name">A-Z</option>
            <option value="wins">Victorias</option>
            <option value="points">Puntos</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid de jugadores */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-billiard-card border border-billiard-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-billiard-border p-16 text-center bg-billiard-card/30 space-y-3">
          <Users className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-gray-400 font-medium">No hay jugadores</p>
          <p className="text-gray-500 text-xs">
            {search ? 'Ningún jugador coincide con tu búsqueda.' : '¡Agrega el primer jugador del club!'}
          </p>
          {!search && (
            <button
              onClick={() => { setEditPlayer(undefined); setShowModal(true); }}
              className="mx-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-billiard-green/10 hover:bg-billiard-green/20 border border-billiard-green/30 text-billiard-green text-xs font-medium transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Agregar Jugador</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={() => { setEditPlayer(player); setShowModal(true); }}
              onDelete={() => handleDelete(player.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlayerFormModal
          initial={editPlayer}
          onClose={() => { setShowModal(false); setEditPlayer(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
