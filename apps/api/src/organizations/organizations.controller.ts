import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ROLES } from '@billar/shared';

@ApiTags('Organizaciones (Clubes)')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('public/:slug')
  @ApiOperation({ summary: 'Obtener información pública de un club por su slug' })
  @ApiResponse({ status: 200, description: 'Datos del club y sus torneos públicos' })
  async getPublicBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Get('my-club')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del club al que pertenece el usuario autenticado' })
  async getMyClub(@CurrentUser() user: any) {
    if (!user.organizationId) {
      throw new ForbiddenException('No perteneces a ningún club');
    }
    return this.organizationsService.findOne(user.organizationId);
  }

  @Put('my-club')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN_CLUB, ROLES.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de mi club (Solo Administrador de Club)' })
  async updateMyClub(
    @CurrentUser() user: any,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No perteneces a ningún club');
    }
    const ip = req.ip || req.connection?.remoteAddress;
    return this.organizationsService.update(
      user.organizationId,
      dto,
      user.id,
      ip,
    );
  }
}
