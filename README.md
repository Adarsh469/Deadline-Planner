# Deadline Planner

A full-stack task management platform built for urgency-first workflows. It combines automatic urgency scoring, recurring deadlines, multi-view dashboards, analytics, and smart notifications — all containerized and self-hosted with Docker.

---

## What It Does

This is not a simple to-do app. Deadline Planner is a deadline intelligence layer that helps users stay on top of what matters most:

- Automatically scores and ranks tasks by urgency
- Sends smart daily reminders via email
- Supports recurring deadlines with a background cron engine
- Provides multiple views: **List**, **Timeline**, **Calendar**, **Overdue**
- Tracks completion analytics server-side (no heavy client math)
- Enforces strict per-user data isolation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & API | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| State Management | Zustand |
| ORM | Prisma |
| Database | MySQL 8 (self-hosted via Docker) |
| Auth | NextAuth.js (Credentials + Google OAuth) |
| Reverse Proxy | Nginx |
| Cron Engine | Alpine Linux container (replaces Vercel crons) |
| CI/CD | GitHub Actions → Docker Hub |
| Container Runtime | Docker + Docker Compose |

---

## Architecture

```
  GitHub Actions (CI/CD)
      │  Push to 'updated_branch'
      │  Build + Push image → Docker Hub
      ▼
  Docker Compose (Self-Hosted)
  ┌──────────────────────────────────────────────┐
  │                                              │
  │   ┌──────────┐    ┌──────────┐              │
  │   │  Nginx   │───▶│ Next.js  │              │
  │   │ :80      │    │ App :3000│              │
  │   └──────────┘    └────┬─────┘              │
  │                        │                    │
  │                   ┌────▼─────┐              │
  │                   │  MySQL   │              │
  │                   │ :3306    │              │
  │                   └──────────┘              │
  │                                              │
  │   ┌──────────────────────────┐               │
  │   │  Cron Container (Alpine) │               │
  │   │  /api/notifications      │               │
  │   │  /api/recurrences        │               │
  │   └──────────────────────────┘               │
  └──────────────────────────────────────────────┘
```

---

## Running Locally (Docker)

### Prerequisites
- Docker and Docker Compose installed
- A `.env` file configured (see below)

### 1. Configure Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=mysql://deadline:deadline@db:3306/deadline_planner
NEXTAUTH_URL=http://localhost
NEXTAUTH_SECRET=your-secret-here

# Email (for notifications)
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Cron auth
CRON_SECRET=your-cron-secret

# Optional: Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 2. Start the Stack

```bash
docker compose up --build
```

This starts 4 services:
- **db** — MySQL 8 database
- **app** — Next.js app (runs `prisma db push` on startup, then starts the server)
- **nginx** — Reverse proxy on port 80
- **cron** — Alpine container that fires background jobs on a schedule

### 3. Open the App

```
http://localhost
```

---

## Running Locally (Without Docker)

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

App runs at `http://localhost:3000`

---

## CI/CD Pipeline

On every push to `updated_branch`, GitHub Actions:
1. Checks out the repo
2. Builds the Docker image (multi-stage, Alpine-based)
3. Pushes the image to **Docker Hub**

Secrets required in GitHub repository settings:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_PAT`

---

## Key Engineering Details

- **Multi-stage Dockerfile**: Separate `deps`, `builder`, and `runner` stages keep the final image lean. Runs as a non-root user.
- **Prisma on Alpine**: Uses `linux-musl-openssl-3.0.x` binary target for Alpine Linux compatibility.
- **Idempotent cron jobs**: Notification and recurrence engines use `createMany` + `skipDuplicates` — safe to re-run.
- **Session-scoped data**: All API routes are gated by `session.user.id`. No cross-user data leakage.
- **List virtualization**: Dashboard handles large deadline counts without DOM bloat.
- **Server-side analytics**: Aggregations and time-series are computed on the server, not the client.

---

## Scheduled Jobs (Cron Container)

The Alpine cron container replaces Vercel's built-in cron. It fires two jobs via HTTP:

| Job | Endpoint | Schedule |
|---|---|---|
| Generate notifications | `/api/notifications/generate` | Every 15 minutes |
| Generate recurrences | `/api/recurrences/generate` | Every hour |

The `CRON_SECRET` is injected at runtime via `entrypoint.sh` using `sed` — no secrets baked into the image.

---

## Future Roadmap

- [ ] Team collaboration and shared workspaces
- [ ] Web push notifications (service worker)
- [ ] Dependency graph visualization
- [ ] CSV export + reporting
- [ ] Mobile companion app
- [ ] SLA-style deadline policies

---

Built with production constraints in mind: containerized, secure, and scalable.
