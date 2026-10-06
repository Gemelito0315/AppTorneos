import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ModalitiesModule } from './modalities/modalities.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { PlayersModule } from './players/players.module';
import { CircuitsModule } from './circuits/circuits.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { MatchesModule } from './matches/matches.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 peticiones por minuto por IP
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    OrganizationsModule,
    ModalitiesModule,
    TournamentsModule,
    PlayersModule,
    CircuitsModule,
    RegistrationsModule,
    MatchesModule,
    PublicModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
