import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Modalidades base de billar
  const modalities = [
    {
      name: 'Tres Bandas',
      code: '3_BANDAS',
      description: 'Modalidad reina del billar carambola a tres bandas.',
      isDefault: true,
    },
    {
      name: 'Libre (Carambola Libre)',
      code: 'LIBRE',
      description: 'Modalidad clásica de carambola sin restricción de bandas.',
      isDefault: true,
    },
    {
      name: 'Pool Bola 8',
      code: 'BOLA_8',
      description: 'Juego de billar pool con 15 bolas y bola 8 definitiva.',
      isDefault: true,
    },
    {
      name: 'Pool Bola 9',
      code: 'BOLA_9',
      description: 'Modalidad de rotación con bolas del 1 al 9.',
      isDefault: true,
    },
    {
      name: 'Pool Bola 10',
      code: 'BOLA_10',
      description: 'Modalidad de tiro cantado con bolas del 1 al 10.',
      isDefault: false,
    },
  ];

  for (const mod of modalities) {
    await prisma.modalidad.upsert({
      where: { code: mod.code },
      update: { name: mod.name, description: mod.description, isDefault: mod.isDefault },
      create: mod,
    });
  }
  console.log('✅ Modalidades cargadas con éxito.');

  // 2. Organización / Club de prueba
  const demoOrg = await prisma.organizacion.upsert({
    where: { slug: 'club-billar-los-maestros' },
    update: {},
    create: {
      name: 'Club de Billar Los Maestros',
      slug: 'club-billar-los-maestros',
      description: 'Club tradicional con 8 mesas de carambola y 4 mesas de pool.',
      city: 'Medellín',
      country: 'CO',
      email: 'contacto@losmaestrosbillar.com',
      phone: '+57 300 123 4567',
    },
  });
  console.log('✅ Club demo creado:', demoOrg.name);

  // 3. Usuario Administrador del Club
  const passwordHash = await bcrypt.hash('Admin12345!', 10);

  const adminClub = await prisma.usuario.upsert({
    where: { email: 'admin@losmaestrosbillar.com' },
    update: { passwordHash },
    create: {
      email: 'admin@losmaestrosbillar.com',
      passwordHash,
      fullName: 'Carlos Andrés Montoya',
      role: 'ADMIN_CLUB',
      organizationId: demoOrg.id,
      phone: '+57 300 123 4567',
    },
  });
  console.log('✅ Administrador de club creado:', adminClub.email);

  // 4. Usuario Superadmin Global
  const superAdmin = await prisma.usuario.upsert({
    where: { email: 'superadmin@billarpro.com' },
    update: { passwordHash },
    create: {
      email: 'superadmin@billarpro.com',
      passwordHash,
      fullName: 'Super Administrador Global',
      role: 'SUPERADMIN',
      phone: '+57 311 000 0000',
    },
  });
  console.log('✅ Superadmin global creado:', superAdmin.email);

  // 5. Torneo de demostración
  // 5. Circuito con incentivos de racha
  const demoCircuit = await prisma.circuitoLiga.upsert({
    where: { id: 'demo-circuit-los-maestros' },
    update: {},
    create: {
      id: 'demo-circuit-los-maestros',
      name: 'Circuito Master Nocturno 2026',
      description: 'Torneos semanales acumulativos de carambola a 3 bandas. ¡Gana 3 torneos seguidos para llevarte el gran premio!',
      incentiveRule: 'Taco Profesional Predator + $1.000.000 COP al tricampeón consecutivo',
      targetStreak: 3,
      pointsRuleJson: JSON.stringify({ '1': 10, '2': 6, '3': 4, '4': 2, other: 1 }),
      organizationId: demoOrg.id,
      status: 'ACTIVE',
      isPublic: true,
    },
  });
  console.log('✅ Circuito con incentivos creado:', demoCircuit.name);

  // 6. Jugadores del Club
  const demoPlayersData = [
    { fullName: 'Hubberney Cataño', nickname: 'El Campeón', handicap: 0, baseAverage: 1.385, phone: '+57 310 111 2233' },
    { fullName: 'Daniel Morales', nickname: 'El Tornado', handicap: 0, baseAverage: 1.290, phone: '+57 311 222 3344' },
    { fullName: 'Alexander Salazar', nickname: 'El Zorro', handicap: 0, baseAverage: 1.215, phone: '+57 312 333 4455' },
    { fullName: 'Carlos Campiño', nickname: 'El Cirujano', handicap: 0, baseAverage: 1.150, phone: '+57 313 444 5566' },
    { fullName: 'Henry Díaz', nickname: 'El Águila', handicap: 0, baseAverage: 1.080, phone: '+57 314 555 6677' },
    { fullName: 'Mauricio Aguilar', nickname: 'El Rayo', handicap: 2, baseAverage: 0.940, phone: '+57 315 666 7788' },
    { fullName: 'Julián Torres', nickname: 'El Mago', handicap: 2, baseAverage: 0.880, phone: '+57 316 777 8899' },
    { fullName: 'Andrés Felipe Londoño', nickname: 'Pipe', handicap: 4, baseAverage: 0.760, phone: '+57 317 888 9900' },
  ];

  const createdPlayers: any[] = [];
  for (const p of demoPlayersData) {
    let player = await prisma.jugadorClub.findFirst({
      where: { fullName: p.fullName, organizationId: demoOrg.id },
    });
    if (!player) {
      player = await prisma.jugadorClub.create({
        data: {
          ...p,
          organizationId: demoOrg.id,
        },
      });
    }
    createdPlayers.push(player);
  }
  console.log(`✅ ${createdPlayers.length} Jugadores de billar cargados.`);

  // 7. Torneo de demostración con partidas en vivo
  const mod3Bandas = await prisma.modalidad.findUnique({ where: { code: '3_BANDAS' } });
  if (mod3Bandas) {
    let tournament = await prisma.torneo.findFirst({
      where: { name: 'Campeonato Abierto de 3 Bandas 2026', organizationId: demoOrg.id },
    });

    const now = new Date();
    const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Empezó hoy
    const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    if (!tournament) {
      tournament = await prisma.torneo.create({
        data: {
          name: 'Campeonato Abierto de 3 Bandas 2026',
          description: 'Gran torneo abierto nacional con sistema de grupos y cuadro final a 30 carambolas.',
          venue: 'Sede Principal Club Los Maestros - Carrera 70 # 45-12',
          startDate,
          endDate,
          status: 'IN_PROGRESS',
          isPublic: true,
          contactPhone: '+57 300 123 4567',
          contactEmail: 'torneos@losmaestrosbillar.com',
          organizationId: demoOrg.id,
          modalityId: mod3Bandas.id,
          circuitId: demoCircuit.id,
          maxParticipants: 16,
          caromsTarget: 30,
          inningsLimit: 40,
        },
      });
    } else {
      tournament = await prisma.torneo.update({
        where: { id: tournament.id },
        data: {
          status: 'IN_PROGRESS',
          circuitId: demoCircuit.id,
          caromsTarget: 30,
          inningsLimit: 40,
        },
      });
    }

    // Inscribir a los 8 jugadores si no están
    for (let i = 0; i < createdPlayers.length; i++) {
      const p = createdPlayers[i];
      const exists = await prisma.inscripcion.findUnique({
        where: {
          tournamentId_playerId: {
            tournamentId: tournament.id,
            playerId: p.id,
          },
        },
      });
      if (!exists) {
        await prisma.inscripcion.create({
          data: {
            tournamentId: tournament.id,
            playerId: p.id,
            seedNumber: i + 1,
            handicap: p.handicap,
            status: 'CONFIRMED',
          },
        });
      }
    }
    console.log('✅ Inscripciones confirmadas en el torneo demo.');

    // Crear partidas de demostración si no existen
    const matchCount = await prisma.partida.count({
      where: { tournamentId: tournament.id },
    });

    if (matchCount === 0) {
      // Cuartos de Final (Finalizados con resultados y promedios)
      // M1: Hubberney Cataño (30 pts en 22 ent = 1.364) vs Pipe Londoño (18 pts en 22 ent = 0.818)
      await prisma.partida.create({
        data: {
          tournamentId: tournament.id,
          roundName: 'Cuartos de Final',
          matchNumber: 1,
          tableNumber: 1,
          status: 'FINISHED',
          player1Id: createdPlayers[0].id,
          player1Name: createdPlayers[0].fullName,
          player1Score: 30,
          player1Innings: 22,
          player1Average: 1.364,
          player1HighRun: 7,
          player2Id: createdPlayers[7].id,
          player2Name: createdPlayers[7].fullName,
          player2Score: 18,
          player2Innings: 22,
          player2Average: 0.818,
          player2HighRun: 4,
          totalInnings: 22,
          winnerId: createdPlayers[0].id,
          winnerName: createdPlayers[0].fullName,
        },
      });

      // M2: Daniel Morales (30 pts en 24 ent = 1.250) vs Julián Torres (24 pts en 24 ent = 1.000)
      await prisma.partida.create({
        data: {
          tournamentId: tournament.id,
          roundName: 'Cuartos de Final',
          matchNumber: 2,
          tableNumber: 2,
          status: 'FINISHED',
          player1Id: createdPlayers[1].id,
          player1Name: createdPlayers[1].fullName,
          player1Score: 30,
          player1Innings: 24,
          player1Average: 1.250,
          player1HighRun: 6,
          player2Id: createdPlayers[6].id,
          player2Name: createdPlayers[6].fullName,
          player2Score: 24,
          player2Innings: 24,
          player2Average: 1.000,
          player2HighRun: 5,
          totalInnings: 24,
          winnerId: createdPlayers[1].id,
          winnerName: createdPlayers[1].fullName,
        },
      });

      // M3: Alexander Salazar (30 pts en 26 ent = 1.154) vs Mauricio Aguilar (21 pts en 26 ent = 0.808)
      await prisma.partida.create({
        data: {
          tournamentId: tournament.id,
          roundName: 'Cuartos de Final',
          matchNumber: 3,
          tableNumber: 3,
          status: 'FINISHED',
          player1Id: createdPlayers[2].id,
          player1Name: createdPlayers[2].fullName,
          player1Score: 30,
          player1Innings: 26,
          player1Average: 1.154,
          player1HighRun: 8,
          player2Id: createdPlayers[5].id,
          player2Name: createdPlayers[5].fullName,
          player2Score: 21,
          player2Innings: 26,
          player2Average: 0.808,
          player2HighRun: 4,
          totalInnings: 26,
          winnerId: createdPlayers[2].id,
          winnerName: createdPlayers[2].fullName,
        },
      });

      // M4: Carlos Campiño (30 pts en 27 ent = 1.111) vs Henry Díaz (28 pts en 27 ent = 1.037)
      await prisma.partida.create({
        data: {
          tournamentId: tournament.id,
          roundName: 'Cuartos de Final',
          matchNumber: 4,
          tableNumber: 4,
          status: 'FINISHED',
          player1Id: createdPlayers[3].id,
          player1Name: createdPlayers[3].fullName,
          player1Score: 30,
          player1Innings: 27,
          player1Average: 1.111,
          player1HighRun: 5,
          player2Id: createdPlayers[4].id,
          player2Name: createdPlayers[4].fullName,
          player2Score: 28,
          player2Innings: 27,
          player2Average: 1.037,
          player2HighRun: 6,
          totalInnings: 27,
          winnerId: createdPlayers[3].id,
          winnerName: createdPlayers[3].fullName,
        },
      });

      // Semifinal 1 (EN VIVO / EN PROCESO): Hubberney Cataño vs Daniel Morales en Mesa 1
      await prisma.partida.create({
        data: {
          tournamentId: tournament.id,
          roundName: 'Semifinal',
          matchNumber: 5,
          tableNumber: 1,
          status: 'IN_PROGRESS',
          player1Id: createdPlayers[0].id,
          player1Name: createdPlayers[0].fullName,
          player1Score: 22,
          player1Innings: 15,
          player1Average: 1.467,
          player1HighRun: 8,
          player2Id: createdPlayers[1].id,
          player2Name: createdPlayers[1].fullName,
          player2Score: 19,
          player2Innings: 15,
          player2Average: 1.267,
          player2HighRun: 5,
          totalInnings: 15,
        },
      });

      // Semifinal 2 (PROGRAMADA): Alexander Salazar vs Carlos Campiño en Mesa 2
      await prisma.partida.create({
        data: {
          tournamentId: tournament.id,
          roundName: 'Semifinal',
          matchNumber: 6,
          tableNumber: 2,
          status: 'PENDING',
          player1Id: createdPlayers[2].id,
          player1Name: createdPlayers[2].fullName,
          player1Score: 0,
          player1Innings: 0,
          player1Average: 0.0,
          player2Id: createdPlayers[3].id,
          player2Name: createdPlayers[3].fullName,
          player2Score: 0,
          player2Innings: 0,
          player2Average: 0.0,
          totalInnings: 0,
        },
      });

      console.log('✅ Partidas de prueba (Cuartos finalizados y Semifinal en vivo) creadas.');
    }
  }

  console.log('🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
