import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo jugador perteneciente a una organización específica.
   */
  async create(organizationId: string, dto: CreatePlayerDto) {
    return this.prisma.jugadorClub.create({
      data: {
        fullName: dto.fullName.trim(),
        nickname: dto.nickname?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        handicap: dto.handicap !== undefined && dto.handicap !== null && !isNaN(Number(dto.handicap)) ? Math.round(Number(dto.handicap)) : 0,
        baseAverage: dto.baseAverage !== undefined && dto.baseAverage !== null && !isNaN(Number(dto.baseAverage)) ? Number(dto.baseAverage) : 0.0,
        photoUrl: dto.photoUrl || null,
        notes: dto.notes?.trim() || null,
        organizationId,
      },
    });
  }

  /**
   * Lista todos los jugadores de una organización, activos e inactivos.
   */
  async findAll(organizationId: string) {
    return this.prisma.jugadorClub.findMany({
      where: { organizationId },
      orderBy: { fullName: 'asc' },
      include: {
        // Contamos participaciones y victorias de forma eficiente
        results: {
          select: { position: true, pointsAwarded: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  /**
   * Devuelve los datos completos de un jugador, incluyendo su historial de torneos.
   */
  async findOne(organizationId: string, id: string) {
    const player = await this.prisma.jugadorClub.findFirst({
      where: { id, organizationId },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                startDate: true,
                status: true,
                circuit: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        registrations: {
          include: {
            tournament: {
              select: { id: true, name: true, startDate: true, status: true },
            },
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException(`Jugador con id ${id} no encontrado`);
    }
    return player;
  }

  /**
   * Actualiza los datos de un jugador.
   */
  async update(organizationId: string, id: string, dto: UpdatePlayerDto) {
    await this.findOne(organizationId, id); // Verifica existencia y pertenencia
    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.nickname !== undefined) data.nickname = dto.nickname?.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim() || null;
    if (dto.handicap !== undefined) data.handicap = dto.handicap !== null && !isNaN(Number(dto.handicap)) ? Math.round(Number(dto.handicap)) : 0;
    if (dto.baseAverage !== undefined) data.baseAverage = dto.baseAverage !== null && !isNaN(Number(dto.baseAverage)) ? Number(dto.baseAverage) : 0.0;
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl || null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;

    return this.prisma.jugadorClub.update({
      where: { id },
      data,
    });
  }

  /**
   * Elimina (soft-delete) un jugador marcándolo como inactivo.
   * Un jugador inactivo no aparece en nuevos torneos pero mantiene su historial.
   */
  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.jugadorClub.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
