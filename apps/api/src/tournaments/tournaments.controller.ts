import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { ROLES } from '@billar/shared';

@ApiTags('Torneos')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ==========================================
  // RUTAS PÚBLICAS (Sin Autenticación)
  // ==========================================
  @Get('public')
  @ApiOperation({ summary: 'Listar todos los torneos públicos' })
  @ApiResponse({ status: 200, description: 'Lista de torneos públicos' })
  async findPublicAll() {
    return this.tournamentsService.findPublicAll();
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Ver detalles de un torneo público por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del torneo público' })
  @ApiResponse({ status: 404, description: 'Torneo no encontrado o no público' })
  async findPublicById(@Param('id') id: string) {
    return this.tournamentsService.findPublicById(id);
  }

  // ==========================================
  // RUTAS PRIVADAS (Aislamiento Multi-Tenant)
  // ==========================================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(ROLES.ADMIN_CLUB, ROLES.ORGANIZADOR, ROLES.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo torneo para mi organización/club' })
  @ApiResponse({ status: 201, description: 'Torneo creado exitosamente' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTournamentDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.tournamentsService.create(
      tenantId,
      dto,
      user.id,
      ip,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN_CLUB, ROLES.ORGANIZADOR, ROLES.ARBITRO, ROLES.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar torneos pertenecientes a la organización del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de torneos del club' })
  async findAll(@CurrentUser() user: any) {
    const isSuperAdmin = user.role === ROLES.SUPERADMIN;
    return this.tournamentsService.findAllByTenant(
      user.organizationId,
      isSuperAdmin,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de un torneo verificando aislamiento multi-tenant' })
  @ApiResponse({ status: 200, description: 'Torneo encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a torneo de otro club' })
  @ApiResponse({ status: 404, description: 'Torneo no encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const isSuperAdmin = user.role === ROLES.SUPERADMIN;
    return this.tournamentsService.findOneByTenant(
      id,
      user.organizationId,
      isSuperAdmin,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(ROLES.ADMIN_CLUB, ROLES.ORGANIZADOR, ROLES.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar torneo de mi organización' })
  @ApiResponse({ status: 200, description: 'Torneo actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a torneo de otro club' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTournamentDto,
    @Req() req: any,
  ) {
    const isSuperAdmin = user.role === ROLES.SUPERADMIN;
    const ip = req.ip || req.connection?.remoteAddress;
    return this.tournamentsService.updateByTenant(
      id,
      user.organizationId,
      isSuperAdmin,
      dto,
      user.id,
      ip,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(ROLES.ADMIN_CLUB, ROLES.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar torneo de mi organización' })
  @ApiResponse({ status: 200, description: 'Torneo eliminado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a torneo de otro club' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const isSuperAdmin = user.role === ROLES.SUPERADMIN;
    const ip = req.ip || req.connection?.remoteAddress;
    return this.tournamentsService.removeByTenant(
      id,
      user.organizationId,
      isSuperAdmin,
      user.id,
      ip,
    );
  }
}
