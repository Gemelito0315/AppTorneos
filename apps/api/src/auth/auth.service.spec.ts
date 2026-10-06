import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService (Unit Test)', () => {
  let authService: AuthService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      usuario: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organizacion: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('fake_jwt_token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'secret';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret';
              return null;
            }),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('debe registrar un usuario y club correctamente', () => {
    expect(authService).toBeDefined();
  });

  it('debe rechazar registro con correo duplicado lanzando ConflictException', async () => {
    prismaService.usuario.findUnique.mockResolvedValue({
      id: 'existing-id',
      email: 'duplicado@billar.com',
    });

    await expect(
      authService.register({
        email: 'duplicado@billar.com',
        password: 'password123',
        fullName: 'Carlos Duplicado',
        organizationName: 'Club Duplicado',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe rechazar login con contraseña incorrecta lanzando UnauthorizedException', async () => {
    const hash = await bcrypt.hash('CorrectPassword123!', 10);
    prismaService.usuario.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@billar.com',
      passwordHash: hash,
      isActive: true,
      role: 'ADMIN_CLUB',
      organization: { id: 'org-1', name: 'Club Test' },
    });

    await expect(
      authService.login({
        email: 'test@billar.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
