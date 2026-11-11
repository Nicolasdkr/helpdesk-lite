# 🎫 Helpdesk Lite

> Sistema de gestión de tickets de soporte TI · Full Stack con TypeScript

**Español** | [English](./README.en.md)

![Node](https://img.shields.io/badge/Node.js-26_LTS-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

<!-- TODO: añadir captura o GIF de la app cuando el frontend esté listo -->

## 📌 Descripción

**Helpdesk Lite** permite a los empleados de una organización reportar incidencias de TI y a los técnicos de soporte gestionarlas de principio a fin: asignación, priorización, seguimiento con comentarios y cierre.

**Problema que resuelve:** en equipos pequeños las incidencias llegan por correo, chat o de palabra y se pierden. Helpdesk Lite centraliza todo en un flujo trazable con estados y responsables claros.

## ✨ Funcionalidades

- [x] API REST con validación de datos y manejo de errores centralizado
- [x] Modelo de datos: usuarios, tickets y comentarios
- [ ] Autenticación con JWT y roles (`ADMIN`, `AGENT`, `USER`)
- [ ] CRUD de tickets con filtros por estado, prioridad y categoría
- [ ] Asignación de tickets a técnicos
- [ ] Comentarios en tickets
- [ ] Panel con métricas (tickets abiertos, por prioridad, tiempo de resolución)
- [ ] Frontend en React
- [ ] Integración continua con GitHub Actions

## 🛠️ Stack tecnológico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | React + Vite + TypeScript + Tailwind CSS | Estándar de la industria, arranque rápido |
| Backend | Node.js + Express 5 + TypeScript | Mismo lenguaje en todo el stack |
| Validación | Zod | Esquemas tipados reutilizables |
| ORM | Prisma 7 | Migraciones versionadas y tipos generados |
| Base de datos | PostgreSQL 17 | Relacional, robusta y gratuita |
| Tests | Vitest + Supertest | Rápidos y con sintaxis moderna |
| Infraestructura | Docker + Docker Compose | Un solo comando para levantar todo |

## 🏗️ Arquitectura

```
helpdesk-lite/
├── backend/
│   ├── prisma/              # Esquema y migraciones de la base de datos
│   ├── src/
│   │   ├── config/          # Variables de entorno validadas
│   │   ├── lib/             # Cliente de Prisma, errores HTTP
│   │   ├── middlewares/     # Auth, manejo de errores
│   │   ├── modules/         # Un módulo por dominio (routes → controller → service)
│   │   ├── app.ts           # Configuración de Express (testeable)
│   │   └── server.ts        # Punto de entrada
│   └── tests/
├── frontend/                # (próximamente)
├── docs/                    # Documentación adicional
└── docker-compose.yml
```

Cada módulo de dominio sigue una arquitectura en capas:

- **routes**: define endpoints y middlewares.
- **controller**: traduce HTTP ↔ datos (lee `req`, responde `res`).
- **service**: lógica de negocio; no conoce Express.
- **schemas**: validación de entrada con Zod.

## 🚀 Cómo ejecutarlo

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 24+](https://nodejs.org/) (solo para la opción B)

### Opción A — Todo con Docker (lo más rápido)

```bash
git clone https://github.com/<tu-usuario>/helpdesk-lite.git
cd helpdesk-lite
docker compose up --build
```

La API queda en http://localhost:3000/api/health

### Opción B — Desarrollo local (con recarga en caliente)

```bash
# 1. Levanta solo la base de datos
docker compose up -d db

# 2. Instala dependencias y configura el entorno
cd backend
cp .env.example .env
npm install

# 3. Aplica las migraciones y arranca
npm run db:migrate
npm run dev
```

### Scripts útiles (`backend/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | API con recarga automática |
| `npm test` | Ejecuta los tests |
| `npm run typecheck` | Verifica tipos de TypeScript |
| `npm run build` | Compila a JavaScript en `dist/` |
| `npm run db:migrate` | Crea/aplica migraciones |
| `npm run db:studio` | Explorador visual de la base de datos |

## 📡 API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/health/ready` | Estado de la conexión a la base de datos |

<!-- Se irá completando con auth, tickets y comentarios -->

## 🧪 Tests

```bash
cd backend
npm test
```

## 🗺️ Roadmap

Consulta las casillas de [Funcionalidades](#-funcionalidades). Ideas futuras: notificaciones por correo, adjuntos, SLA por prioridad.

## 🤝 Contribuir

Revisa [CONTRIBUTING.md](./CONTRIBUTING.md) para la convención de commits y ramas.

## 📄 Licencia

[MIT](./LICENSE)

## 👤 Autor

**&lt;Tu Nombre&gt;** — Desarrollador Full Stack Junior
[LinkedIn](https://linkedin.com/in/<tu-perfil>) · [GitHub](https://github.com/<tu-usuario>)
