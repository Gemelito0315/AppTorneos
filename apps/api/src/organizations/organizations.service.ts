import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AUDIT_ACTIONS } from '@billar/shared';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findOne(id: string) {
    const org = await this.prisma.organizacion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tournaments: true,
            users: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organización no encontrada');
    }

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organizacion.findUnique({
      where: { slug },
      include: {
        tournaments: {
          where: { isPublic: true },
          include: { modality: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Club u organización no encontrada');
    }

    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    userId?: string,
    ipAddress?: string,
  ) {
    await this.findOne(id);

    const updated = await this.prisma.organizacion.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      action: AUDIT_ACTIONS.ORGANIZATION_UPDATED,
      entityType: 'Organizacion',
      entityId: id,
      organizationId: id,
      userId,
      details: dto as Record<string, any>,
      ipAddress,
    });

    return updated;
  }
}
