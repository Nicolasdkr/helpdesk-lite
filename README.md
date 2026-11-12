# 🎫 Helpdesk Lite

> Sistema de gestión de tickets de soporte TI · Full Stack con TypeScript

**Español** | [English](./README.en.md)

[![CI](https://github.com/Nicolasdkr/helpdesk-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/Nicolasdkr/helpdesk-lite/actions/workflows/ci.yml)
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
- [x] Autenticación con JWT y roles (`ADMIN`, `AGENT`, `USER`)
- [x] CRUD de tickets con filtros, búsqueda, orden y paginación
- [x] Asignación de tickets a técnicos y flujo de estados validado
- [x] Comentarios en tickets, con notas internas solo visibles para soporte
- [ ] Panel con métricas (tickets abiertos, por prioridad, tiempo de resolución)
- [ ] Frontend en React
- [x] Integración continua con GitHub Actions

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
git clone https://github.com/Nicolasdkr/helpdesk-lite.git
cd helpdesk-lite
docker compose up --build -d

# Crea los usuarios de demostración
docker compose exec backend npx prisma db seed
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

# 3. Aplica las migraciones, crea los usuarios demo y arranca
npm run db:migrate
npm run db:seed
npm run dev
```

### 🧰 Probar la API

- **VS Code:** abre [`backend/requests.http`](./backend/requests.http) con la extensión **REST Client** y pulsa *Send Request*.
- **Postman:** *Import* → [`docs/postman/helpdesk-lite.postman_collection.json`](./docs/postman/helpdesk-lite.postman_collection.json). Ejecuta primero los tres logins de la carpeta **Auth**: cada uno guarda su token automáticamente en las variables de la colección.

### 👥 Usuarios de demostración

Todos usan la contraseña `Password123!`

| Rol | Email | Puede |
|-----|-------|-------|
| ADMIN | `admin@helpdesk.dev` | Todo, incluida la gestión de usuarios |
| AGENT | `agent@helpdesk.dev` | Atender y resolver tickets |
| USER | `user@helpdesk.dev` | Crear y seguir sus propios tickets |

### Scripts útiles (`backend/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | API con recarga automática |
| `npm test` | Ejecuta los tests |
| `npm run typecheck` | Verifica tipos de TypeScript |
| `npm run build` | Compila a JavaScript en `dist/` |
| `npm run db:migrate` | Crea/aplica migraciones |
| `npm run db:seed` | Crea los usuarios y tickets de demostración |
| `npm run db:studio` | Explorador visual de la base de datos |

## 📡 API

Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`. El token se obtiene con `/api/auth/login`.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/health` | Público | Estado del servicio |
| GET | `/api/health/ready` | Público | Estado de la conexión a la base de datos |
| POST | `/api/auth/register` | Público | Registro (siempre con rol `USER`) |
| POST | `/api/auth/login` | Público | Inicio de sesión, devuelve un JWT |
| GET | `/api/auth/me` | Autenticado | Perfil del usuario actual |
| GET | `/api/users` | `ADMIN` | Lista de usuarios |
| GET | `/api/users/agents` | `AGENT`, `ADMIN` | Técnicos a los que se puede asignar un ticket |
| GET | `/api/tickets` | Autenticado | Lista paginada con filtros (ver abajo) |
| POST | `/api/tickets` | Autenticado | Crear un ticket |
| GET | `/api/tickets/:id` | Autenticado | Detalle de un ticket |
| PATCH | `/api/tickets/:id` | Creador, `AGENT`, `ADMIN` | Editar título, descripción, prioridad o categoría |
| PATCH | `/api/tickets/:id/status` | `AGENT`, `ADMIN` | Cambiar el estado |
| PATCH | `/api/tickets/:id/assign` | `AGENT`, `ADMIN` | Asignar o desasignar (`null`) un técnico |
| DELETE | `/api/tickets/:id` | `ADMIN` | Eliminar un ticket (y sus comentarios) |
| GET | `/api/tickets/:id/comments` | Autenticado | Comentarios del ticket, en orden cronológico |
| POST | `/api/tickets/:id/comments` | Autenticado | Comentar (`isInternal: true` solo `AGENT`/`ADMIN`) |
| DELETE | `/api/tickets/:id/comments/:commentId` | Autor, `ADMIN` | Borrar un comentario |

**Parámetros de `GET /api/tickets`:**

| Parámetro | Valores |
|-----------|---------|
| `status` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `category` | `HARDWARE`, `SOFTWARE`, `NETWORK`, `ACCESS`, `OTHER` |
| `assignedToId` | UUID de un técnico o `me` |
| `search` | Texto a buscar en título y descripción |
| `sort` / `order` | `createdAt`, `updatedAt` o `priority` / `asc` o `desc` |
| `page` / `pageSize` | Página (desde 1) / tamaño (máximo 50) |

La respuesta incluye `{ data: [...], meta: { page, pageSize, total, totalPages } }`.

### Reglas de negocio

| Acción | USER | AGENT | ADMIN |
|--------|:----:|:-----:|:-----:|
| Ver tickets | Solo los suyos | Todos | Todos |
| Crear ticket | ✅ | ✅ | ✅ |
| Editar título/descripción | Solo los suyos y mientras estén `OPEN` | ✅ | ✅ |
| Cambiar prioridad/categoría | ❌ | ✅ | ✅ |
| Cambiar estado / asignar | ❌ | ✅ | ✅ |
| Eliminar | ❌ | ❌ | ✅ |
| Comentar | En los suyos | ✅ | ✅ |
| Ver / escribir notas internas | ❌ | ✅ | ✅ |

**Flujo de estados:** `OPEN → IN_PROGRESS → RESOLVED → CLOSED`. Un ticket resuelto se puede reabrir (`RESOLVED → IN_PROGRESS`) y `CLOSED` es definitivo. Las transiciones no válidas responden `409`.

Si un `USER` pide un ticket ajeno, la API responde `404` (no `403`), para no revelar que ese ticket existe.

No se puede comentar en tickets `CLOSED`. Comentar actualiza la "última actividad" (`updatedAt`) del ticket.

Todas las respuestas de error comparten el formato `{ "error": { "message": "...", "details": { ... } } }`.

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt**; nunca se devuelven en las respuestas.
- **JWT** firmados con un secreto de entorno y con caducidad.
- El registro público no permite elegir el rol: `AGENT` y `ADMIN` solo los asigna un administrador.
- El login devuelve el mismo error si el email no existe o la contraseña es incorrecta, para no revelar qué cuentas existen.
- Cabeceras HTTP seguras con **Helmet** y CORS restringido.

## 🧪 Tests

```bash
cd backend
npm test
```

Los tests de integración usan una base de datos aparte (`helpdesk_test`), que Docker Compose crea automáticamente. Así nunca tocan tus datos de desarrollo.

### ⚙️ Integración continua

[GitHub Actions](./.github/workflows/ci.yml) se ejecuta en cada push a `main` y en cada Pull Request:

1. Levanta un PostgreSQL real como servicio.
2. Instala dependencias, comprueba tipos, ejecuta todos los tests y compila, con **Node 24 y 26**.
3. Construye la imagen Docker del backend.

Un PR solo se fusiona si todo está en verde.

## 🩺 Problemas comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `503 Base de datos no disponible` | Docker Desktop o el contenedor `db` están apagados | Abre Docker Desktop y ejecuta `docker compose up -d db`. Compruébalo con `GET /api/health/ready` |
| `400 El cuerpo de la petición no es un JSON válido` | JSON mal escrito (comas de más, comillas “tipográficas”…) | En Postman usa *Body → raw → JSON* |
| `401 Falta el token de acceso` | No se envió el JWT | Añade la cabecera `Authorization: Bearer <token>` (la colección de Postman lo hace sola tras el login) |
| Los tests fallan con `database "helpdesk_test" does not exist` | El volumen de Postgres se creó antes de añadir la BD de tests | `docker exec helpdesk-db psql -U helpdesk -c "CREATE DATABASE helpdesk_test OWNER helpdesk;"` |

## 🗺️ Roadmap

Consulta las casillas de [Funcionalidades](#-funcionalidades). Ideas futuras: notificaciones por correo, adjuntos, SLA por prioridad.

## 🤝 Contribuir

Revisa [CONTRIBUTING.md](./CONTRIBUTING.md) para la convención de commits y ramas.

## 📄 Licencia

[MIT](./LICENSE)

## 👤 Autor

**Nicolas** — Desarrollador Full Stack Junior
[LinkedIn](https://www.linkedin.com/in/nicolas-maldonado-a8519739b/) · [GitHub](https://github.com/Nicolasdkr)
