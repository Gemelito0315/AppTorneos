import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsService } from './tournaments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TournamentsService - Aislamiento Multi-Tenant (Unit Test)', () => {
  let tournamentsService: TournamentsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      torneo: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      modalidad: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    tournamentsService = module.get<TournamentsService>(TournamentsService);
  });

  it('debe permitir a un club ver su propio torneo', async () => {
    const orgIdA = 'club-a-uuid';
    const tournamentId = 'torneo-123';

    prismaService.torneo.findUnique.mockResolvedValue({
      id: tournamentId,
      name: 'Torneo Club A',
      organizationId: orgIdA,
    });

    const result = await tournamentsService.findOneByTenant(tournamentId, orgIdA, false);
    expect(result).toBeDefined();
    expect(result.id).toBe(tournamentId);
    expect(result.organizationId).toBe(orgIdA);
  });

  it('debe lanzar ForbiddenException si el Club B intenta ver un torneo del Club A', async () => {
    const orgIdA = 'club-a-uuid';
    const orgIdB = 'club-b-uuid';
    const tournamentId = 'torneo-del-club-a';

    prismaService.torneo.findUnique.mockResolvedValue({
      id: tournamentId,
      name: 'Torneo Privado Club A',
      organizationId: orgIdA, // Pertenece al Club A
    });

    // Club B intenta consultar
    await expect(
      tournamentsService.findOneByTenant(tournamentId, orgIdB, false),
    ).rejects.toThrow(ForbiddenException);
  });

  it('debe lanzar ForbiddenException si el Club B intenta actualizar un torneo del Club A', async () => {
    const orgIdA = 'club-a-uuid';
    const orgIdB = 'club-b-uuid';
    const tournamentId = 'torneo-del-club-a';

    prismaService.torneo.findUnique.mockResolvedValue({
      id: tournamentId,
      name: 'Torneo Club A',
      organizationId: orgIdA,
    });

    await expect(
      tournamentsService.updateByTenant(
        tournamentId,
        orgIdB,
        false,
        { name: 'Intento de hack por Club B' },
        'user-b',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('debe permitir a SUPERADMIN ver torneos de cualquier club', async () => {
    const orgIdA = 'club-a-uuid';
    const tournamentId = 'torneo-123';

    prismaService.torneo.findUnique.mockResolvedValue({
      id: tournamentId,
      name: 'Torneo Club A',
      organizationId: orgIdA,
    });

    // SUPERADMIN pasa isSuperAdmin = true
    const result = await tournamentsService.findOneByTenant(tournamentId, 'otra-org-o-null', true);
    expect(result).toBeDefined();
    expect(result.organizationId).toBe(orgIdA);
  });
});
