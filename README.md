# Deadline Manager

A production-grade deadline management system built for urgency-first workflows. It combines real-time urgency scoring, dependency awareness, recurring deadlines, analytics, and smart reminders into a single, scalable platform.

## System Overview
Deadline Manager is not a simple todo app. It’s a deadline intelligence layer with:
- Urgency-based prioritization and visual emphasis
- Multiple views (list, timeline, calendar, overdue)
- Smart notifications and daily reminders
- Recurrence engine with cron-friendly generation
- Analytics on completion behavior and timing
- Secure, session-scoped access for each user

## Architecture Diagram (Text-Based)
```
+------------------------+        +-----------------------------+
|      Next.js App       |        |        Vercel Cron          |
|  (App Router + UI)     |        | /api/notifications/generate |
|                        |        | /api/recurrences/generate   |
+-----------+------------+        +---------------+-------------+
            |                                       |
            v                                       v
+------------------------+        +-----------------------------+
|   Next.js API Routes   | <----> |   Notification/Recurrence   |
|  Auth + CRUD + Analytics|       |        Engines (Server)     |
+-----------+------------+        +---------------+-------------+
            |
            v
+------------------------+
|     Prisma ORM         |
+-----------+------------+
            |
            v
+------------------------+
|  PostgreSQL (Supabase) |
+------------------------+
```

## Tech Stack Justification
- **Next.js (App Router)**: Modern routing, server-first API design, strong Vercel alignment.
- **React + TypeScript**: Type safety for reliability at scale.
- **Tailwind + shadcn/ui**: Rapid, consistent UI with production-ready components.
- **Zustand**: Lightweight state management, ideal for view-level orchestration.
- **Prisma**: Strong schema modeling, predictable migrations, safe queries.
- **NextAuth.js**: Secure session-based auth with Supabase-compatible schema.
- **PostgreSQL (Supabase)**: Durable storage, relational constraints, analytics-friendly queries.
- **Vercel**: Free-tier deployment with first-class support for Next.js and cron.

## Key Engineering Challenges Solved
- **Urgency calculation at scale**: Stored urgency scores and indexed queries to avoid recomputation hotspots.
- **Idempotent background generation**: Notification and recurrence engines are safe to run repeatedly with unique constraints and `createMany` + `skipDuplicates`.
- **Per-user isolation**: All data is scoped by `session.user.id`, enforced at API boundaries.
- **Performance in large lists**: List virtualization avoids DOM churn with thousands of deadlines.
- **Analytics without heavy client math**: Aggregations and time series are computed server-side.

## Scalability Decisions
- Indexed the most queried fields (`userId`, `status`, `priority`, `completedAt`, `dueDate`).
- Private cache headers for user-scoped endpoints to reduce repeated API calls.
- Virtualized list view for large deadline counts.
- Cron-driven engines to avoid client-side timers or heavy background queues.

## Deployment Instructions
### 1) Environment Variables
Create `.env.local` or configure in Vercel using `.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `CRON_SECRET`
- Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 2) Database Setup (Supabase)
- Create Supabase Postgres project
- Apply Prisma migrations:
  - `npx prisma migrate dev` (local)
  - `npx prisma migrate deploy` (CI/Vercel)

### 3) Vercel Deployment
- Push repo to GitHub
- Import into Vercel
- Add env vars in Vercel project settings
- Deploy

### 4) Cron Jobs (Vercel)
Add `vercel.json` (already included):
- `/api/notifications/generate` every 15 minutes
- `/api/recurrences/generate` hourly

### 5) Smoke Test
- Sign in via magic link
- Create deadlines and verify list view
- Confirm analytics load
- Trigger cron endpoints and confirm notifications/recurrences

## Screenshots (Placeholders)
- `docs/screenshots/dashboard.png`
- `docs/screenshots/timeline.png`
- `docs/screenshots/calendar.png`
- `docs/screenshots/analytics.png`

## Future Roadmap
- Team collaboration and shared workspaces
- Advanced SLA-style deadline policies
- Web push notifications with service worker
- Dependency graph visualization
- CSV export + reporting pipelines
- Mobile app companion

---

Built with production constraints in mind: scalability, security, and clarity.
