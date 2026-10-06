-- CreateTable
CREATE TABLE "Organizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "refreshTokenHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT,
    CONSTRAINT "Usuario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Modalidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Torneo" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    "modalityId" TEXT NOT NULL,
    CONSTRAINT "Torneo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Torneo_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "Modalidad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detailsJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,
    "userId" TEXT,
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizacion_slug_key" ON "Organizacion"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_organizationId_idx" ON "Usuario"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Modalidad_code_key" ON "Modalidad"("code");

-- CreateIndex
CREATE INDEX "Torneo_organizationId_idx" ON "Torneo"("organizationId");

-- CreateIndex
CREATE INDEX "Torneo_modalityId_idx" ON "Torneo"("modalityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
