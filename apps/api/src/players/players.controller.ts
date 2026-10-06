import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Jugadores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly service: PlayersService) {}

  @Post()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Crear un jugador del club' })
  create(@Request() req, @Body() dto: CreatePlayerDto) {
    return this.service.create(req.user.organizationId, dto);
  }

  @Get()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Listar todos los jugadores del club' })
  findAll(@Request() req) {
    return this.service.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Detalle de un jugador (historial + rachas)' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Actualizar datos de un jugador' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.service.update(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN_CLUB', 'SUPERADMIN')
  @ApiOperation({ summary: 'Desactivar un jugador (soft-delete)' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.organizationId, id);
  }
}
