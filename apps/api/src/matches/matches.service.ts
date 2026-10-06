import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto, UpdateMatchDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateTournament(organizationId: string, tournamentId: string) {
    const tournament = await this.prisma.torneo.findFirst({
      where: { id: tournamentId, organizationId },
    });
    if (!tournament) {
      throw new NotFoundException(`Torneo no encontrado o no pertenece a su club`);
    }
    return tournament;
  }

  async create(organizationId: string, tournamentId: string, dto: CreateMatchDto) {
    await this.validateTournament(organizationId, tournamentId);

    const p1Score = dto.player1Score ?? 0;
    const p1Innings = dto.player1Innings ?? dto.totalInnings ?? 0;
    const p1Avg = p1Innings > 0 ? Number((p1Score / p1Innings).toFixed(3)) : 0.0;

    const p2Score = dto.player2Score ?? 0;
    const p2Innings = dto.player2Innings ?? dto.totalInnings ?? 0;
    const p2Avg = p2Innings > 0 ? Number((p2Score / p2Innings).toFixed(3)) : 0.0;

    const totalInnings = dto.totalInnings ?? Math.max(p1Innings, p2Innings);

    // Auto-detectar ganador si está marcado FINISHED
    let winnerId = dto.winnerId ?? null;
    let winnerName = dto.winnerName ?? null;
    if (dto.status === 'FINISHED' && !winnerId) {
      if (p1Score > p2Score) {
        winnerId = dto.player1Id ?? null;
        winnerName = dto.player1Name ?? null;
      } else if (p2Score > p1Score) {
        winnerId = dto.player2Id ?? null;
        winnerName = dto.player2Name ?? null;
      }
    }

    return this.prisma.partida.create({
      data: {
        tournamentId,
        roundName: dto.roundName,
        matchNumber: dto.matchNumber ?? 1,
        tableNumber: dto.tableNumber ?? null,
        status: dto.status ?? 'PENDING',
        player1Id: dto.player1Id ?? null,
        player1Name: dto.player1Name ?? null,
        player1Photo: dto.player1Photo ?? null,
        player1Score: p1Score,
        player1Innings: p1Innings,
        player1HighRun: dto.player1HighRun ?? 0,
        player1Average: p1Avg,
        player2Id: dto.player2Id ?? null,
        player2Name: dto.player2Name ?? null,
        player2Photo: dto.player2Photo ?? null,
        player2Score: p2Score,
        player2Innings: p2Innings,
        player2HighRun: dto.player2HighRun ?? 0,
        player2Average: p2Avg,
        totalInnings,
        winnerId,
        winnerName,
      },
    });
  }

  async update(organizationId: string, tournamentId: string, matchId: string, dto: UpdateMatchDto) {
    await this.validateTournament(organizationId, tournamentId);

    const match = await this.prisma.partida.findFirst({
      where: { id: matchId, tournamentId },
    });
    if (!match) {
      throw new NotFoundException(`Partida no encontrada`);
    }

    const p1Score = dto.player1Score !== undefined ? dto.player1Score : match.player1Score;
    const p1Innings = dto.player1Innings !== undefined ? dto.player1Innings : match.player1Innings;
    const p1Avg = p1Innings > 0 ? Number((p1Score / p1Innings).toFixed(3)) : 0.0;

    const p2Score = dto.player2Score !== undefined ? dto.player2Score : match.player2Score;
    const p2Innings = dto.player2Innings !== undefined ? dto.player2Innings : match.player2Innings;
    const p2Avg = p2Innings > 0 ? Number((p2Score / p2Innings).toFixed(3)) : 0.0;

    const totalInnings = dto.totalInnings !== undefined ? dto.totalInnings : Math.max(p1Innings, p2Innings);

    let winnerId = dto.winnerId !== undefined ? dto.winnerId : match.winnerId;
    let winnerName = dto.winnerName !== undefined ? dto.winnerName : match.winnerName;

    const status = dto.status ?? match.status;
    if (status === 'FINISHED' && !winnerId) {
      if (p1Score > p2Score) {
        winnerId = dto.player1Id ?? match.player1Id;
        winnerName = dto.player1Name ?? match.player1Name;
      } else if (p2Score > p1Score) {
        winnerId = dto.player2Id ?? match.player2Id;
        winnerName = dto.player2Name ?? match.player2Name;
      }
    }

    return this.prisma.partida.update({
      where: { id: matchId },
      data: {
        roundName: dto.roundName ?? match.roundName,
        matchNumber: dto.matchNumber ?? match.matchNumber,
        tableNumber: dto.tableNumber !== undefined ? dto.tableNumber : match.tableNumber,
        status,
        player1Id: dto.player1Id !== undefined ? dto.player1Id : match.player1Id,
        player1Name: dto.player1Name !== undefined ? dto.player1Name : match.player1Name,
        player1Photo: dto.player1Photo !== undefined ? dto.player1Photo : match.player1Photo,
        player1Score: p1Score,
        player1Innings: p1Innings,
        player1HighRun: dto.player1HighRun !== undefined ? dto.player1HighRun : match.player1HighRun,
        player1Average: p1Avg,
        player2Id: dto.player2Id !== undefined ? dto.player2Id : match.player2Id,
        player2Name: dto.player2Name !== undefined ? dto.player2Name : match.player2Name,
        player2Photo: dto.player2Photo !== undefined ? dto.player2Photo : match.player2Photo,
        player2Score: p2Score,
        player2Innings: p2Innings,
        player2HighRun: dto.player2HighRun !== undefined ? dto.player2HighRun : match.player2HighRun,
        player2Average: p2Avg,
        totalInnings,
        winnerId,
        winnerName,
      },
    });
  }

  async remove(organizationId: string, tournamentId: string, matchId: string) {
    await this.validateTournament(organizationId, tournamentId);
    return this.prisma.partida.delete({ where: { id: matchId } });
  }

  async removeAll(organizationId: string, tournamentId: string) {
    await this.validateTournament(organizationId, tournamentId);
    return this.prisma.partida.deleteMany({ where: { tournamentId } });
  }

  async createBulk(organizationId: string, tournamentId: string, dtos: CreateMatchDto[]) {
    await this.validateTournament(organizationId, tournamentId);
    const created: any[] = [];
    for (const dto of dtos) {
      const item = await this.create(organizationId, tournamentId, dto);
      created.push(item);
    }
    return created;
  }

  async findAll(tournamentId: string) {
    return this.prisma.partida.findMany({
      where: { tournamentId },
      orderBy: [{ matchNumber: 'asc' }, { roundName: 'asc' }],
    });
  }
}
