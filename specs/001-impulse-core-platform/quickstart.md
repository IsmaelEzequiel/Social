# Quickstart: Impulse Core Platform

**Branch**: `001-impulse-core-platform`
**Date**: 2026-02-10

## Prerequisites

- **Elixir** 1.17+ with OTP 27 (`elixir --version`)
- **PostgreSQL** 16+ with PostGIS 3.4+ extension
- **Node.js** 20 LTS (`node --version`)
- **Docker** and Docker Compose (for local database)
- **Expo CLI** (`npx expo --version`)
- **EAS CLI** (`npx eas --version`) — for device builds
- **Xcode** 15+ (iOS development, macOS only)
- **Android Studio** with SDK 34+ (Android development)
- **Twilio account** with Verify API enabled
- **Stripe account** with test API keys

## 1. Backend Setup (Elixir/Phoenix)

```bash
# Start PostgreSQL + PostGIS via Docker
docker compose -f infra/docker-compose.yml up -d postgres

# Install Elixir dependencies
cd apps/api
mix deps.get

# Configure environment
cp config/dev.secret.exs.example config/dev.secret.exs
# Edit dev.secret.exs with your Twilio and Stripe keys

# Create database with PostGIS extension
mix ecto.create
mix ecto.migrate

# Seed preset data (activity categories, zones)
mix run priv/repo/seeds.exs

# Start the server
mix phx.server
# API available at http://localhost:4000/api/v1
```

### Environment Variables (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgres://postgres:postgres@localhost:5432/impulse_dev |
| TWILIO_ACCOUNT_SID | Twilio account SID | AC... |
| TWILIO_AUTH_TOKEN | Twilio auth token | ... |
| TWILIO_VERIFY_SERVICE_SID | Twilio Verify service | VA... |
| STRIPE_SECRET_KEY | Stripe secret key | sk_test_... |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret | whsec_... |
| GUARDIAN_SECRET_KEY | JWT signing key | (generate with `mix guardian.gen.secret`) |
| FCM_SERVER_KEY | Firebase Cloud Messaging key | ... |

## 3. Mobile Setup (React Native / Ignite)

```bash
cd apps/mobile

# Install JS dependencies
npm install

# Configure API URL
# Edit app/services/api/api-config.ts
# Set API_URL to http://localhost:4000/api/v1

# iOS (macOS only)
cd ios && pod install && cd ..
npx expo run:ios

# Android
npx expo run:android
```

### Mobile Environment

The mobile app reads configuration from `app/services/api/api-config.ts`:

```typescript
export const API_URL = __DEV__
  ? "http://localhost:4000/api/v1"
  : "https://api.impulse.app/api/v1"

export const WS_URL = __DEV__
  ? "ws://localhost:4000/socket"
  : "wss://api.impulse.app/socket"
```

## 4. Verify Setup

### Backend Health Check

```bash
curl http://localhost:4000/api/v1/presets
# Should return a JSON array of activity presets
```

### WebSocket Test

```bash
# Use wscat or similar tool
wscat -c ws://localhost:4000/socket/websocket?token=<JWT>
```

### Run Backend Tests

```bash
cd apps/api
mix test
```

### Run Mobile Lint + Type Check

```bash
cd apps/mobile
npm run lint
npx tsc --noEmit
```

## 5. Development Workflow

1. **Backend changes**: Edit context modules in `apps/api/lib/impulse/`.
   Phoenix auto-reloads on file save.

2. **Mobile changes**: Edit screen/component files in `apps/mobile/app/`.
   Metro bundler hot-reloads on save.

3. **Database changes**: Create a new migration with
   `cd apps/api && mix ecto.gen.migration <name>`.
   Run with `mix ecto.migrate`. Rollback with `mix ecto.rollback`.

4. **WebSocket testing**: Use the Phoenix Channel playground at
   `http://localhost:4000/dev/dashboard/sockets` (LiveDashboard).

## 6. Key Commands Reference

| Command | Location | Purpose |
|---------|----------|---------|
| `mix phx.server` | apps/api | Start API server |
| `mix test` | apps/api | Run backend tests |
| `mix ecto.migrate` | apps/api | Run database migrations |
| `mix ecto.rollback` | apps/api | Rollback last migration |
| `mix run priv/repo/seeds.exs` | apps/api | Seed data |
| `npx expo run:ios` | apps/mobile | Run iOS app |
| `npx expo run:android` | apps/mobile | Run Android app |
| `npm run lint` | apps/mobile | Lint mobile code |
| `npx tsc --noEmit` | apps/mobile | Type check mobile code |
| `docker compose up -d` | infra/ | Start local services |
