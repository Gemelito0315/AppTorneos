import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto, UpdateMatchDto } from './dto/match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Partidas y Marcador en Vivo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('tournaments/:tournamentId/matches')
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Post('bulk')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Crear múltiples partidas en lote' })
  createBulk(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Body() dtos: CreateMatchDto[],
  ) {
    return this.service.createBulk(req.user.organizationId, tournamentId, dtos);
  }

  @Post()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Crear una nueva partida en el torneo' })
  create(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreateMatchDto,
  ) {
    return this.service.create(req.user.organizationId, tournamentId, dto);
  }

  @Delete('all')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Eliminar todas las partidas del torneo' })
  removeAll(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
  ) {
    return this.service.removeAll(req.user.organizationId, tournamentId);
  }

  @Put(':matchId')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Actualizar marcador o resultado de una partida' })
  update(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchDto,
  ) {
    return this.service.update(req.user.organizationId, tournamentId, matchId, dto);
  }

  @Delete(':matchId')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Eliminar una partida' })
  remove(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.service.remove(req.user.organizationId, tournamentId, matchId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar partidas del torneo' })
  findAll(@Param('tournamentId') tournamentId: string) {
    return this.service.findAll(tournamentId);
  }
}
