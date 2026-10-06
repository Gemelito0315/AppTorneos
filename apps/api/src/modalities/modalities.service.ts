import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.modalidad.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.modalidad.findUnique({
      where: { id },
    });
  }
}
