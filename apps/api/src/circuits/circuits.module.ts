import { Module } from '@nestjs/common';
import { CircuitsController } from './circuits.controller';
import { CircuitsService } from './circuits.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CircuitsController],
  providers: [CircuitsService],
  exports: [CircuitsService],
})
export class CircuitsModule {}
