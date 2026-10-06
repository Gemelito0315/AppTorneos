import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCircuitDto } from './dto/create-circuit.dto';
import { UpdateCircuitDto } from './dto/update-circuit.dto';

/**
 * Forma interna de un resultado de posición para calcular rachas.
 */
interface PlayerResult {
  playerId: string;
  position: number;
  pointsAwarded: number;
  tournamentDate: Date;
  tournamentId: string;
  tournamentName: string;
}

/**
 * Estadísticas por jugador dentro de un circuito.
 */
export interface PlayerCircuitStats {
  playerId: string;
  playerName: string;
  playerNickname: string | null;
  totalPoints: number;
  wins: number;          // veces en posición 1
  top3: number;          // veces en posición 1, 2 o 3
  tournamentsPlayed: number;
  currentStreak: number; // rachas de victorias consecutivas actuales
  maxStreak: number;     // racha máxima histórica en el circuito
  hasAchievedIncentive: boolean; // si ya logró la racha objetivo
  results: PlayerResult[];
}

@Injectable()
export class CircuitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo circuito/liga para una organización.
   */
  async create(organizationId: string, dto: CreateCircuitDto) {
    return this.prisma.circuitoLiga.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  /**
   * Lista todos los circuitos de la organización.
   */
  async findAll(organizationId: string) {
    return this.prisma.circuitoLiga.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tournaments: true },
        },
      },
    });
  }

  /**
   * Devuelve el detalle de un circuito con estadísticas completas.
   * Esta es la función principal: calcula puntos y rachas por jugador.
   */
  async findOne(organizationId: string, id: string, isPublicRequest = false) {
    const circuit = await this.prisma.circuitoLiga.findFirst({
      where: {
        id,
        organizationId,
        // Si es petición pública, solo mostrar circuitos públicos
        ...(isPublicRequest ? { isPublic: true } : {}),
      },
      include: {
        tournaments: {
          where: { status: { in: ['FINISHED', 'ONGOING'] } },
          orderBy: { startDate: 'asc' },
          include: {
            results: {
              include: {
                player: {
                  select: { id: true, fullName: true, nickname: true },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!circuit) {
      throw new NotFoundException(`Circuito con id ${id} no encontrado`);
    }

    // Calcular estadísticas de jugadores a partir de los resultados
    const stats = this.calculatePlayerStats(circuit.tournaments, circuit.targetStreak);

    return {
      ...circuit,
      leaderboard: stats,
    };
  }

  /**
   * Actualiza un circuito (nombre, incentivo, estado, etc.).
   */
  async update(organizationId: string, id: string, dto: UpdateCircuitDto) {
    await this.findOne(organizationId, id);
    return this.prisma.circuitoLiga.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Elimina un circuito. Los torneos quedan sin circuito (circuitId = null).
   */
  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.circuitoLiga.delete({ where: { id } });
  }

  // ============================================================
  // LÓGICA DE ESTADÍSTICAS Y RACHAS
  // ============================================================

  /**
   * Calcula el marcador (leaderboard) del circuito.
   * Algoritmo:
   * 1. Recopila todos los resultados de los torneos del circuito.
   * 2. Agrupa por jugador.
   * 3. Por jugador, ordena los torneos por fecha para calcular la racha actual.
   * 4. La racha se rompe cuando el jugador NO gana (posición > 1) en un torneo
   *    en el que sí participó, o cuando hay un torneo sin resultado para él.
   * 5. Ordena el leaderboard por: puntos totales desc → victorias desc → nombre asc.
   */
  private calculatePlayerStats(tournaments: any[], targetStreak: number): PlayerCircuitStats[] {
    const playerMap = new Map<string, PlayerCircuitStats>();

    // Recorrer todos los torneos en orden cronológico
    for (const tournament of tournaments) {
      for (const result of tournament.results) {
        const { player, position, pointsAwarded } = result;

        if (!playerMap.has(player.id)) {
          playerMap.set(player.id, {
            playerId: player.id,
            playerName: player.fullName,
            playerNickname: player.nickname,
            totalPoints: 0,
            wins: 0,
            top3: 0,
            tournamentsPlayed: 0,
            currentStreak: 0,
            maxStreak: 0,
            hasAchievedIncentive: false,
            results: [],
          });
        }

        const stats = playerMap.get(player.id)!;
        stats.totalPoints += pointsAwarded;
        stats.tournamentsPlayed += 1;
        if (position === 1) stats.wins += 1;
        if (position <= 3) stats.top3 += 1;

        stats.results.push({
          playerId: player.id,
          position,
          pointsAwarded,
          tournamentDate: tournament.startDate,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
        });
      }
    }

    // Calcular rachas para cada jugador
    for (const [, stats] of playerMap) {
      // Ordenar resultados por fecha ascendente
      stats.results.sort((a, b) => a.tournamentDate.getTime() - b.tournamentDate.getTime());

      let currentStreak = 0;
      let maxStreak = 0;

      for (const r of stats.results) {
        if (r.position === 1) {
          currentStreak += 1;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          // Si participó y no ganó, la racha se rompe
          currentStreak = 0;
        }
      }

      stats.currentStreak = currentStreak;
      stats.maxStreak = maxStreak;
      stats.hasAchievedIncentive = maxStreak >= targetStreak;
    }

    // Convertir a array y ordenar el marcador
    const leaderboard = Array.from(playerMap.values());
    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.playerName.localeCompare(b.playerName);
    });

    return leaderboard;
  }
}
