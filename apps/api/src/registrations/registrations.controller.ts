import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import {
  BulkRegisterDto,
  RegisterPlayerDto,
  RegisterResultsDto,
} from './dto/registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Inscripciones y Resultados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('tournaments/:tournamentId/registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Inscribir un jugador en el torneo' })
  register(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: RegisterPlayerDto,
  ) {
    return this.service.register(req.user.organizationId, tournamentId, dto);
  }

  @Post('bulk')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Inscripción masiva de jugadores' })
  bulkRegister(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: BulkRegisterDto,
  ) {
    return this.service.bulkRegister(req.user.organizationId, tournamentId, dto);
  }

  @Get()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Ver inscritos de un torneo' })
  findAll(@Request() req, @Param('tournamentId') tournamentId: string) {
    return this.service.findAll(req.user.organizationId, tournamentId);
  }

  @Delete(':playerId')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Retirar inscripción de un jugador' })
  remove(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.service.remove(req.user.organizationId, tournamentId, playerId);
  }

  @Post(':playerId/replace')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Reemplazar jugador por otro de último momento' })
  replace(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Param('playerId') playerId: string,
    @Body() dto: { newPlayerId: string; removeOld?: boolean },
  ) {
    return this.service.replacePlayer(req.user.organizationId, tournamentId, playerId, dto);
  }

  @Post(':playerId/status')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Actualizar estado de inscripción (WITHDRAWN, CONFIRMED, etc)' })
  updateStatus(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Param('playerId') playerId: string,
    @Body() dto: { status: string; markWalkover?: boolean; removePendingMatches?: boolean },
  ) {
    return this.service.updateStatus(req.user.organizationId, tournamentId, playerId, dto);
  }


  @Post('results')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Registrar resultados finales del torneo' })
  registerResults(
    @Request() req,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: RegisterResultsDto,
  ) {
    return this.service.registerResults(req.user.organizationId, tournamentId, dto);
  }

  @Get('results')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Ver resultados de un torneo' })
  findResults(@Request() req, @Param('tournamentId') tournamentId: string) {
    return this.service.findResults(req.user.organizationId, tournamentId);
  }
}
