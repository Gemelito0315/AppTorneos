import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ModalitiesService } from './modalities.service';

@ApiTags('Modalidades')
@Controller('modalities')
export class ModalitiesController {
  constructor(private readonly modalitiesService: ModalitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las modalidades de billar disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de modalidades' })
  async findAll() {
    return this.modalitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una modalidad por ID' })
  @ApiResponse({ status: 200, description: 'Modalidad encontrada' })
  @ApiResponse({ status: 404, description: 'Modalidad no encontrada' })
  async findOne(@Param('id') id: string) {
    const modality = await this.modalitiesService.findOne(id);
    if (!modality) {
      throw new NotFoundException('Modalidad no encontrada');
    }
    return modality;
  }
}
