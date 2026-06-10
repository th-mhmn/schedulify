# Schedulify — MVP Tracker & Roadmap

> **Goal:** Build a production-grade booking backend that demonstrates real backend engineering — auth, concurrency safety, async jobs, clean architecture, and scalability patterns. Optimized as a portfolio/resume project.

---

## ✅ What's Built (Current State)

### Auth & Security

- [x] JWT access + refresh token rotation
- [x] Passport strategies: local, jwt, jwt-refresh
- [x] Role-based access control (USER, BUSINESS_OWNER)
- [x] bcrypt password hashing
- [x] Helmet security headers
- [x] Multi-tier rate limiting (short / medium / long via `@nestjs/throttler`)
- [x] Stricter auth-specific throttle on auth controller

### Core Domain

- [x] User registration + login
- [x] Business creation and management (multi-business per owner)
- [x] Service management per business (duration in minutes, price in cents)
- [x] Working hours configuration (weekly schedule, 5-min resolution, per-timezone)
- [x] Availability blocks

### Booking Engine

- [x] No-overlap rule — CONFIRMED bookings cannot overlap per business
- [x] Serializable transaction protection — concurrent requests cannot create conflicting bookings
- [x] Working hours enforcement per weekday
- [x] 5-minute time resolution on booking start times
- [x] Duration-based end time calculation
- [x] Cancellation cutoff (configurable threshold)
- [x] Ownership rules (USER cancels own; OWNER manages their business only)
- [x] Timezone-aware scheduling via Luxon (per-business timezone)

### Idempotency

- [x] Idempotency key interceptor on: bookings, businesses, services, blocks, working hours
- [x] Cache layer via `@nestjs/cache-manager` (Redis-backed)
- [x] Serializable transaction on duplicate detection — no double-writes under concurrency

### Notifications (Async Pipeline)

- [x] BullMQ queue — `enqueueBookingCreated` dispatched on booking creation
- [x] Worker with full lifecycle event listeners (active, completed, failed, stalled)
- [x] Notification service scaffolded — logs `"sending booking notification"` (delivery not yet wired)

### Infrastructure

- [x] Dockerized dev environment (PostgreSQL + Redis + app)
- [x] Dockerized production environment
- [x] Production deployed: `https://schedulify.tmehmandoust.com/api/v1`
- [x] Prisma migrations set up
- [x] Swagger / OpenAPI docs at `/api/v1/docs`
- [x] Global exception filter — structured error responses
- [x] Global response transform interceptor — consistent API shape

---

## 🔲 Roadmap (Resume-Optimized Improvements)

Prioritized by resume / portfolio impact. Each item adds a concrete, demonstrable engineering pattern.

### 🔴 High Impact — Do These First

#### 1. Unit Tests for the Booking Conflict Engine

The conflict engine is already isolated — this is low-effort, high-signal.

- [ ] Unit tests for overlap detection logic
- [ ] Tests for working-hours boundary conditions
- [ ] Tests for timezone edge cases (DST, midnight crossover)
- [ ] Tests for 5-minute resolution enforcement

> **Why it matters:** Shows you write testable code and actually test it. Interviewers will ask.

#### 2. Real Notification Delivery

The pipeline is wired — just needs a delivery adapter.

- [ ] Email delivery via Nodemailer or Resend (booking confirmation)
- [ ] Booking cancellation notification
- [ ] Pluggable adapter pattern (swap email for SMS/push later)

> **Why it matters:** Demonstrates a complete async pipeline, not just scaffolding.

#### 3. Reminder Jobs (Scheduled Notifications)

BullMQ supports delayed jobs natively — this is a small addition.

- [ ] Enqueue a delayed reminder job at booking creation time (`startTime - N minutes`)
- [ ] Worker processes and sends reminder notification
- [ ] Configurable lead time via env var

> **Why it matters:** Shows cron/scheduled job patterns — a common interview question for backend roles.

---

### 🟡 Medium Impact — Strong Additions

#### 4. Structured Logging with Request IDs

- [ ] Attach a `requestId` (UUID) to every incoming request via middleware
- [ ] Propagate `requestId` through service layer and into BullMQ job metadata
- [ ] Use a structured logger (Pino or Winston) with JSON output

> **Why it matters:** Production observability pattern — shows you think beyond happy-path code.

#### 5. WebSocket — Real-time Booking Notifications to Owner

- [ ] `@nestjs/websockets` gateway
- [ ] On `bookingCreated`, emit a WebSocket event to the business owner's room
- [ ] JWT-authenticated WebSocket connection

> **Why it matters:** Demonstrates real-time patterns. High-visibility feature for demos.

#### 6. Prisma Query Optimization + Indexes

- [ ] Audit booking queries for N+1 issues
- [ ] Add composite indexes on `(businessId, startTime)` and `(businessId, status)` for the conflict check query
- [ ] Document query plans in PR description

> **Why it matters:** Shows you care about performance at the DB layer — not just correctness.

---

### 🟢 Nice to Have — Polish & Completeness

#### 7. Integration / E2E Tests

- [ ] Auth flow (sign-up → sign-in → refresh → sign-out)
- [ ] Full booking lifecycle (create → conflict rejected → cancel)
- [ ] Use `supertest` + test database

#### 8. Health Check Endpoint

- [ ] `GET /health` — returns DB + Redis connectivity status
- [ ] Use `@nestjs/terminus`

> **Why it matters:** Standard in any production service. Quick win.

#### 9. Pagination on List Endpoints

- [ ] Cursor or offset-based pagination on `/businesses`, `/bookings/me`, `/businesses/:id/bookings`
- [ ] Consistent pagination envelope in response shape

#### 10. CI Pipeline

- [ ] GitHub Actions workflow: lint → test → build → Docker image push
- [ ] Badge in README

> **Why it matters:** Makes the repo look production-ready at a glance.

---

## Roles

### USER

- Register / login
- Browse businesses and services
- Create a booking
- Cancel their own booking (with cutoff rules)

### BUSINESS_OWNER

- Register / login
- Create and manage their business
- Create and manage services
- Configure availability (working hours + blocks)
- View bookings for their business
- Receive notifications on new bookings (async, real-time planned)

---

## Core Entities

| Entity            | Notes                                     |
| ----------------- | ----------------------------------------- |
| User              | Roles: USER, BUSINESS_OWNER               |
| Business          | Multi-business per owner; stores timezone |
| Service           | Duration (minutes) + price (cents)        |
| WorkingHours      | Weekly schedule, per-timezone             |
| AvailabilityBlock | Explicit unavailability windows           |
| Booking           | Conflict-safe, lifecycle-managed          |
| RefreshToken      | Stored for rotation/invalidation          |

---

## Out of Scope (MVP)

- Payments / billing
- Public reviews and ratings
- Multi-location businesses
- Advanced staff/resource calendars
- Mobile app
- Admin dashboard UI
