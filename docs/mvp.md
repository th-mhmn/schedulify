# Schedulify MVP (Backend)

## Goal

Build a production-ish booking backend that demonstrates real backend engineering:
auth, roles, booking rules, background jobs, real-time events, and clean structure.

## Roles

### USER

- Register/login
- Browse businesses and services
- Create a booking
- Cancel their booking (with rules)

### BUSINESS_OWNER

- Register/login
- Create/manage their business
- Create/manage services
- Set availability (working hours)
- View bookings for their business
- Receive real-time notifications on new bookings

## Core Entities (MVP)

- User
- Business
- Service
- WorkingHours (weekly schedule)
- Booking
- RefreshToken (or session)
- NotificationJob / NotificationLog (minimal tracking)

## MVP Endpoints (High-level)

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/verify-email (optional in MVP, but good)
- POST /auth/forgot-password (optional)
- POST /auth/reset-password (optional)

### Users

- GET /me

### Businesses

- POST /businesses (owner)
- GET /businesses
- GET /businesses/:id
- GET /businesses/:id/services

### Services

- POST /businesses/:id/services (owner)
- PATCH /services/:id (owner)
- DELETE /services/:id (owner)

### Availability

- PUT /businesses/:id/working-hours (owner)
- GET /businesses/:id/working-hours

### Bookings

- POST /bookings (user)
- GET /bookings/me (user)
- GET /businesses/:id/bookings (owner)
- POST /bookings/:id/cancel (user/owner with rules)

## Booking Rules (Concrete)

1. No overlap: a CONFIRMED booking cannot overlap another CONFIRMED booking for the same business.
2. Must be within working hours for that business on that weekday.
3. Time resolution: booking start times must be on a [5]-minute boundary.
4. Duration: booking end time = start time + service.durationMinutes.
5. Cancellation: users can cancel only if now < startTime - [X] minutes (example: 60).
6. Ownership: a USER can only cancel their own bookings; an OWNER can cancel bookings for their own business only.
7. Timezone: business working hours are interpreted in the business timezone (store timezone on Business).

## Notifications (MVP)

### Events to send

- Booking created → confirmation notification
- Booking cancelled → cancellation notification
- Reminder notification before appointment

### Delivery mechanisms

- Queue (BullMQ) for sending notifications and scheduling reminders
- WebSocket event to BUSINESS_OWNER on new booking

## Non-functional Goals

- Dockerized local dev (Postgres + Redis)
- Prisma migrations for schema changes
- Swagger API docs
- Structured logging with request IDs
- Basic rate limiting for auth endpoints (later, but planned)
- Tests:
  - unit tests for booking conflict logic
  - integration tests for auth + booking creation

## Out of Scope (for MVP)

- Payments
- Public reviews
- Complex scheduling UI
- Multi-location businesses
- Advanced staff calendars
