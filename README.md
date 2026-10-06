# 🎱 Plataforma Web para Campeonatos de Billar (BillarPro)

Plataforma integral y multi-club para la organización y gestión de campeonatos de billar (Carambola a Tres Bandas, Bola 8, Bola 9, Bola 10 y Libre), con soporte para torneos rápidos de club y abiertos nacionales, aislamiento multi-tenant y sorteos determinísticos verificables.

---

## 🏗️ Arquitectura del Monorepo

```text
plataforma-billar/
├── apps/
│   ├── api/                  # Backend REST en NestJS + Prisma ORM + Swagger
│   └── web/                  # Frontend en Next.js 14 (App Router) + Tailwind CSS + i18n
├── packages/
│   └── shared/               # Tipos TypeScript, constantes y motor determinístico del sorteo
├── package.json              # Workspaces y scripts raíz
├── .env.example              # Variables de entorno modelo
└── README.md                 # Guía paso a paso para Windows 10
```

---

## ⚙️ Requisitos Previos

- **Sistema Operativo**: Windows 10 (compatible con PowerShell y CMD).
- **Node.js**: v18 o superior (detectado v24+).
- **NPM**: v9 o superior (detectado v11+).
- **SQLite**: No requiere instalación de Docker ni software adicional; utiliza una base de datos local embebida (`apps/api/prisma/dev.db`), totalmente portable a PostgreSQL en producción.

> 💡 **Nota sobre PowerShell en Windows 10**:
> Si recibes el mensaje `No se puede cargar el archivo npm.ps1 porque la ejecución de scripts está deshabilitada`, puedes habilitarlo una sola vez ejecutando en PowerShell como Administrador:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> O simplemente puedes utilizar `npm.cmd` en lugar de `npm` (o utilizar CMD normal).

---

## 🚀 Puesta en Marcha Rápida (Paso a Paso)

Abre tu terminal en la carpeta raíz del proyecto (`plataforma-billar` o `AppTorneo`) y sigue estos sencillos pasos:

### 1. Clonar / Ubicarse e Instalar Dependencias
```powershell
npm.cmd install
```
*(o `npm install` en CMD)*

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` como `.env`:
```powershell
copy .env.example .env
```
*(Los valores por defecto funcionan de inmediato para desarrollo local)*

### 3. Crear Base de Datos y Aplicar Migraciones
Genera el cliente de Prisma y corre la migración inicial de SQLite:
```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
```

### 4. Precargar Datos Iniciales (Seed)
Carga las modalidades oficiales de billar (3 Bandas, Libre, Pool Bola 8, Pool Bola 9, Bola 10), el club demo *Club Los Maestros*, y usuarios de prueba:
```powershell
npm.cmd run db:seed
```

### 5. Iniciar la Aplicación Completa (Backend + Frontend)
```powershell
npm.cmd run dev
```

Esto levantará automáticamente ambos servicios en paralelo:
- 🌐 **Frontend Web**: [http://localhost:3000](http://localhost:3000)
- 🚀 **Backend API**: [http://localhost:4000](http://localhost:4000)
- 📚 **Documentación Swagger / OpenAPI**: [http://localhost:4000/docs](http://localhost:4000/docs)

---

## 🧪 Ejecución de Pruebas

Para verificar la integridad del código, la autenticación y el aislamiento multi-tenant:

```powershell
# Ejecutar todas las pruebas del monorepo
npm.cmd run test

# Probar únicamente el motor del sorteo determinístico
npm.cmd run test:shared

# Probar la API (Unitarias + E2E de Aislamiento Multi-Tenant)
npm.cmd run test:api
```

---

## 👥 Cuentas de Demostración Precargadas (Seed)

| Rol | Correo Electrónico | Contraseña | Club / Organización |
| :--- | :--- | :--- | :--- |
| **Admin de Club** | `admin@losmaestrosbillar.com` | `Admin12345!` | Club de Billar Los Maestros |
| **Superadmin Global** | `superadmin@billarpro.com` | `Admin12345!` | Global |

---

## 🛡️ Aislamiento Multi-Tenant (Seguridad y Privacidad)

- Cada torneo y registro operativo pertenece estrictamente a una organización (`organizationId`).
- Si un usuario del Club B intenta consultar o editar mediante la API privada un torneo del Club A, el backend responde automáticamente con `403 Forbidden`.
- La vista pública (`/tournaments/:id` o `/tournaments/public/:id`) permite a jugadores y aficionados ver los datos oficiales del torneo sin requerir cuenta ni contraseña.

---

## 🌐 Internacionalización (i18n)

La plataforma cuenta con selector de idioma en tiempo real ubicado en la barra de navegación:
- 🇪🇸 **Español (ES)** — Idioma predeterminado.
- 🇺🇸 **Inglés (EN)**
- 🇧🇷 **Portugués (PT)**
