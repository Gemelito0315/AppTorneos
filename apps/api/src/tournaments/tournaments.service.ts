import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { AUDIT_ACTIONS, TOURNAMENT_STATUS } from '@billar/shared';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateTournamentDto,
    userId: string,
    ipAddress?: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Se requiere una organización para crear un torneo');
    }

    const modality = await this.prisma.modalidad.findUnique({
      where: { id: dto.modalityId },
    });
    if (!modality) {
      throw new NotFoundException('La modalidad seleccionada no existe');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }

    const tournament = await this.prisma.torneo.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        venue: dto.venue,
        startDate,
        endDate,
        status: dto.status || TOURNAMENT_STATUS.DRAFT,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
        contactPhone: dto.contactPhone || null,
        contactEmail: dto.contactEmail || null,
        posterUrl: dto.posterUrl || null,
        organizationId,
        modalityId: dto.modalityId,
      },
      include: {
        modality: true,
        organization: true,
      },
    });

    await this.auditService.log({
      action: AUDIT_ACTIONS.TOURNAMENT_CREATED,
      entityType: 'Torneo',
      entityId: tournament.id,
      organizationId,
      userId,
      details: { name: tournament.name, modality: modality.name },
      ipAddress,
    });

    return tournament;
  }

  async findAllByTenant(organizationId: string, isSuperAdmin = false) {
    const where = isSuperAdmin ? {} : { organizationId };

    return this.prisma.torneo.findMany({
      where,
      include: {
        modality: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOneByTenant(
    id: string,
    organizationId: string,
    isSuperAdmin = false,
  ) {
    const tournament = await this.prisma.torneo.findUnique({
      where: { id },
      include: {
        modality: true,
        organization: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }

    // Aislamiento estricto multi-tenant:
    if (!isSuperAdmin && tournament.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Acceso denegado: este torneo pertenece a otra organización',
      );
    }

    return tournament;
  }

  async updateByTenant(
    id: string,
    organizationId: string,
    isSuperAdmin: boolean,
    dto: UpdateTournamentDto,
    userId: string,
    ipAddress?: string,
  ) {
    // Validar existencia y aislamiento
    const existing = await this.findOneByTenant(id, organizationId, isSuperAdmin);

    if (dto.modalityId) {
      const modality = await this.prisma.modalidad.findUnique({
        where: { id: dto.modalityId },
      });
      if (!modality) {
        throw new NotFoundException('La modalidad indicada no existe');
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (endDate < startDate) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }

    const updated = await this.prisma.torneo.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : existing.name,
        description: dto.description !== undefined ? dto.description : existing.description,
        venue: dto.venue !== undefined ? dto.venue : existing.venue,
        startDate,
        endDate,
        status: dto.status !== undefined ? dto.status : existing.status,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : existing.isPublic,
        contactPhone: dto.contactPhone !== undefined ? dto.contactPhone : existing.contactPhone,
        contactEmail: dto.contactEmail !== undefined ? dto.contactEmail : existing.contactEmail,
        posterUrl: dto.posterUrl !== undefined ? dto.posterUrl : existing.posterUrl,
        modalityId: dto.modalityId !== undefined ? dto.modalityId : existing.modalityId,
      },
      include: {
        modality: true,
        organization: true,
      },
    });

    await this.auditService.log({
      action: AUDIT_ACTIONS.TOURNAMENT_UPDATED,
      entityType: 'Torneo',
      entityId: id,
      organizationId: existing.organizationId,
      userId,
      details: dto as Record<string, any>,
      ipAddress,
    });

    return updated;
  }

  async removeByTenant(
    id: string,
    organizationId: string,
    isSuperAdmin: boolean,
    userId: string,
    ipAddress?: string,
  ) {
    const existing = await this.findOneByTenant(id, organizationId, isSuperAdmin);

    await this.prisma.torneo.delete({
      where: { id },
    });

    await this.auditService.log({
      action: AUDIT_ACTIONS.TOURNAMENT_DELETED,
      entityType: 'Torneo',
      entityId: id,
      organizationId: existing.organizationId,
      userId,
      details: { name: existing.name },
      ipAddress,
    });

    return { message: 'Torneo eliminado exitosamente' };
  }

  // Endpoints públicos (sin autenticación)
  async findPublicById(id: string) {
    const tournament = await this.prisma.torneo.findUnique({
      where: { id },
      include: {
        modality: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            logoUrl: true,
          },
        },
        registrations: {
          include: {
            player: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        matches: {
          orderBy: [
            { roundName: 'asc' },
            { matchNumber: 'asc' },
          ],
        },
        results: {
          include: {
            player: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!tournament || !tournament.isPublic) {
      throw new NotFoundException('Torneo público no encontrado');
    }

    return tournament;
  }

  async findPublicAll(limit = 20) {
    return this.prisma.torneo.findMany({
      where: { isPublic: true },
      include: {
        modality: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: limit,
    });
  }
}
