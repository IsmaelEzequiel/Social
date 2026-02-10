# Research: Impulse Core Platform

**Phase**: 0 — Outline & Research
**Date**: 2026-02-10
**Status**: Complete

## R1: Real-Time Map Broadcasting via Phoenix Channels

**Decision**: Use Phoenix PubSub with city-scoped channel topics (`map:{city_id}`) and server-side viewport filtering.

**Rationale**: Phoenix Channels are native to the framework with zero additional infrastructure. City-scoped topics keep the PubSub namespace manageable (one topic per active city). Server-side viewport filtering (using PostGIS `ST_Within` on the user's current viewport bounds) ensures clients only receive relevant updates. Differential updates on `viewport:update` events avoid full-reload on pan/zoom.

**Alternatives considered**:
- **Redis PubSub**: Adds infrastructure complexity. Phoenix PubSub with the built-in `Phoenix.PubSub.PG2` adapter handles the expected scale (1,000 concurrent users/city) without external dependencies.
- **LiveView**: Not applicable for a React Native client. Channels are the correct primitive for non-browser native apps.
- **Polling with SSE fallback**: Rejected by constitution (Principle VII: polling not acceptable for primary interactions).

## R2: PostGIS Spatial Query Patterns for Map Viewport

**Decision**: Use `ST_DWithin` for radius-based activity search (API endpoint) and `ST_Within` for viewport-based queries (channel). Create a GiST index on the `location` geometry column.

**Rationale**: `ST_DWithin` uses the spatial index efficiently for proximity queries. `ST_Within` with a bounding box polygon matches the viewport semantics exactly. Both leverage the GiST index for O(log n) spatial lookups. The `geo_postgis` Ecto library provides native Elixir bindings for these functions.

**Alternatives considered**:
- **Geohash-based partitioning**: Adds complexity with minimal benefit at the target scale (10K activities per city). PostGIS natively handles this volume with proper indexing.
- **In-memory spatial index (R-tree)**: Unnecessary duplication of PostGIS capabilities. Would require cache invalidation logic that increases system complexity.

## R3: React Native + Phoenix JS WebSocket Integration

**Decision**: Use the official `phoenix` JS package (v1.7) for WebSocket connection. Wrap in a React Native service module (`app/services/socket.ts`) with automatic reconnection, JWT token refresh on 401, and graceful degradation to pull-to-refresh on sustained disconnect.

**Rationale**: The `phoenix` JS package is the official client maintained by the Phoenix team. It handles heartbeat, reconnection, and channel multiplexing natively. Wrapping it in a service module allows centralized connection management, token injection, and lifecycle control (connect on auth, disconnect on logout).

**Alternatives considered**:
- **Raw WebSocket**: Loses channel multiplexing, heartbeat management, and the Phoenix-specific message protocol. Would require reimplementing all of these.
- **GraphQL subscriptions (Absinthe)**: Marked as v2/optional in the spec kit. REST + Channels is simpler and sufficient for v1.

## R4: Device Fingerprinting on React Native

**Decision**: Combine `expo-device` (model, OS version, platform) + `expo-screen` (screen dimensions) + `Intl.DateTimeFormat` (timezone) + additional constants. Hash the composite with SHA-256 and store server-side.

**Rationale**: Expo provides cross-platform device info APIs without native module linking. The composite fingerprint (device model + OS version + screen resolution + timezone) matches the spec kit's definition. SHA-256 hashing ensures the fingerprint is not reversible to device identity. The one-account-per-fingerprint rule is enforced server-side by checking the hash against `device_records`.

**Alternatives considered**:
- **IDFV/Android ID**: More unique but raises privacy concerns and is subject to OS-level reset. Not cross-platform consistent.
- **Third-party fingerprinting SDK (DeviceCheck/SafetyNet)**: Adds vendor dependency and App Store review friction. The composite approach from the spec kit is sufficient to "raise the cost" of multi-accounting without being perfect.

## R5: Oban Job Patterns for Activity Lifecycle

**Decision**: Use Oban scheduled jobs for:
1. **Activity auto-complete**: Scheduled at `starts_at + duration_minutes`. Transitions status to `completed`, triggers trust events, opens feedback window.
2. **Activity auto-cancel**: Scheduled at `starts_at - 60min` (planned only). Checks confirmed count vs minimum. Cancels if under threshold.
3. **Message cleanup**: Runs hourly. Deletes messages where `expires_at < now()`.
4. **Trust recalculation**: Triggered per-event (not scheduled). An Oban worker processes each trust event atomically.

**Rationale**: Oban runs inside the BEAM VM with no external infrastructure. It uses the existing PostgreSQL database for job persistence. Scheduled jobs are idempotent (activity status transitions are guarded by current-state checks). The per-event trust worker avoids batch recalculation delays.

**Alternatives considered**:
- **GenServer timers**: Not persistent across deploys. If the server restarts, timers are lost. Oban's database-backed jobs survive restarts.
- **External job queue (Sidekiq, Bull)**: Requires a separate runtime (Ruby/Node) or Redis. Oban is Elixir-native and uses the existing PostgreSQL.

## R6: Stripe Subscription Integration (Elixir)

**Decision**: Use `stripity_stripe` (v3.2) for server-side Stripe API calls. Implement webhook endpoint for subscription lifecycle events (`customer.subscription.created`, `updated`, `deleted`). Use Stripe Customer Portal for subscription management UI.

**Rationale**: `stripity_stripe` is the most mature Elixir Stripe client. Webhook-driven state management ensures the server is always in sync with Stripe, even if the mobile app crashes mid-checkout. The Customer Portal eliminates the need to build subscription management UI (plan changes, cancellation, payment method updates).

**Alternatives considered**:
- **RevenueCat**: Adds a third-party intermediary and monthly cost. Direct Stripe integration is simpler for server-side subscription management.
- **In-app purchase (App Store/Play Store)**: Required for iOS if selling digital goods. However, Impulse Pro features (activity creation limits, duration extensions) are "creator tools" — whether Apple classifies these as in-app purchases requiring IAP depends on App Store review. Initial implementation uses Stripe with web-based checkout as a fallback strategy if IAP is required.

## R7: Authentication Flow (Twilio + Guardian JWT)

**Decision**: Phone verification via Twilio Verify API. On successful verification, issue JWT access token (15-minute TTL) + refresh token (30-day TTL) via Guardian. Store refresh token server-side for revocation. Mobile stores tokens in MMKV (encrypted key-value storage).

**Rationale**: Twilio Verify handles SMS delivery, rate limiting, and verification logic. Guardian is the standard Elixir JWT library with pluggable serialization. Short-lived access tokens minimize exposure; refresh tokens enable silent re-auth. MMKV provides fast, encrypted local storage on both iOS and Android.

**Alternatives considered**:
- **Firebase Auth**: Adds a Google dependency and limits server-side control over the auth flow. Twilio + Guardian keeps the auth stack fully within the Elixir ecosystem.
- **Session-based auth**: Not suitable for mobile apps where persistent cookies are unreliable. JWT is the standard for mobile API authentication.
