import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  organizationId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          detailsJson: params.details ? JSON.stringify(params.details) : null,
          organizationId: params.organizationId || null,
          userId: params.userId || null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      this.logger.error(`Error guardando log de auditoría (${params.action}):`, error);
      // No rompemos la transacción principal si la auditoría falla
      return null;
    }
  }

  async findByOrganization(organizationId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
