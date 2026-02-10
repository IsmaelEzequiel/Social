# Implementation Plan: Impulse Core Platform

**Branch**: `001-impulse-core-platform` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-impulse-core-platform/spec.md`

## Summary

Mobile-first platform enabling users to discover, create, and join real-life activities via a live map. The core experience is Flash activities (spontaneous, starting within 0-2 hours) with one-tap joining and real-time updates. The system includes an invisible trust engine for self-regulation, ephemeral scoped chat, lightweight profiles with badges/trophies, planned activities with confirmation flows, and a Pro subscription tier. Built as a monorepo with an Elixir/Phoenix API backend and a React Native (Ignite) mobile client, communicating over REST + WebSocket (Phoenix Channels).

## Technical Context

**Language/Version**: Elixir 1.17+ / OTP 27 (backend), TypeScript 5.x (mobile)
**Primary Dependencies**: Phoenix 1.7, Ecto 3.11, Guardian 2.3, Oban 2.18, geo_postgis 3.6, stripity_stripe 3.2 (backend); React Native 0.81, Expo SDK 54, React Navigation v7, react-native-maps, Phoenix JS 1.7, RN Reanimated v4, MMKV v3, Apisauce v3 (mobile)
**Storage**: PostgreSQL 16 + PostGIS 3.4
**Testing**: ExUnit + ex_machina (backend unit/integration), Maestro (mobile E2E)
**Target Platform**: iOS 15+ / Android 12+ (mobile), Linux containers on Fly.io (API)
**Project Type**: Mobile + API (monorepo)
**Performance Goals**: <2s real-time map updates to all viewers, <15s Flash activity creation flow, 1,000 concurrent users per city with live map
**Constraints**: Real-time WebSocket required for core map experience, offline-tolerant mobile (queued joins), ephemeral data hard-deletion within 1 hour of expiry, PT-BR primary locale
**Scale/Scope**: 1,000 concurrent users/city at launch, ~15 screens, 11 database tables, 18 REST endpoints, 3 WebSocket channel topics

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Flash-First | Flash is default mode; creation via bottom sheet; <15s target | PASS |
| II. Real-World Encounters | Success metrics: activities completed, repeat attendance, no-show rate — not DAU/session time | PASS |
| III. Anti-Social-Network | No followers, bios, DMs, freeform text; profiles show stats + badges only; abstract avatars | PASS |
| IV. Invisible Trust | Trust score (0.0-1.0) never exposed; shadow ban silent; background recalculation only | PASS |
| V. Safety by Design | Device fingerprint enforcement; ephemeral chat with hard delete; report system with false-report penalty | PASS |
| VI. Fair Monetization | Flash create/join unlimited free; Pro = creation power only; no trust/ranking distortion | PASS |
| VII. Map-First, Real-Time | Full-screen map home; PostGIS spatial queries; Phoenix Channels for live updates; no polling | PASS |

All gates pass. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/001-impulse-core-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml     # REST API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/
├── api/                          # Elixir/Phoenix backend
│   ├── lib/
│   │   ├── impulse/              # Business logic (contexts)
│   │   │   ├── accounts/         # User registration, auth, profile
│   │   │   ├── activities/       # Activity CRUD, lifecycle, modes
│   │   │   ├── trust/            # Trust score engine, events
│   │   │   ├── safety/           # Device fingerprint, fraud detection
│   │   │   ├── geo/              # PostGIS spatial queries
│   │   │   ├── chat/             # Ephemeral messaging, cleanup
│   │   │   ├── billing/          # Stripe subscription management
│   │   │   ├── notifications/    # Push notifications (FCM/APNs)
│   │   │   └── gamification/     # Badges, trophies, presets
│   │   ├── impulse_web/          # Phoenix web layer
│   │   │   ├── controllers/      # REST API controllers
│   │   │   ├── channels/         # WebSocket channels (map, activity, user)
│   │   │   ├── plugs/            # Auth, rate limit, device fingerprint
│   │   │   └── views/            # JSON views
│   │   └── impulse_web.ex
│   ├── priv/repo/migrations/     # Ecto migrations
│   ├── test/
│   │   ├── impulse/              # Context unit tests
│   │   ├── impulse_web/          # Controller/channel tests
│   │   └── support/              # Test helpers, factories
│   ├── config/                   # Environment configs
│   └── mix.exs
└── mobile/                       # React Native (Ignite)
    ├── app/
    │   ├── screens/              # All screen components
    │   │   ├── auth/             # PhoneEntry, CodeVerification, ProfileSetup
    │   │   ├── map/              # MapScreen, ActivityDetailModal, CreateActivitySheet
    │   │   ├── upcoming/         # UpcomingListScreen, ActivityDetailScreen
    │   │   ├── activity/         # LiveActivityScreen, ChatScreen
    │   │   └── profile/          # Profile, Badges, Trophies, Settings, Subscription
    │   ├── components/           # Shared UI components
    │   ├── models/               # MobX-State-Tree models
    │   ├── services/             # API client, WebSocket, storage
    │   ├── navigators/           # AuthStack, MainTabs, RootNavigator
    │   ├── theme/                # Colors, spacing, typography
    │   └── i18n/                 # Localization (PT-BR primary)
    ├── ios/
    ├── android/
    └── package.json

packages/
└── shared/                       # Shared types, constants
    ├── types/                    # TypeScript type definitions
    ├── presets/                  # Activity preset definitions
    └── constants/                # Shared configuration values

infra/
├── docker-compose.yml            # Local dev (PostgreSQL + PostGIS + API)
├── Dockerfile.api                # API production image
└── .github/workflows/            # CI/CD pipelines
```

**Structure Decision**: Monorepo with `apps/api` (Elixir/Phoenix) and `apps/mobile` (React Native/Ignite) following the spec kit architecture. Shared types in `packages/shared/`. Infrastructure scripts in `infra/`. This matches the constitution's monorepo constraint and enables version alignment between API and mobile.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.
