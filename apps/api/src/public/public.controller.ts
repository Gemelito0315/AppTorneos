import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CircuitsService } from '../circuits/circuits.service';

/**
 * Controlador público: sin autenticación, acceso libre para visitantes.
 * Permite ver torneos y circuitos de un club por su slug.
 */
@ApiTags('Público (sin autenticación)')
@Controller('public')
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly circuitsService: CircuitsService,
  ) {}

  /**
   * Devuelve todas las organizaciones/clubes registrados con estadísticas.
   */
  @Get('organizations')
  @ApiOperation({ summary: 'Listar todos los clubes registrados' })
  async getAllOrganizations() {
    const orgs = await this.prisma.organizacion.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        city: true,
        country: true,
        createdAt: true,
        _count: {
          select: {
            tournaments: true,
            players: true,
          },
        },
      },
    });

    return orgs;
  }

  /**
   * Devuelve los torneos públicos de una organización identificada por su slug.
   */
  @Get('organizations/:slug/tournaments')
  @ApiOperation({ summary: 'Ver torneos públicos de un club por slug' })
  @ApiParam({ name: 'slug', example: 'club-billar-medellin' })
  async getPublicTournaments(@Param('slug') slug: string) {
    const org = await this.prisma.organizacion.findUnique({ where: { slug } });
    if (!org) return { tournaments: [] };

    const tournaments = await this.prisma.torneo.findMany({
      where: { organizationId: org.id, isPublic: true },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        venue: true,
        startDate: true,
        endDate: true,
        status: true,
        posterUrl: true,
        entryFee: true,
        maxParticipants: true,
        modality: { select: { name: true, code: true } },
        circuit: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
    });

    return { organization: { name: org.name, slug: org.slug, city: org.city }, tournaments };
  }

  /**
   * Devuelve los circuitos públicos de una organización con su marcador.
   */
  @Get('organizations/:slug/circuits')
  @ApiOperation({ summary: 'Ver circuitos públicos de un club' })
  async getPublicCircuits(@Param('slug') slug: string) {
    const org = await this.prisma.organizacion.findUnique({ where: { slug } });
    if (!org) return { circuits: [] };

    const circuits = await this.prisma.circuitoLiga.findMany({
      where: { organizationId: org.id, isPublic: true, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, description: true, incentiveRule: true,
        targetStreak: true, status: true, startDate: true, endDate: true,
        _count: { select: { tournaments: true } },
      },
    });

    return { organization: { name: org.name, slug: org.slug }, circuits };
  }

  /**
   * Marcador detallado de un circuito (acceso público si isPublic=true).
   */
  @Get('organizations/:slug/circuits/:circuitId')
  @ApiOperation({ summary: 'Marcador y rachas de un circuito público' })
  async getPublicCircuitDetail(
    @Param('slug') slug: string,
    @Param('circuitId') circuitId: string,
  ) {
    const org = await this.prisma.organizacion.findUnique({ where: { slug } });
    if (!org) return null;

    return this.circuitsService.findOne(org.id, circuitId, true);
  }
}
