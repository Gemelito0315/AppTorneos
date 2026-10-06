import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CircuitsModule } from '../circuits/circuits.module';

@Module({
  imports: [PrismaModule, CircuitsModule],
  controllers: [PublicController],
})
export class PublicModule {}
