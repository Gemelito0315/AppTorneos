import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CircuitsService } from './circuits.service';
import { CreateCircuitDto } from './dto/create-circuit.dto';
import { UpdateCircuitDto } from './dto/update-circuit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Circuitos/Ligas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('circuits')
export class CircuitsController {
  constructor(private readonly service: CircuitsService) {}

  @Post()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Crear un circuito/liga con incentivos' })
  create(@Request() req, @Body() dto: CreateCircuitDto) {
    return this.service.create(req.user.organizationId, dto);
  }

  @Get()
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Listar todos los circuitos del club' })
  findAll(@Request() req) {
    return this.service.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'ARBITRO', 'SUPERADMIN')
  @ApiOperation({ summary: 'Ver marcador y rachas de un circuito' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @Roles('ADMIN_CLUB', 'ORGANIZADOR', 'SUPERADMIN')
  @ApiOperation({ summary: 'Actualizar circuito' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCircuitDto) {
    return this.service.update(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN_CLUB', 'SUPERADMIN')
  @ApiOperation({ summary: 'Eliminar circuito' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.organizationId, id);
  }
}
