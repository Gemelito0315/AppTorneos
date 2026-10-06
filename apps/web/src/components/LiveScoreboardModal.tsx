'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Play, Pause, RotateCcw, Plus, Minus, Trophy,
  Save, AlertCircle, CheckCircle2, Maximize2, Minimize2,
  Volume2, VolumeX, Radio, Swords,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

interface LiveScoreboardModalProps {
  match: {
    id: string;
    roundName: string;
    matchNumber: number;
    tableNumber?: number | null;
    status: string;
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
  };
  tournamentId: string;
  caromsTarget?: number | null;
  inningsLimit?: number | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function LiveScoreboardModal({
  match,
  tournamentId,
  caromsTarget = 30,
  inningsLimit,
  onClose,
  onUpdated,
}: LiveScoreboardModalProps) {
  // Estado de jugadores y marcador
  const [p1Score, setP1Score] = useState(match.player1Score || 0);
  const [p2Score, setP2Score] = useState(match.player2Score || 0);
  const [p1Innings, setP1Innings] = useState(match.player1Innings || (match.totalInnings || 1));
  const [p2Innings, setP2Innings] = useState(match.player2Innings || (match.totalInnings || 1));
  const [p1HighRun, setP1HighRun] = useState(match.player1HighRun || 0);
  const [p2HighRun, setP2HighRun] = useState(match.player2HighRun || 0);
  const [p1CurrentRun, setP1CurrentRun] = useState(0);
  const [p2CurrentRun, setP2CurrentRun] = useState(0);

  // Turno activo (1 o 2)
  const [activeTurn, setActiveTurn] = useState<1 | 2>(1);

  // Estado del match
  const [status, setStatus] = useState<string>(match.status || 'IN_PROGRESS');
  const [winnerId, setWinnerId] = useState<string | null>(match.winnerId || null);

  // Reloj de Tiro (Shot Clock - 40 segundos reglamentarios de billar)
  const SHOT_CLOCK_DEFAULT = 40;
  const [timeLeft, setTimeLeft] = useState(SHOT_CLOCK_DEFAULT);
  const [timerRunning, setTimerRunning] = useState(false);
  const [hasExtension, setHasExtension] = useState<{ 1: boolean; 2: boolean }>({ 1: true, 2: true });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Referencia al contenedor para Fullscreen
  const containerRef = useRef<HTMLDivElement>(null);

  // Contador de Shot Clock
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Sonido de tiempo agotado
            if (soundEnabled && typeof window !== 'undefined') {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
              } catch {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, soundEnabled]);

  // Manejo de puntuación de Jugador 1
  const addP1Point = () => {
    setP1Score((prev) => {
      const next = prev + 1;
      const nextRun = p1CurrentRun + 1;
      setP1CurrentRun(nextRun);
      if (nextRun > p1HighRun) setP1HighRun(nextRun);
      return next;
    });
  };

  const removeP1Point = () => {
    setP1Score((prev) => Math.max(0, prev - 1));
    setP1CurrentRun((prev) => Math.max(0, prev - 1));
  };

  // Manejo de puntuación de Jugador 2
  const addP2Point = () => {
    setP2Score((prev) => {
      const next = prev + 1;
      const nextRun = p2CurrentRun + 1;
      setP2CurrentRun(nextRun);
      if (nextRun > p2HighRun) setP2HighRun(nextRun);
      return next;
    });
  };

  const removeP2Point = () => {
    setP2Score((prev) => Math.max(0, prev - 1));
    setP2CurrentRun((prev) => Math.max(0, prev - 1));
  };

  // Cambio de Turno (Pasa la bola al otro jugador)
  const switchTurn = () => {
    if (activeTurn === 1) {
      // P1 termina entrada
      setP1Innings((prev) => prev + 1);
      setP1CurrentRun(0);
      setActiveTurn(2);
    } else {
      // P2 termina entrada
      setP2Innings((prev) => prev + 1);
      setP2CurrentRun(0);
      setActiveTurn(1);
    }
    // Reiniciar Shot Clock a 40s
    setTimeLeft(SHOT_CLOCK_DEFAULT);
    setTimerRunning(true);
  };

  // Pedir prórroga / Extensión de tiempo (+30s)
  const useExtension = (player: 1 | 2) => {
    if (!hasExtension[player]) return;
    setTimeLeft((prev) => prev + 30);
    setHasExtension((prev) => ({ ...prev, [player]: false }));
  };

