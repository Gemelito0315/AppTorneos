-- CreateTable
CREATE TABLE "JugadorClub" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "handicap" INTEGER NOT NULL DEFAULT 0,
    "baseAverage" REAL NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "JugadorClub_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircuitoLiga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "incentiveRule" TEXT,
    "targetStreak" INTEGER NOT NULL DEFAULT 3,
    "pointsRuleJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "CircuitoLiga_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "seedNumber" INTEGER,
    "handicap" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "Inscripcion_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Torneo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inscripcion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "JugadorClub" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultadoTorneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "ResultadoTorneo_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Torneo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResultadoTorneo_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "JugadorClub" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Torneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "posterUrl" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "entryFee" REAL,
    "lateEntryFee" REAL,
    "maxParticipants" INTEGER,
    "caromsTarget" INTEGER,
    "inningsLimit" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    "modalityId" TEXT NOT NULL,
    "circuitId" TEXT,
    CONSTRAINT "Torneo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Torneo_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "Modalidad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Torneo_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "CircuitoLiga" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Torneo" ("contactEmail", "contactPhone", "createdAt", "description", "endDate", "id", "isPublic", "modalityId", "name", "organizationId", "posterUrl", "startDate", "status", "updatedAt", "venue") SELECT "contactEmail", "contactPhone", "createdAt", "description", "endDate", "id", "isPublic", "modalityId", "name", "organizationId", "posterUrl", "startDate", "status", "updatedAt", "venue" FROM "Torneo";
DROP TABLE "Torneo";
ALTER TABLE "new_Torneo" RENAME TO "Torneo";
CREATE INDEX "Torneo_organizationId_idx" ON "Torneo"("organizationId");
CREATE INDEX "Torneo_modalityId_idx" ON "Torneo"("modalityId");
CREATE INDEX "Torneo_circuitId_idx" ON "Torneo"("circuitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "JugadorClub_organizationId_idx" ON "JugadorClub"("organizationId");

-- CreateIndex
CREATE INDEX "CircuitoLiga_organizationId_idx" ON "CircuitoLiga"("organizationId");

-- CreateIndex
CREATE INDEX "Inscripcion_tournamentId_idx" ON "Inscripcion"("tournamentId");

-- CreateIndex
CREATE INDEX "Inscripcion_playerId_idx" ON "Inscripcion"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_tournamentId_playerId_key" ON "Inscripcion"("tournamentId", "playerId");

-- CreateIndex
CREATE INDEX "ResultadoTorneo_tournamentId_idx" ON "ResultadoTorneo"("tournamentId");

-- CreateIndex
CREATE INDEX "ResultadoTorneo_playerId_idx" ON "ResultadoTorneo"("playerId");
