import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Flujo E2E Completo y Aislamiento Multi-Tenant', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Asegurar que exista al menos una modalidad para las pruebas
    await prisma.modalidad.upsert({
      where: { code: '3_BANDAS' },
      update: {},
      create: {
        name: 'Tres Bandas',
        code: '3_BANDAS',
        description: 'Modalidad de prueba',
        isDefault: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const timestamp = Date.now();
  let adminAToken = '';
  let adminBToken = '';
  let tournamentIdA = '';
  let modalityId = '';

  it('1. Registro de Club A y su Administrador', async () => {
    const emailA = `admina_${timestamp}@billarclub.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: emailA,
        password: 'Password123!',
        fullName: 'Admin Club A',
        organizationName: `Club Billar A ${timestamp}`,
        city: 'Medellín',
      })
      .expect(201);

    expect(res.body.tokens).toBeDefined();
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(emailA);
    expect(res.body.organization.name).toBe(`Club Billar A ${timestamp}`);
  });

  it('2. Login de Admin Club A', async () => {
    const emailA = `admina_${timestamp}@billarclub.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: emailA,
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.tokens.accessToken).toBeDefined();
    adminAToken = res.body.tokens.accessToken;
  });

  it('3. Obtener modalidades para crear el torneo', async () => {
    const res = await request(app.getHttpServer())
      .get('/modalities')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    modalityId = res.body[0].id;
  });

  it('4. Admin Club A crea un torneo en su club', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 86400000).toISOString();
    const endDate = new Date(now.getTime() + 86400000 * 3).toISOString();

    const res = await request(app.getHttpServer())
      .post('/tournaments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: `Gran Torneo Abierto ${timestamp}`,
        venue: 'Sede Principal Club A',
        startDate,
        endDate,
        modalityId,
        status: 'REGISTRATION_OPEN',
        isPublic: true,
        description: 'Torneo oficial del Club A',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe(`Gran Torneo Abierto ${timestamp}`);
    tournamentIdA = res.body.id;
  });

  it('5. Registro y Login de Club B (Organización competidora)', async () => {
    const emailB = `adminb_${timestamp}@otroclub.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: emailB,
        password: 'Password123!',
        fullName: 'Admin Club B',
        organizationName: `Club Billar B ${timestamp}`,
        city: 'Cali',
      })
      .expect(201);

    adminBToken = res.body.tokens.accessToken;
  });

  it('6. VERIFICACIÓN DE AISLAMIENTO: Club B NO puede ver el torneo privado de Club A (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .get(`/tournaments/${tournamentIdA}`)
      .set('Authorization', `Bearer ${adminBToken}`)
      .expect(403);
  });

  it('7. VERIFICACIÓN DE AISLAMIENTO: Club B NO puede editar el torneo de Club A (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .put(`/tournaments/${tournamentIdA}`)
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({ name: 'Intento de hackeo de nombre' })
      .expect(403);
  });

  it('8. VISTA PÚBLICA: Un usuario público (sin login) puede ver el torneo público por URL', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tournaments/public/${tournamentIdA}`)
      .expect(200);

    expect(res.body.id).toBe(tournamentIdA);
    expect(res.body.name).toBe(`Gran Torneo Abierto ${timestamp}`);
    expect(res.body.modality).toBeDefined();
    expect(res.body.organization).toBeDefined();
  });
});
