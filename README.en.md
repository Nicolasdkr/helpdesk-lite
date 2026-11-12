# 🎫 Helpdesk Lite

> IT support ticket management system · Full Stack with TypeScript

[Español](./README.md) | **English**

[![CI](https://github.com/Nicolasdkr/helpdesk-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/Nicolasdkr/helpdesk-lite/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node.js-26_LTS-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

<!-- TODO: add a screenshot or GIF once the frontend is ready -->

## 📌 Overview

**Helpdesk Lite** lets employees report IT issues and lets support technicians manage them end to end: assignment, prioritization, follow-up through comments, and closure.

**Problem it solves:** in small teams, issues arrive by email, chat, or word of mouth and get lost. Helpdesk Lite centralizes everything in a traceable workflow with clear statuses and owners.

## ✨ Features

- [x] REST API with input validation and centralized error handling
- [x] Data model: users, tickets, and comments
- [x] JWT authentication with roles (`ADMIN`, `AGENT`, `USER`)
- [x] Ticket CRUD with filters, search, sorting, and pagination
- [x] Ticket assignment to technicians and a validated status workflow
- [x] Ticket comments, with internal notes visible only to support staff
- [ ] Metrics dashboard (open tickets, by priority, resolution time)
- [ ] React frontend
- [x] Continuous integration with GitHub Actions

## 🛠️ Tech stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React + Vite + TypeScript + Tailwind CSS | Industry standard, fast startup |
| Backend | Node.js + Express 5 + TypeScript | One language across the stack |
| Validation | Zod | Reusable typed schemas |
| ORM | Prisma 7 | Versioned migrations and generated types |
| Database | PostgreSQL 17 | Relational, robust, and free |
| Tests | Vitest + Supertest | Fast, modern syntax |
| Infrastructure | Docker + Docker Compose | One command to run everything |

## 🏗️ Architecture

```
helpdesk-lite/
├── backend/
│   ├── prisma/              # Database schema and migrations
│   ├── src/
│   │   ├── config/          # Validated environment variables
│   │   ├── lib/             # Prisma client, HTTP errors
│   │   ├── middlewares/     # Auth, error handling
│   │   ├── modules/         # One module per domain (routes → controller → service)
│   │   ├── app.ts           # Express setup (testable)
│   │   └── server.ts        # Entry point
│   └── tests/
├── frontend/                # (coming soon)
├── docs/                    # Additional documentation
└── docker-compose.yml
```

Each domain module follows a layered architecture:

- **routes**: defines endpoints and middlewares.
- **controller**: translates HTTP ↔ data (reads `req`, writes `res`).
- **service**: business logic; knows nothing about Express.
- **schemas**: input validation with Zod.

## 🚀 Getting started

### Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 24+](https://nodejs.org/) (option B only)

### Option A — Everything in Docker (fastest)

```bash
git clone https://github.com/Nicolasdkr/helpdesk-lite.git
cd helpdesk-lite
docker compose up --build -d

# Create the demo users
docker compose exec backend npx prisma db seed
```

The API is available at http://localhost:3000/api/health

### Option B — Local development (hot reload)

```bash
# 1. Start only the database
docker compose up -d db

# 2. Install dependencies and configure the environment
cd backend
cp .env.example .env
npm install

# 3. Apply migrations, create demo users and start
npm run db:migrate
npm run db:seed
npm run dev
```

### 🧰 Trying the API

- **VS Code:** open [`backend/requests.http`](./backend/requests.http) with the **REST Client** extension and click *Send Request*.
- **Postman:** *Import* → [`docs/postman/helpdesk-lite.postman_collection.json`](./docs/postman/helpdesk-lite.postman_collection.json). Run the three logins in the **Auth** folder first: each one saves its token to the collection variables automatically.

### 👥 Demo users

All of them use the password `Password123!`

| Role | Email | Can |
|------|-------|-----|
| ADMIN | `admin@helpdesk.dev` | Everything, including user management |
| AGENT | `agent@helpdesk.dev` | Handle and resolve tickets |
| USER | `user@helpdesk.dev` | Create and follow their own tickets |

### Useful scripts (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | API with auto-reload |
| `npm test` | Run tests |
| `npm run typecheck` | Type-check with TypeScript |
| `npm run build` | Compile to JavaScript in `dist/` |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:seed` | Create the demo users and tickets |
| `npm run db:studio` | Visual database browser |

## 📡 API

Protected routes require the `Authorization: Bearer <token>` header. Get a token from `/api/auth/login`.

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/health` | Public | Service status |
| GET | `/api/health/ready` | Public | Database connection status |
| POST | `/api/auth/register` | Public | Sign up (always with the `USER` role) |
| POST | `/api/auth/login` | Public | Log in, returns a JWT |
| GET | `/api/auth/me` | Authenticated | Current user profile |
| GET | `/api/users` | `ADMIN` | List users |
| GET | `/api/users/agents` | `AGENT`, `ADMIN` | Technicians a ticket can be assigned to |
| GET | `/api/tickets` | Authenticated | Paginated list with filters (see below) |
| POST | `/api/tickets` | Authenticated | Create a ticket |
| GET | `/api/tickets/:id` | Authenticated | Ticket details |
| PATCH | `/api/tickets/:id` | Creator, `AGENT`, `ADMIN` | Edit title, description, priority, or category |
| PATCH | `/api/tickets/:id/status` | `AGENT`, `ADMIN` | Change status |
| PATCH | `/api/tickets/:id/assign` | `AGENT`, `ADMIN` | Assign or unassign (`null`) a technician |
| DELETE | `/api/tickets/:id` | `ADMIN` | Delete a ticket (and its comments) |
| GET | `/api/tickets/:id/comments` | Authenticated | Ticket comments, in chronological order |
| POST | `/api/tickets/:id/comments` | Authenticated | Add a comment (`isInternal: true` only `AGENT`/`ADMIN`) |
| DELETE | `/api/tickets/:id/comments/:commentId` | Author, `ADMIN` | Delete a comment |

**`GET /api/tickets` query parameters:**

| Parameter | Values |
|-----------|--------|
| `status` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `category` | `HARDWARE`, `SOFTWARE`, `NETWORK`, `ACCESS`, `OTHER` |
| `assignedToId` | A technician's UUID or `me` |
| `search` | Text to search in title and description |
| `sort` / `order` | `createdAt`, `updatedAt` or `priority` / `asc` or `desc` |
| `page` / `pageSize` | Page (from 1) / size (max 50) |

The response includes `{ data: [...], meta: { page, pageSize, total, totalPages } }`.

### Business rules

| Action | USER | AGENT | ADMIN |
|--------|:----:|:-----:|:-----:|
| View tickets | Own only | All | All |
| Create ticket | ✅ | ✅ | ✅ |
| Edit title/description | Own only, while `OPEN` | ✅ | ✅ |
| Change priority/category | ❌ | ✅ | ✅ |
| Change status / assign | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ✅ |
| Comment | On own tickets | ✅ | ✅ |
| See / write internal notes | ❌ | ✅ | ✅ |

**Status workflow:** `OPEN → IN_PROGRESS → RESOLVED → CLOSED`. A resolved ticket can be reopened (`RESOLVED → IN_PROGRESS`) and `CLOSED` is final. Invalid transitions return `409`.

If a `USER` requests someone else's ticket, the API returns `404` (not `403`) so it doesn't reveal that the ticket exists.

`CLOSED` tickets cannot be commented on. Commenting updates the ticket's "last activity" (`updatedAt`).

All error responses share the format `{ "error": { "message": "...", "details": { ... } } }`.

## 🔐 Security

- Passwords hashed with **bcrypt** and never returned in responses.
- **JWTs** signed with an environment secret and with an expiry.
- Public sign-up cannot choose a role: `AGENT` and `ADMIN` are assigned only by an admin.
- Login returns the same error whether the email doesn't exist or the password is wrong, so it doesn't reveal which accounts exist.
- Secure HTTP headers with **Helmet** and restricted CORS.

## 🧪 Tests

```bash
cd backend
npm test
```

Integration tests use a separate database (`helpdesk_test`) that Docker Compose creates automatically, so they never touch your development data.

### ⚙️ Continuous integration

[GitHub Actions](./.github/workflows/ci.yml) runs on every push to `main` and on every Pull Request:

1. Starts a real PostgreSQL service.
2. Installs dependencies, type-checks, runs every test, and builds, on **Node 24 and 26**.
3. Builds the backend Docker image.

A PR is merged only when everything is green.

## 🩺 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `503 Base de datos no disponible` | Docker Desktop or the `db` container is stopped | Open Docker Desktop and run `docker compose up -d db`. Check with `GET /api/health/ready` |
| `400 El cuerpo de la petición no es un JSON válido` | Malformed JSON (trailing commas, “smart” quotes…) | In Postman use *Body → raw → JSON* |
| `401 Falta el token de acceso` | The JWT was not sent | Add the `Authorization: Bearer <token>` header (the Postman collection does it after login) |
| Tests fail with `database "helpdesk_test" does not exist` | The Postgres volume was created before the test DB was added | `docker exec helpdesk-db psql -U helpdesk -c "CREATE DATABASE helpdesk_test OWNER helpdesk;"` |

## 🗺️ Roadmap

See the checkboxes under [Features](#-features). Future ideas: email notifications, attachments, SLA per priority.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit and branch conventions.

## 📄 License

[MIT](./LICENSE)

## 👤 Author

**Nicolas** — Junior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/nicolas-maldonado-a8519739b/) · [GitHub](https://github.com/Nicolasdkr)
