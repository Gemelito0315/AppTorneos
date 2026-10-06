'use client';

import React from 'react';
import { Trophy, Radio, CheckCircle2, Clock } from 'lucide-react';

interface Match {
  id: string;
  roundName: string;
  matchNumber: number;
  tableNumber?: number | null;
  status: string;
  player1Id?: string | null;
  player1Name?: string | null;
  player1Photo?: string | null;
  player1Score: number;
  player1Innings?: number;
  player1Average?: number;
  player2Id?: string | null;
  player2Name?: string | null;
  player2Photo?: string | null;
  player2Score: number;
  player2Innings?: number;
  player2Average?: number;
  winnerId?: string | null;
  winnerName?: string | null;
}

interface TournamentBracketProps {
  matches: Match[];
  onSelectMatch?: (match: Match) => void;
  caromsTarget?: number | null;
}

export function TournamentBracket({ matches, onSelectMatch, caromsTarget }: TournamentBracketProps) {
  // Agrupar partidas por rondas eliminatorias
  const roundOrder = [
    { key: 'octavos', name: 'Octavos de Final', matchFilter: (m: Match) => m.roundName?.toLowerCase().includes('octav') },
    { key: 'cuartos', name: 'Cuartos de Final', matchFilter: (m: Match) => m.roundName?.toLowerCase().includes('cuart') },
    { key: 'semis', name: 'Semifinales', matchFilter: (m: Match) => m.roundName?.toLowerCase().includes('semi') },
    { key: 'final', name: 'Gran Final', matchFilter: (m: Match) => m.roundName?.toLowerCase().includes('final') && !m.roundName?.toLowerCase().includes('semi') && !m.roundName?.toLowerCase().includes('cuart') && !m.roundName?.toLowerCase().includes('octav') },
  ];

  const activeRounds = roundOrder
    .map(r => ({
      ...r,
      matches: matches.filter(r.matchFilter).sort((a, b) => a.matchNumber - b.matchNumber),
    }))
    .filter(r => r.matches.length > 0);

  if (activeRounds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-billiard-border p-12 text-center space-y-3 bg-billiard-card/30">
        <Trophy className="w-10 h-10 text-gray-500 mx-auto" />
        <p className="text-gray-300 font-semibold text-sm">No hay partidas de cuadro eliminatorio configuradas.</p>
        <p className="text-gray-500 text-xs">Crea partidas con rondas como "Cuartos de Final", "Semifinal" o "Final".</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera explicativa */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-billiard-card border border-billiard-border text-xs">
        <div className="flex items-center space-x-2 text-gray-300">
          <Trophy className="w-4 h-4 text-billiard-gold" />
          <span className="font-bold text-white">Cuadro Eliminatorio Oficial</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">Distancia objetivo: <strong className="text-emerald-400">{caromsTarget ? `${caromsTarget} carambolas` : 'Libre'}</strong></span>
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-gray-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            <span className="text-red-300 font-semibold">En Juego</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-300 font-semibold">Finalizada</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />
            <span>Programada</span>
          </span>
        </div>
      </div>

      {/* Árbol del Bracket en Scroll Horizontal */}
      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-billiard-border">
        <div className="inline-flex gap-8 lg:gap-12 min-w-full justify-start md:justify-center p-2">
          {activeRounds.map((round, rIdx) => (
            <div key={round.key} className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0 space-y-4">
              {/* Título de la ronda */}
              <div className="rounded-xl bg-billiard-card border border-billiard-border/80 px-4 py-2.5 text-center shadow-md">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400 block">
                  {round.name}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {round.matches.length} {round.matches.length === 1 ? 'partida' : 'partidas'}
                </span>
              </div>

              {/* Lista de Partidas en esta ronda */}
              <div className="flex flex-col justify-around flex-grow space-y-6">
                {round.matches.map((m) => {
                  const isLive = m.status === 'IN_PROGRESS';
                  const isFinished = m.status === 'FINISHED';
                  const p1Won = isFinished && m.winnerId && m.winnerId === m.player1Id;
                  const p2Won = isFinished && m.winnerId && m.winnerId === m.player2Id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMatch?.(m)}
                      className={`group relative rounded-2xl border transition-all duration-200 p-3.5 shadow-lg ${
                        onSelectMatch ? 'cursor-pointer hover:scale-[1.02]' : ''
                      } ${
                        isLive
                          ? 'bg-gradient-to-br from-billiard-card via-billiard-card to-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40'
                          : isFinished
                          ? 'bg-billiard-card/90 border-billiard-border hover:border-billiard-borderLight'
                          : 'bg-billiard-darker/60 border-billiard-border/60 hover:border-billiard-border'
                      }`}
                    >
                      {/* Cabecera del Match */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pb-2 mb-2 border-b border-billiard-border/50">
                        <span className="font-bold text-gray-300">Match #{m.matchNumber}</span>
                        {m.tableNumber && (
                          <span className="px-1.5 py-0.5 rounded bg-billiard-darker text-emerald-400 font-semibold border border-billiard-border">
                            Mesa {m.tableNumber}
                          </span>
                        )}
                        <div>
                          {isLive && (
                            <span className="inline-flex items-center space-x-1 text-red-400 font-black animate-pulse">
                              <Radio className="w-3 h-3" />
                              <span>VIVO</span>
                            </span>
                          )}
                          {isFinished && (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>FIN</span>
                            </span>
                          )}
                          {!isLive && !isFinished && (
                            <span className="inline-flex items-center space-x-1 text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>PROG</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Jugador 1 */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-xl transition ${
                          p1Won
                            ? 'bg-emerald-950/40 border border-emerald-500/40'
                            : isFinished && !p1Won
                            ? 'opacity-60 bg-billiard-darker/40'
                            : 'bg-billiard-darker/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-billiard-darker border border-billiard-border flex items-center justify-center flex-shrink-0">
                            {m.player1Photo ? (
                              <img src={m.player1Photo} alt={m.player1Name || 'J1'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-billiard-green">
                                {m.player1Name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '1'}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold truncate ${p1Won ? 'text-emerald-300' : 'text-white'}`}>
                            {m.player1Name || 'Por definir'}
                          </span>
                        </div>
                        <span className={`text-sm font-black flex-shrink-0 ${p1Won ? 'text-emerald-400 text-base' : 'text-gray-200'}`}>
                          {m.player1Score}
                        </span>
                      </div>

                      {/* Divisor / VS */}
                      <div className="my-1 text-center">
                        <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest">vs</span>
                      </div>

                      {/* Jugador 2 */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-xl transition ${
                          p2Won
                            ? 'bg-emerald-950/40 border border-emerald-500/40'
                            : isFinished && !p2Won
                            ? 'opacity-60 bg-billiard-darker/40'
                            : 'bg-billiard-darker/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-billiard-darker border border-billiard-border flex items-center justify-center flex-shrink-0">
                            {m.player2Photo ? (
                              <img src={m.player2Photo} alt={m.player2Name || 'J2'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-billiard-green">
                                {m.player2Name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '2'}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold truncate ${p2Won ? 'text-emerald-300' : 'text-white'}`}>
                            {m.player2Name || 'Por definir'}
                          </span>
                        </div>
                        <span className={`text-sm font-black flex-shrink-0 ${p2Won ? 'text-emerald-400 text-base' : 'text-gray-200'}`}>
                          {m.player2Score}
                        </span>
                      </div>

                      {/* Pie de Partida */}
                      {onSelectMatch && (
                        <div className="mt-2 pt-1.5 border-t border-billiard-border/40 text-[10px] text-right text-gray-400 group-hover:text-emerald-300 transition-colors">
                          Gestionar marcador →
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