  // Guardar datos en el servidor
  const handleSave = async (finalize = false, chosenWinner?: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const currentWinner = finalize
        ? chosenWinner || (p1Score > p2Score ? match.player1Id : match.player2Id)
        : winnerId;

      const body = {
        roundName: match.roundName,
        matchNumber: match.matchNumber,
        tableNumber: match.tableNumber,
        status: finalize ? 'FINISHED' : 'IN_PROGRESS',
        player1Id: match.player1Id,
        player1Name: match.player1Name,
        player1Photo: match.player1Photo,
        player1Score: p1Score,
        player1Innings: p1Innings,
        player1HighRun: p1HighRun,
        player2Id: match.player2Id,
        player2Name: match.player2Name,
        player2Photo: match.player2Photo,
        player2Score: p2Score,
        player2Innings: p2Innings,
        player2HighRun: p2HighRun,
        totalInnings: Math.max(p1Innings, p2Innings),
        winnerId: currentWinner || null,
        winnerName:
          currentWinner === match.player1Id
            ? match.player1Name
            : currentWinner === match.player2Id
            ? match.player2Name
            : null,
      };

      await apiRequest(`/tournaments/${tournamentId}/matches/${match.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (finalize) {
        setStatus('FINISHED');
        setWinnerId(currentWinner || null);
      } else {
        setStatus('IN_PROGRESS');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar el marcador');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Promedios en tiempo real
  const p1Avg = p1Innings > 0 ? (p1Score / p1Innings).toFixed(3) : '0.000';
  const p2Avg = p2Innings > 0 ? (p2Score / p2Innings).toFixed(3) : '0.000';

  // Porcentaje hacia la meta
  const target = caromsTarget || 30;
  const p1Progress = Math.min(100, Math.round((p1Score / target) * 100));
  const p2Progress = Math.min(100, Math.round((p2Score / target) * 100));

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto select-none"
    >
      {/* ─── BARRA DE CONTROL SUPERIOR ─── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>MESA {match.tableNumber || 1} · {match.roundName}</span>
          </div>

          <span className="text-slate-400 hidden sm:inline">
            Meta: <strong className="text-white">{target} Carambolas</strong>
          </span>
          {inningsLimit && (
            <span className="text-slate-400 hidden sm:inline">
              Límite: <strong className="text-white">{inningsLimit} Entradas</strong>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold px-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sincronizado</span>
            </span>
          )}

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 transition"
            title="Cerrar marcador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/60 border-b border-red-700 text-red-200 text-xs px-4 py-2 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── CUERPO PRINCIPAL DEL MARCADOR ─── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* PANEL JUGADOR 1 (BOLA BLANCA)                            */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col justify-between rounded-3xl p-5 sm:p-7 border-2 transition-all relative overflow-hidden shadow-2xl ${
            activeTurn === 1
              ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500 shadow-emerald-950/40 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800 opacity-80'
          }`}
        >
          {/* Indicador de turno y bola */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-300 shadow-md flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-900">⚪</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  BOLA BLANCA
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white truncate max-w-[200px]">
                  {match.player1Name || 'Jugador 1'}
                </h2>
              </div>
            </div>

            {activeTurn === 1 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40 animate-pulse">
                AL TIRO
              </span>
            )}
          </div>

          {/* Gran Marcador Central */}
          <div className="my-6 text-center">
            <div
              onClick={addP1Point}
              className="cursor-pointer group select-none inline-flex flex-col items-center justify-center"
              title="Click para sumar 1 carambola"
            >
              <span className="text-8xl sm:text-9xl lg:text-[11rem] font-black tracking-tight leading-none text-white group-hover:scale-105 transition-transform">
                {p1Score}
              </span>
              <span className="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors mt-2">
                +1 carambola al tocar
              </span>
            </div>

            {/* Barra de progreso hacia la meta */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${p1Progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>{p1Progress}% completado</span>
              <span>Resta: {Math.max(0, target - p1Score)}</span>
            </div>
          </div>

          {/* Métricas: Entradas, Serie actual, Promedio */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 rounded-2xl p-3 border border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">ENTRADAS</span>
              <span className="text-xl font-bold text-white mt-0.5 block">{p1Innings}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SERIE ACT.</span>
              <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{p1CurrentRun}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">PROMEDIO</span>
              <span className="text-xl font-bold text-blue-400 mt-0.5 block">{p1Avg}</span>
            </div>
          </div>

          {/* Botones de control de puntos */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={removeP1Point}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-lg flex items-center justify-center space-x-1 transition active:scale-95"
            >
              <Minus className="w-5 h-5" />
              <span>-1</span>
            </button>

            <button
              onClick={addP1Point}
              className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center space-x-1 transition active:scale-95 shadow-lg shadow-emerald-950/50"
            >
              <Plus className="w-5 h-5" />
              <span>+1 PUNTO</span>
            </button>

            <button
              onClick={() => useExtension(1)}
              disabled={!hasExtension[1]}
              className={`px-3 py-3 rounded-xl text-xs font-bold border transition ${
                hasExtension[1]
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
              }`}
              title="Prórroga de 30 segundos (+1 time)"
            >
              +30s
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANEL JUGADOR 2 (BOLA AMARILLA)                          */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col justify-between rounded-3xl p-5 sm:p-7 border-2 transition-all relative overflow-hidden shadow-2xl ${
            activeTurn === 2
              ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-amber-500 shadow-amber-950/40 ring-2 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 opacity-80'
          }`}
        >
          {/* Indicador de turno y bola */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-amber-300 shadow-md flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-900">🟡</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  BOLA AMARILLA
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white truncate max-w-[200px]">
                  {match.player2Name || 'Jugador 2'}
                </h2>
              </div>
            </div>

            {activeTurn === 2 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40 animate-pulse">
                AL TIRO
              </span>
            )}
          </div>

          {/* Gran Marcador Central */}
          <div className="my-6 text-center">
            <div
              onClick={addP2Point}
              className="cursor-pointer group select-none inline-flex flex-col items-center justify-center"
              title="Click para sumar 1 carambola"
            >
              <span className="text-8xl sm:text-9xl lg:text-[11rem] font-black tracking-tight leading-none text-white group-hover:scale-105 transition-transform">
                {p2Score}
              </span>
              <span className="text-xs text-slate-500 group-hover:text-amber-400 transition-colors mt-2">
                +1 carambola al tocar
              </span>
            </div>

            {/* Barra de progreso hacia la meta */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden border border-slate-700">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${p2Progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>{p2Progress}% completado</span>
              <span>Resta: {Math.max(0, target - p2Score)}</span>
            </div>
          </div>

          {/* Métricas: Entradas, Serie actual, Promedio */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 rounded-2xl p-3 border border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">ENTRADAS</span>
              <span className="text-xl font-bold text-white mt-0.5 block">{p2Innings}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SERIE ACT.</span>
              <span className="text-xl font-bold text-amber-400 mt-0.5 block">{p2CurrentRun}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">PROMEDIO</span>
              <span className="text-xl font-bold text-blue-400 mt-0.5 block">{p2Avg}</span>
            </div>
          </div>

          {/* Botones de control de puntos */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={removeP2Point}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-lg flex items-center justify-center space-x-1 transition active:scale-95"
            >
              <Minus className="w-5 h-5" />
              <span>-1</span>
            </button>

            <button
              onClick={addP2Point}
              className="flex-[2] py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center space-x-1 transition active:scale-95 shadow-lg shadow-amber-950/50"
            >
              <Plus className="w-5 h-5" />
              <span>+1 PUNTO</span>
            </button>

            <button
              onClick={() => useExtension(2)}
              disabled={!hasExtension[2]}
              className={`px-3 py-3 rounded-xl text-xs font-bold border transition ${
                hasExtension[2]
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
              }`}
              title="Prórroga de 30 segundos (+1 time)"
            >
              +30s
            </button>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE CONTROL INFERIOR (RELOJ Y CAMBIO DE TURNO) ─── */}
      <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Reloj de Tiro Oficial (40s) */}
          <div className="flex items-center space-x-4 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-3">
              <div
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                <span className="block font-bold text-slate-300">SHOT CLOCK</span>
                <span>Reglamentario</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`p-2 rounded-xl transition ${
                  timerRunning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
                title={timerRunning ? 'Pausar reloj' : 'Iniciar reloj'}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setTimeLeft(SHOT_CLOCK_DEFAULT);
                  setTimerRunning(false);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
                title="Reiniciar a 40s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gran Botón: CAMBIAR ENTRADA / PASAR TURNO */}
          <button
            onClick={switchTurn}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm tracking-wide shadow-xl shadow-indigo-950/40 flex items-center justify-center space-x-2 transition active:scale-95"
          >
            <Swords className="w-5 h-5" />
            <span>CAMBIO DE TURNO (ENTRADA)</span>
          </button>

          {/* Botón: FINALIZAR PARTIDA */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const winnerName = p1Score >= p2Score ? match.player1Name : match.player2Name;
                const winnerId = p1Score >= p2Score ? match.player1Id : match.player2Id;
                if (confirm(`¿Finalizar partida y declarar ganador a "${winnerName}"?`)) {
                  handleSave(true, winnerId || undefined);
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-billiard-gold/20 hover:bg-billiard-gold/30 border border-billiard-gold/50 text-billiard-gold font-bold text-xs flex items-center justify-center space-x-2 transition"
            >
              <Trophy className="w-4 h-4" />
              <span>Finalizar Partida</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
