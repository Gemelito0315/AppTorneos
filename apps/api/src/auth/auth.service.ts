import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ROLES, AUDIT_ACTIONS } from '@billar/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  async register(dto: RegisterDto, ipAddress?: string) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // Generar un slug único para el club
    let baseSlug = this.slugify(dto.organizationName);
    if (!baseSlug) {
      baseSlug = 'club-' + Date.now();
    }
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.organizacion.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Transacción: crear organización y usuario administrador del club
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organizacion.create({
        data: {
          name: dto.organizationName,
          slug,
          phone: dto.phone || null,
          city: dto.city || null,
          email: dto.email.toLowerCase(),
        },
      });

      const user = await tx.usuario.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
          role: ROLES.ADMIN_CLUB,
          phone: dto.phone || null,
          organizationId: org.id,
        },
      });

      return { org, user };
    });

    const tokens = await this.generateTokens(result.user.id, result.user.email, result.user.role, result.org.id);

    // Guardar hash del refresh token
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: result.user.id },
      data: { refreshTokenHash: refreshHash },
    });

    // Auditoría
    await this.auditService.log({
      action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
      entityType: 'Organizacion',
      entityId: result.org.id,
      organizationId: result.org.id,
      userId: result.user.id,
      details: { organizationName: result.org.name, slug: result.org.slug },
      ipAddress,
    });

    await this.auditService.log({
      action: AUDIT_ACTIONS.USER_REGISTERED,
      entityType: 'Usuario',
      entityId: result.user.id,
      organizationId: result.org.id,
      userId: result.user.id,
      details: { email: result.user.email, role: result.user.role },
      ipAddress,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        organizationId: result.org.id,
        phone: result.user.phone,
        isActive: result.user.isActive,
        createdAt: result.user.createdAt.toISOString(),
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        city: result.org.city,
        country: result.org.country,
        createdAt: result.org.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );

    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    await this.auditService.log({
      action: AUDIT_ACTIONS.USER_LOGIN,
      entityType: 'Usuario',
      entityId: user.id,
      organizationId: user.organizationId,
      userId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            city: user.organization.city,
            country: user.organization.country,
            createdAt: user.organization.createdAt.toISOString(),
          }
        : null,
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'cambiar_este_secreto_super_seguro_para_refresh_tokens_2026';

    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { organization: true },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Sesión no autorizada');
    }

    const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Token de refresco revocado');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.organizationId,
    );

    const newRefreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshHash },
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId?: string | null,
  ) {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'cambiar_este_secreto_super_seguro_para_access_tokens_2026';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'cambiar_este_secreto_super_seguro_para_refresh_tokens_2026';

    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '8h';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const payload = {
      sub: userId,
      email,
      role,
      organizationId: organizationId || null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
