# 🎫 Helpdesk Lite

> IT support ticket management system · Full Stack with TypeScript

[Español](./README.md) | **English**

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
- [ ] Ticket CRUD with filters by status, priority, and category
- [ ] Ticket assignment to technicians
- [ ] Ticket comments
- [ ] Metrics dashboard (open tickets, by priority, resolution time)
- [ ] React frontend
- [ ] Continuous integration with GitHub Actions

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

> 💡 In VS Code, open [`backend/requests.http`](./backend/requests.http) with the **REST Client** extension to try every endpoint with one click.

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
| `npm run db:seed` | Create the demo users |
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

## 🗺️ Roadmap

See the checkboxes under [Features](#-features). Future ideas: email notifications, attachments, SLA per priority.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit and branch conventions.

## 📄 License

[MIT](./LICENSE)

## 👤 Author

**Nicolas** — Junior Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/nicolas-maldonado-a8519739b/) · [GitHub](https://github.com/Nicolasdkr)
