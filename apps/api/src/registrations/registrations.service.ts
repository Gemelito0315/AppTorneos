import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BulkRegisterDto,
  RegisterPlayerDto,
  RegisterResultsDto,
} from './dto/registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida que el torneo pertenezca a la organización.
   */
  private async validateTournament(organizationId: string, tournamentId: string) {
    const tournament = await this.prisma.torneo.findFirst({
      where: { id: tournamentId, organizationId },
    });
    if (!tournament) {
      throw new NotFoundException(`Torneo ${tournamentId} no encontrado`);
    }
    return tournament;
  }

  /**
   * Inscribe un jugador individual en un torneo.
   */
  async register(organizationId: string, tournamentId: string, dto: RegisterPlayerDto) {
    await this.validateTournament(organizationId, tournamentId);

    // Verificar que el jugador pertenezca a la organización
    const player = await this.prisma.jugadorClub.findFirst({
      where: { id: dto.playerId, organizationId },
    });
    if (!player) {
      throw new NotFoundException(`Jugador ${dto.playerId} no encontrado`);
    }

    // Verificar duplicados
    const existing = await this.prisma.inscripcion.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: dto.playerId } },
    });
    if (existing) {
      throw new ConflictException('El jugador ya está inscrito en este torneo');
    }

    return this.prisma.inscripcion.create({
      data: {
        tournamentId,
        playerId: dto.playerId,
        seedNumber: dto.seedNumber,
        handicap: dto.handicap ?? player.handicap,
        notes: dto.notes,
      },
      include: { player: true },
    });
  }

  /**
   * Inscripción masiva: agrega múltiples jugadores a la vez.
   * Omite los ya inscritos sin lanzar error.
   */
  async bulkRegister(organizationId: string, tournamentId: string, dto: BulkRegisterDto) {
    await this.validateTournament(organizationId, tournamentId);

    const results = { added: 0, skipped: 0, errors: [] as string[] };

    for (const playerId of dto.playerIds) {
      const player = await this.prisma.jugadorClub.findFirst({
        where: { id: playerId, organizationId },
      });
      if (!player) {
        results.errors.push(`Jugador ${playerId} no encontrado`);
        continue;
      }

      const existing = await this.prisma.inscripcion.findUnique({
        where: { tournamentId_playerId: { tournamentId, playerId } },
      });
      if (existing) {
        results.skipped += 1;
        continue;
      }

      await this.prisma.inscripcion.create({
        data: { tournamentId, playerId, handicap: player.handicap },
      });
      results.added += 1;
    }

    return results;
  }

  /**
   * Lista todos los inscritos en un torneo.
   */
  async findAll(organizationId: string, tournamentId: string) {
    await this.validateTournament(organizationId, tournamentId);
    return this.prisma.inscripcion.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: [{ seedNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Elimina la inscripción de un jugador y limpia sus partidas pendientes.
   */
  async remove(organizationId: string, tournamentId: string, playerId: string) {
    await this.validateTournament(organizationId, tournamentId);
    const inscription = await this.prisma.inscripcion.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId } },
    });
    if (!inscription) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    // Eliminar partidas pendientes del jugador para que no queden huérfanas
    await this.prisma.partida.deleteMany({
      where: {
        tournamentId,
        status: 'PENDING',
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
    });

    return this.prisma.inscripcion.delete({
      where: { tournamentId_playerId: { tournamentId, playerId } },
    });
  }

  /**
   * Actualiza el estado de la inscripción (ej: WITHDRAWN / Retirado o CONFIRMED).
   * Puede opcionalmente marcar W.O. en partidas pendientes o eliminarlas.
   */
  async updateStatus(
    organizationId: string,
    tournamentId: string,
    playerId: string,
    dto: { status: string; markWalkover?: boolean; removePendingMatches?: boolean },
  ) {
    const tournament = await this.validateTournament(organizationId, tournamentId);
    const inscription = await this.prisma.inscripcion.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId } },
      include: { player: true },
    });
    if (!inscription) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    const updated = await this.prisma.inscripcion.update({
      where: { tournamentId_playerId: { tournamentId, playerId } },
      data: { status: dto.status },
      include: { player: true },
    });

    if (dto.status === 'WITHDRAWN') {
      if (dto.markWalkover) {
        // Encontrar partidas pendientes
        const pendingMatches = await this.prisma.partida.findMany({
          where: {
            tournamentId,
            status: 'PENDING',
            OR: [{ player1Id: playerId }, { player2Id: playerId }],
          },
        });

        for (const match of pendingMatches) {
          const isPlayer1 = match.player1Id === playerId;
          const targetScore = tournament.caromsTarget || 15;
          await this.prisma.partida.update({
            where: { id: match.id },
            data: {
              status: 'FINISHED',
              winnerId: isPlayer1 ? match.player2Id : match.player1Id,
              winnerName: isPlayer1 ? match.player2Name : match.player1Name,
              player1Score: isPlayer1 ? 0 : targetScore,
              player2Score: isPlayer1 ? targetScore : 0,
              player1Innings: 0,
              player2Innings: 0,
              totalInnings: 0,
            },
          });
        }
      } else if (dto.removePendingMatches) {
        await this.prisma.partida.deleteMany({
          where: {
            tournamentId,
            status: 'PENDING',
            OR: [{ player1Id: playerId }, { player2Id: playerId }],
          },
        });
      }
    }

    return updated;
  }

  /**
   * Reemplaza a un jugador retirado por otro (sustitución de último momento).
   * Mantiene el seed, transfiere las partidas PENDING al nuevo jugador.
   */
  async replacePlayer(
    organizationId: string,
    tournamentId: string,
    oldPlayerId: string,
    dto: { newPlayerId: string; removeOld?: boolean },
  ) {
    await this.validateTournament(organizationId, tournamentId);

    const oldInscription = await this.prisma.inscripcion.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: oldPlayerId } },
    });
    if (!oldInscription) {
      throw new NotFoundException('Inscripción anterior no encontrada');
    }

    const newPlayer = await this.prisma.jugadorClub.findFirst({
      where: { id: dto.newPlayerId, organizationId },
    });
    if (!newPlayer) {
      throw new NotFoundException('Nuevo jugador no encontrado en el club');
    }

    // Verificar si ya está inscrito
    const alreadyRegistered = await this.prisma.inscripcion.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: dto.newPlayerId } },
    });
    if (alreadyRegistered) {
      throw new ConflictException('El nuevo jugador ya está inscrito en este torneo');
    }

    // 1. Crear inscripción para el nuevo jugador
    const newInscription = await this.prisma.inscripcion.create({
      data: {
        tournamentId,
        playerId: dto.newPlayerId,
        seedNumber: oldInscription.seedNumber,
        handicap: newPlayer.handicap,
        status: 'CONFIRMED',
      },
      include: { player: true },
    });

    // 2. Dar de baja o eliminar al anterior
    if (dto.removeOld) {
      await this.prisma.inscripcion.delete({
        where: { tournamentId_playerId: { tournamentId, playerId: oldPlayerId } },
      });
    } else {
      await this.prisma.inscripcion.update({
        where: { tournamentId_playerId: { tournamentId, playerId: oldPlayerId } },
        data: { status: 'WITHDRAWN' },
      });
    }

    // 3. Transferir partidas pendientes (PENDING) al nuevo jugador
    const pendingMatches = await this.prisma.partida.findMany({
      where: {
        tournamentId,
        status: 'PENDING',
        OR: [{ player1Id: oldPlayerId }, { player2Id: oldPlayerId }],
      },
    });

    for (const match of pendingMatches) {
      const updateData: any = {};
      if (match.player1Id === oldPlayerId) {
        updateData.player1Id = newPlayer.id;
        updateData.player1Name = newPlayer.fullName;
        updateData.player1Photo = newPlayer.photoUrl;
      }
      if (match.player2Id === oldPlayerId) {
        updateData.player2Id = newPlayer.id;
        updateData.player2Name = newPlayer.fullName;
        updateData.player2Photo = newPlayer.photoUrl;
      }
      await this.prisma.partida.update({
        where: { id: match.id },
        data: updateData,
      });
    }

    return newInscription;
  }


  /**
   * Registra los resultados finales de un torneo.
   * También calcula los puntos automáticamente desde el pointsRuleJson del circuito.
   */
  async registerResults(
    organizationId: string,
    tournamentId: string,
    dto: RegisterResultsDto,
  ) {
    const tournament = await this.prisma.torneo.findFirst({
      where: { id: tournamentId, organizationId },
      include: { circuit: true },
    });
    if (!tournament) {
      throw new NotFoundException(`Torneo ${tournamentId} no encontrado`);
    }

    // Obtener regla de puntos del circuito (si existe)
    let pointsRule: Record<string, number> = {};
    if (tournament.circuit?.pointsRuleJson) {
      try {
        pointsRule = JSON.parse(tournament.circuit.pointsRuleJson);
      } catch {
        pointsRule = {};
      }
    }

    // Verificar que no se dupliquen posiciones
    const positions = dto.results.map((r) => r.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      throw new BadRequestException('Dos jugadores no pueden compartir la misma posición');
    }

    // Eliminar resultados previos (para poder re-calcular si es necesario)
    await this.prisma.resultadoTorneo.deleteMany({ where: { tournamentId } });

    // Crear resultados con puntos calculados
    const created = await Promise.all(
      dto.results.map((r) => {
        const posKey = String(r.position);
        const points =
          r.pointsAwarded ??
          (pointsRule[posKey] !== undefined
            ? pointsRule[posKey]
            : (pointsRule['other'] ?? 0));

        return this.prisma.resultadoTorneo.create({
          data: {
            tournamentId,
            playerId: r.playerId,
            position: r.position,
            pointsAwarded: points,
          },
          include: { player: true },
        });
      }),
    );

    // Marcar el torneo como FINISHED
    await this.prisma.torneo.update({
      where: { id: tournamentId },
      data: { status: 'FINISHED' },
    });

    return created;
  }

  /**
   * Lista los resultados de un torneo.
   */
  async findResults(organizationId: string, tournamentId: string) {
    await this.validateTournament(organizationId, tournamentId);
    return this.prisma.resultadoTorneo.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { position: 'asc' },
    });
  }
}
