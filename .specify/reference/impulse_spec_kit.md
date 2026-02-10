# SPEC-KIT — IMPULSE ACTIVITY APP

**Updated Product Positioning + Full Implementation Plan**
**Monorepo • Elixir/Phoenix • React Native (Ignite)**
**February 2026 • Confidential**

---

## Table of Contents

- [Part I — Updated Product Positioning](#part-i--updated-product-positioning)
- [Part II — Technical Architecture](#part-ii--technical-architecture)
- [Part III — Mobile App (React Native + Ignite)](#part-iii--mobile-app-react-native--ignite)
- [Part IV — Development Phases](#part-iv--development-phases)
- [Part V — Infrastructure & Deployment](#part-v--infrastructure--deployment)
- [Part VI — Launch Strategy](#part-vi--launch-strategy)
- [Part VII — Guiding Principles](#part-vii--guiding-principles)

---

# Part I — Updated Product Positioning

## 1. Revised Vision

A mobile-first application that enables young people to discover, create, and join real-life activities — from spontaneous impulse events happening right now, to planned group activities for later today, tomorrow, or this week. The app combines the urgency of impulse with the reliability of planning, all with safety built into the structure.

> *Turn impulse into action. Turn plans into real encounters. Never stay home alone.*

---

## 2. The Hybrid Model: Three Activity Modes

The original Impulse concept focused exclusively on "now" events. After competitive analysis (Boora), the product now supports three complementary modes that serve different user intents without sacrificing the core identity.

### Mode 1: Flash Activities (Core DNA)

- Starts within 0–2 hours from creation
- Duration: 30–120 minutes
- No pre-chat. Ephemeral post-join chat only
- Map-first discovery with urgency indicators
- **This is the product's signature. It must always be the default mode.**

### Mode 2: Planned Activities

- Can be scheduled up to 7 days in advance
- Duration: 30 minutes to 4 hours
- Group chat opens 2 hours before the event
- Shown in a dedicated "Upcoming" tab, NOT on the main map (to preserve impulse urgency)
- Confirmation required 1 hour before (auto-cancel if < 3 confirmed)

### Mode 3: Recurring Activities (v2)

- Weekly repeating activities (e.g., "Monday evening run")
- Only unlocked after 3 successful same-type activities
- Creates micro-communities organically, without explicit "groups" or "clubs"

---

## 3. Profile System

The original concept had "no profiles." The updated model adds lightweight profiles that serve action, not vanity.

### Profile Contents

- **Display name** (required)
- **Avatar**: abstract/illustrated only — no selfies, no real photos
- **Activity history**: number of activities joined/created (count only, no feed)
- **Earned badges and trophies** (visible to others only inside activities)
- **Preferred activity types** (selected from presets, not freeform)
- **Neighborhood/zone** (broad area, never precise location)

### Profile Anti-Patterns (Deliberately Excluded)

- No bio or freeform text fields
- No followers/following
- No "who visited your profile"
- No photo gallery
- No DMs outside of activity chat
- No interest-based matching algorithm

The profile exists to build minimum trust ("this person has done 12 activities"), not to create a social identity.

---

## 4. Monetization Plan

Unlike Boora Plus, which gates basic functionality (seeing nearby people), Impulse monetizes through value-add layers that never degrade the free experience.

### Tier 1: Free (Forever)

- Create and join Flash activities — unlimited
- Create up to 2 Planned activities per week
- Join unlimited Planned activities
- Full map access, all presets
- Profile, badges, trophies
- Post-activity feedback

### Tier 2: Impulse Pro ($4.99/month)

- Unlimited Planned activity creation
- Recurring Activities (create weekly events)
- Activity insights: see attendance trends for your events
- Priority in map rendering (subtle, not "highlighted")
- Extended activity duration (up to 6 hours for planned)
- Custom activity presets (propose new categories)

### Tier 3: Local Commerce (v2+, B2B)

- Venue partnerships: cafés/bars appear as suggested locations
- Group offers: discounts triggered when 4+ people join an activity at a venue
- Zero-commission model: venues pay for visibility, not per transaction
- Never shown as ads — integrated as "suggested spots"

### Monetization Principles

- Free users never see "you can't do this" for core actions
- Pro features are about creation power, not discovery access
- Revenue must never distort the trust system or activity ranking

---

# Part II — Technical Architecture

## 5. Monorepo Structure

A single repository containing both backend and frontend, with shared types and configuration. This simplifies CI/CD, ensures version alignment, and reduces coordination overhead for a small team.

```
impulse/
├── apps/
│   ├── api/                    # Elixir/Phoenix backend
│   │   ├── lib/
│   │   │   ├── impulse/          # Business logic (contexts)
│   │   │   │   ├── accounts/     # User accounts & auth
│   │   │   │   ├── activities/   # Activity CRUD & lifecycle
│   │   │   │   ├── trust/        # Trust scoring engine
│   │   │   │   ├── safety/       # Fraud detection & device FP
│   │   │   │   ├── geo/          # Geospatial queries
│   │   │   │   ├── chat/         # Ephemeral messaging
│   │   │   │   ├── billing/      # Subscription management
│   │   │   │   └── notifications/
│   │   │   ├── impulse_web/      # Phoenix controllers & channels
│   │   │   │   ├── controllers/  # REST API endpoints
│   │   │   │   ├── channels/     # WebSocket (chat, live map)
│   │   │   │   └── plugs/        # Auth, rate limiting, device FP
│   │   ├── priv/
│   │   │   └── repo/migrations/
│   │   ├── test/
│   │   ├── config/
│   │   └── mix.exs
│   └── mobile/                 # React Native (Ignite)
│       ├── app/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── models/
│       │   ├── services/
│       │   ├── navigators/
│       │   ├── theme/
│       │   └── i18n/
│       ├── ios/
│       ├── android/
│       └── package.json
├── packages/
│   └── shared/                 # Shared types, constants, presets
│       ├── types/
│       ├── presets/
│       └── constants/
├── infra/                      # Docker, CI/CD, deploy scripts
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── .github/workflows/
└── README.md
```

---

## 6. Backend: Elixir/Phoenix

### 6.1 Why Elixir/Phoenix

- **Real-time first**: Phoenix Channels (WebSocket) is native, not bolted on
- **Concurrency**: OTP processes handle thousands of concurrent map sessions
- **Fault tolerance**: supervisors restart crashed processes automatically
- **LiveView potential**: admin dashboard without a separate SPA
- **PubSub built-in**: perfect for live map updates and chat
- **Low operational cost**: single BEAM VM handles what would need multiple microservices

### 6.2 Core Dependencies

| Library | Purpose | Version |
|---------|---------|---------|
| phoenix | Web framework + channels | ~> 1.7 |
| phoenix_live_view | Admin dashboard | ~> 1.0 |
| ecto | Database ORM + migrations | ~> 3.11 |
| postgrex | PostgreSQL driver | ~> 0.19 |
| geo_postgis | PostGIS geospatial queries | ~> 3.6 |
| guardian | JWT authentication | ~> 2.3 |
| oban | Background jobs (cleanup, trust calc) | ~> 2.18 |
| absinthe | GraphQL API (optional, v2) | ~> 1.7 |
| stripity_stripe | Subscription billing | ~> 3.2 |
| ex_firebase | Push notifications (FCM) | ~> 0.4 |
| apns4ex | Push notifications (APNs) | ~> 2.0 |
| jason | JSON encoding/decoding | ~> 1.4 |
| cors_plug | CORS headers | ~> 3.0 |
| ex_machina | Test factories | ~> 2.8 |

### 6.3 Database: PostgreSQL + PostGIS

PostgreSQL with PostGIS extension for geospatial queries. This is critical for the map-first UX — every activity query is a spatial query.

### 6.4 Database Schema (Core Tables)

#### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Primary key |
| phone_hash | string | Hashed phone for auth |
| display_name | string(30) | Required, public |
| avatar_preset | integer | Index into abstract avatar set |
| preferred_presets | integer[] | Activity type preferences |
| zone_id | FK → zones | Broad neighborhood area |
| trust_score | float | 0.0–1.0, never exposed |
| device_fingerprint | string | Persistent device ID |
| subscription_tier | enum | free \| pro |
| subscription_expires_at | timestamp | Null if free |
| status | enum | active \| shadow_banned \| suspended |
| activities_joined_count | integer | Denormalized counter |
| activities_created_count | integer | Denormalized counter |
| inserted_at | timestamp | |
| updated_at | timestamp | |

#### `activities`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| creator_id | FK → users | |
| mode | enum | flash \| planned \| recurring |
| preset_id | FK → presets | Activity category |
| title | string(60) | Auto-generated from preset, editable |
| location | geometry(Point) | PostGIS point |
| location_name | string | Venue name or area |
| starts_at | timestamp | |
| duration_minutes | integer | 30–360 |
| max_participants | integer | 3–20 |
| min_participants | integer | Default 3 |
| status | enum | open \| full \| active \| completed \| cancelled |
| visibility_score | float | Derived from creator trust |
| confirmed_count | integer | Denormalized |
| recurring_rule | jsonb | Null unless recurring (day, time, frequency) |
| inserted_at | timestamp | |

#### `participations`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | FK → users | |
| activity_id | FK → activities | |
| status | enum | joined \| confirmed \| attended \| no_show \| cancelled |
| joined_at | timestamp | |
| confirmed_at | timestamp | Null until confirmed (planned only) |
| attended_at | timestamp | Set by proximity check |
| feedback_score | integer | 1–5, post-activity |
| feedback_text | string | Optional short feedback |

#### Additional Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| presets | Activity categories per locale | id, name, icon, locale, allowed_hours, max_duration |
| zones | Broad neighborhood areas per city | id, city, name, geometry(Polygon) |
| badges | Earned contextual badges | id, user_id, type, earned_at, revoked_at |
| trophies | Permanent milestones | id, user_id, type, earned_at |
| messages | Ephemeral chat messages | id, activity_id, user_id, body, inserted_at, expires_at |
| device_records | Device fingerprint tracking | id, user_id, fingerprint, platform, last_seen_at |
| trust_events | Trust score change log | id, user_id, event_type, delta, inserted_at |
| reports | User safety reports | id, reporter_id, reported_id, activity_id, reason, status |
| subscriptions | Pro subscription records | id, user_id, stripe_id, status, current_period_end |

---

## 7. Real-Time Architecture (Phoenix Channels)

### 7.1 Channel Topics

| Topic | Purpose | Events |
|-------|---------|--------|
| `map:{city_id}` | Live map updates | activity:created, activity:updated, activity:cancelled, activity:full |
| `activity:{id}` | Single activity room | user:joined, user:left, chat:message, activity:started, activity:completed |
| `user:{id}` | Personal notifications | badge:earned, trophy:unlocked, nudge:nearby_activity |

### 7.2 Map Channel Flow

1. User opens app → joins `map:{city_id}` channel with viewport bounds
2. Server sends initial activities within viewport (PostGIS `ST_Within` query)
3. As user pans/zooms, client sends `viewport:update` with new bounds
4. Server sends differential updates (new activities entering viewport)
5. When any activity changes (join, cancel, complete), PubSub broadcasts to map channel
6. Activities are filtered by trust score before broadcast (low-trust = lower visibility)

### 7.3 Chat Architecture

- **Flash activities**: chat opens only after joining, expires 30 min after activity ends
- **Planned activities**: chat opens 2 hours before start, expires 1 hour after end
- Messages stored in DB but with `expires_at` timestamp
- Oban job runs hourly to hard-delete expired messages
- No message history visible to late joiners (only messages after their join time)

---

## 8. REST API Design

JSON API with JWT authentication. All endpoints prefixed with `/api/v1`.

### 8.1 Core Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/request-code | Send SMS verification code | No |
| POST | /auth/verify | Verify code, return JWT + refresh token | No |
| POST | /auth/refresh | Refresh JWT token | Refresh |
| GET | /me | Current user profile | JWT |
| PATCH | /me | Update profile (name, avatar, prefs) | JWT |
| GET | /activities | List activities (geo query + filters) | JWT |
| POST | /activities | Create activity | JWT |
| POST | /activities/:id/join | Join activity | JWT |
| POST | /activities/:id/leave | Leave activity | JWT |
| POST | /activities/:id/confirm | Confirm attendance (planned) | JWT |
| POST | /activities/:id/feedback | Post-activity feedback | JWT |
| GET | /activities/upcoming | Planned activities feed | JWT |
| GET | /presets | Activity presets for current locale | JWT |
| POST | /reports | Report user or activity | JWT |
| GET | /me/badges | Current user badges | JWT |
| GET | /me/trophies | Current user trophies | JWT |
| POST | /subscriptions | Create Stripe subscription | JWT |
| DELETE | /subscriptions | Cancel subscription | JWT |
| POST | /devices | Register device + push token | JWT |

### 8.2 Activity Query Parameters

```
GET /activities?lat=-23.55&lng=-46.63&radius=2000&mode=flash&preset=coffee
```

- `lat`, `lng` (required): center point
- `radius` (optional, default 2000m, max 5000m): search radius
- `mode` (optional): flash | planned | all
- `preset` (optional): filter by preset category
- Results sorted by: `proximity × visibility_score × recency`

---

## 9. Trust Engine (Elixir Context)

### 9.1 Trust Score Calculation

Trust score is a float between 0.0 and 1.0. New users start at 0.5. The score is recalculated after every relevant event via an Oban worker.

| Event | Impact | Weight |
|-------|--------|--------|
| Attended activity | + | 0.03 |
| Created activity that completed | + | 0.05 |
| No-show (joined but absent) | – | 0.08 |
| Cancelled < 30 min before start | – | 0.04 |
| Cancelled > 2 hours before | – | 0.01 |
| Received positive feedback | + | 0.02 |
| Received negative feedback | – | 0.03 |
| Reported by another user | – | 0.06 |
| Report verified by system | – | 0.15 |
| False report submitted | – | 0.10 |
| Consecutive days active | + | 0.01/day (max 0.05) |

### 9.2 Trust Score Effects

- **Score > 0.7**: full visibility, can create unlimited flash activities
- **Score 0.4–0.7**: normal visibility, standard limits
- **Score 0.2–0.4**: reduced visibility, activities appear lower in results
- **Score < 0.2**: shadow ban — activities are invisible to others, user unaware
- Score never shown to users. Effects are always silent.

### 9.3 Device Fingerprint Enforcement

```elixir
Impulse.Safety.DeviceFingerprint
```

- Combines: device model + OS version + screen resolution + installed fonts hash + timezone
- Stored as SHA-256 hash, linked to user account
- One active account per fingerprint
- Fingerprint change triggers trust score penalty (–0.10) and 24h cooldown
- Impossible to fully prevent spoofing, but raises the cost significantly

---

# Part III — Mobile App (React Native + Ignite)

## 10. Tech Stack (Ignite Boilerplate)

| Technology | Purpose | Version |
|------------|---------|---------|
| React Native | Cross-platform mobile framework | 0.81 |
| Expo (modules) | Native module access | SDK 54 |
| TypeScript | Type safety | 5.x |
| React Navigation | Navigation (stack, tabs, modals) | v7 |
| MMKV | Fast local storage (auth tokens, prefs) | v3 |
| Apisauce | REST API client | v3 |
| RN Reanimated | Smooth animations | v4 |
| react-native-maps | Map rendering (Google/Apple Maps) | v1.x |
| Phoenix JS | WebSocket client for Phoenix Channels | v1.7 |
| date-fns | Date handling (activity times) | v4 |
| Maestro | E2E testing | latest |
| expo-location | GPS + background location | ~17 |
| expo-notifications | Push notification handling | ~28 |
| expo-haptics | Haptic feedback for joins/badges | ~14 |

---

## 11. Screen Architecture

### 11.1 Navigation Structure

```
RootNavigator
├── AuthStack
│   ├── PhoneEntryScreen
│   ├── CodeVerificationScreen
│   └── ProfileSetupScreen (name + avatar + prefs)
└── MainTabs
    ├── MapTab (default)
    │   ├── MapScreen (flash activities live map)
    │   ├── ActivityDetailModal
    │   └── CreateActivitySheet (bottom sheet)
    ├── UpcomingTab
    │   ├── UpcomingListScreen (planned activities)
    │   └── ActivityDetailScreen
    ├── ActivityTab (active activity, only visible when in one)
    │   ├── LiveActivityScreen
    │   └── ChatScreen
    └── ProfileTab
        ├── ProfileScreen
        ├── BadgesScreen
        ├── TrophiesScreen
        ├── SettingsScreen
        └── SubscriptionScreen
```

### 11.2 Key Screen Specs

#### MapScreen (Home)

- Full-screen map with activity pins (color-coded by preset)
- Floating action button (FAB) for "Create Flash Activity"
- Activity pins show: preset icon + participant count + time remaining
- Tap pin → bottom sheet with activity detail + "Join" button
- Join = one tap + haptic feedback + pin animates
- Real-time updates via Phoenix Channel (no polling)
- Filter pills at top: preset categories (scroll horizontal)

#### CreateActivitySheet

- Bottom sheet (half screen), not a full page
- Step 1: Select preset from visual grid (6–8 options)
- Step 2: Confirm location (current location default, drag pin to adjust)
- Step 3: Select time (Flash: now/15min/30min/1hr/2hr | Planned: date picker)
- Step 4: Set max participants (slider, 3–20)
- Confirm → activity goes live immediately
- **Target: entire flow in < 15 seconds**

#### ProfileScreen

- Abstract avatar (large, centered)
- Display name + zone
- Stats row: X activities joined • Y activities created
- Badges section (earned badges with dates)
- Trophies section (milestone grid)
- Settings gear icon → SettingsScreen
- No edit-heavy profile. No bio. No social links.

---

# Part IV — Development Phases

## 12. Phase Overview

| Phase | Duration | Goal | Key Deliverables |
|-------|----------|------|-----------------|
| 0: Foundation | 2 weeks | Monorepo + auth + CI | Repo setup, Ignite scaffold, Phoenix project, DB, auth flow, CI pipeline |
| 1: Core Map | 4 weeks | Flash activities on map | Map screen, activity CRUD, join/leave, PostGIS queries, Phoenix Channels, real-time updates |
| 2: Trust + Safety | 3 weeks | Invisible trust engine | Trust scoring, device fingerprint, shadow banning, attendance verification, report system |
| 3: Profiles + Badges | 2 weeks | User identity layer | Profile screen, avatar selection, badges, trophies, activity history counters |
| 4: Planned Activities | 3 weeks | Scheduled events | Upcoming tab, date picker, confirmation flow, pre-event chat, auto-cancel logic |
| 5: Chat + Notifications | 2 weeks | Real-time communication | Ephemeral chat, push notifications, smart nudges, background location for attendance |
| 6: Monetization | 2 weeks | Pro subscriptions | Stripe integration, subscription screen, Pro feature gates, receipt validation |
| 7: Polish + Launch | 3 weeks | App store ready | Onboarding flow, animations, localization (PT-BR), Maestro E2E tests, app store assets |

**Total estimated timeline: 21 weeks (~5 months) for v1 launch**

---

## 13. Phase 0: Foundation (Weeks 1–2)

### Backend Setup

1. Initialize Phoenix project: `mix phx.new impulse_api --no-html --no-assets`
2. Configure PostgreSQL + PostGIS extension
3. Set up Ecto repos and base migrations (users, devices)
4. Implement SMS auth flow (Twilio) + JWT (Guardian)
5. Create base plugs: `AuthPlug`, `DeviceFingerprintPlug`, `RateLimitPlug`
6. Set up Oban for background job processing

### Frontend Setup

1. Initialize Ignite project: `npx ignite-cli@latest new impulse-mobile`
2. Configure Apisauce API client with JWT interceptor
3. Set up React Navigation with AuthStack and MainTabs
4. Implement MMKV for token storage
5. Build auth screens (PhoneEntry, CodeVerification)
6. Configure Expo modules: location, notifications, haptics

### Infrastructure

1. Docker Compose for local dev (PostgreSQL + PostGIS + API)
2. GitHub Actions CI: Elixir tests + RN lint + type check
3. Fly.io or Railway for API staging deployment
4. EAS Build for mobile CI (Expo Application Services)

---

## 14. Phase 1: Core Map (Weeks 3–6)

### Backend

- Activities context: create, join, leave, cancel, complete lifecycle
- Geo context: PostGIS queries (`ST_DWithin` for radius search, `ST_Within` for viewport)
- Presets context: seeded activity categories with locale support
- MapChannel: join with viewport bounds, receive real-time activity updates
- Activity lifecycle GenServer: auto-complete after duration, auto-cancel if under minimum

### Frontend

- MapScreen with react-native-maps (Google Maps on Android, Apple Maps on iOS)
- Custom map markers with preset icons and participant counts
- CreateActivitySheet (bottom sheet with preset grid + location + time)
- ActivityDetailModal (activity info + participant list + join button)
- Phoenix JS WebSocket integration for real-time map updates
- Pull-to-refresh fallback for poor connectivity

---

## 15. Phases 2–7: Summary

Detailed task breakdowns for phases 2–7 follow the same pattern: backend context implementation, API endpoints, Phoenix Channel events, frontend screens, and integration tests. Each phase has a defined acceptance criteria gate before proceeding.

---

# Part V — Infrastructure & Deployment

## 16. Production Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| API Server | Fly.io (Elixir release) | Multi-region, auto-scaling, built-in WebSocket support |
| Database | Fly Postgres (+ PostGIS) | Managed, with read replicas for geo queries |
| Background Jobs | Oban (in-app) | No separate job server needed |
| Push Notifications | FCM + APNs | Via ex_firebase and apns4ex |
| SMS (Auth) | Twilio Verify API | Phone verification |
| Payments | Stripe | Subscriptions + webhooks |
| CDN / Static | Cloudflare R2 or Tigris | Avatar assets, preset icons |
| Monitoring | AppSignal or Sentry | Elixir + React Native error tracking |
| CI/CD | GitHub Actions | Auto-deploy on merge to main |
| Mobile Builds | EAS Build (Expo) | iOS + Android from CI |
| App Distribution | TestFlight + Play Console | Staging: internal track. Prod: store |

---

## 17. Environment Strategy

| Environment | API | Mobile | Database |
|-------------|-----|--------|----------|
| Local Dev | `mix phx.server` (localhost:4000) | Expo Dev Client | Docker PostgreSQL |
| Staging | Fly.io (staging app) | EAS internal build | Fly Postgres (staging) |
| Production | Fly.io (prod app, multi-region) | App Store / Play Store | Fly Postgres (prod + replicas) |

---

# Part VI — Launch Strategy

## 18. City Selection: First Launch

Based on positioning analysis, the first city should have: high urban density, youth culture, public-space socialization, and low barrier to spontaneous meetups.

### Recommended First City Options

| City | Strengths | Risks |
|------|-----------|-------|
| São Paulo (BR) | Largest market, Boora already validated demand, high density | Direct competition with Boora |
| Lisbon (PT) | Expat/nomad culture, spontaneous social norms, smaller = easier to seed | Smaller total market |
| Barcelona (ES) | Youth culture, outdoor lifestyle, international mix | Seasonal tourism fluctuation |
| CDMX (MX) | Massive youth population, strong public-space culture | Safety perception challenges |

---

## 19. Seed User Plan

1. Identify 5 neighborhoods with highest target density (universities, coworking, nightlife)
2. Recruit 40 seed users through in-person outreach (NOT digital ads)
3. Run 3 founder-led activities per day for first 2 weeks
4. Place NFC stickers/QR codes at 10 partner locations
5. Monitor: are activities happening without founder intervention by week 3?
6. If yes → begin organic growth phase. If no → adjust presets and timing, repeat.

---

## 20. Success Gates

| Metric | Week 4 Target | Week 8 Target | Week 12 Target |
|--------|---------------|---------------|----------------|
| Non-founder activities/day | 3 | 10 | 25+ |
| Avg participants/activity | 3.5 | 4.5 | 5+ |
| Repeat users (2+ activities) | 25% | 35% | 45% |
| No-show rate | < 40% | < 30% | < 20% |
| Activities completed (vs created) | 50% | 65% | 75% |

---

# Part VII — Guiding Principles

## 21. Product Truths (Updated)

> *Flash is the soul. Planned is the body. Profiles are the handshake. Monetization is the oxygen.*

> *If a feature increases time-in-app but decreases real-world encounters, it does not ship.*

> *Trust is applied heavily but shown lightly.*

> *Bad users are not punished — they are made irrelevant by the system.*

> *The map is the product. Everything else is infrastructure.*

> *If the product requires heavy marketing to work in a new city, it is not ready.*

---

## 22. Decision Framework

When evaluating any new feature, apply this filter in order:

1. Does it increase real-world encounters? If no → **reject.**
2. Does it add friction to the "impulse to action" path? If yes → **reject.**
3. Does it create social network dynamics (vanity, passive browsing)? If yes → **reject.**
4. Does it compromise the invisible trust system? If yes → **reject.**
5. Does it degrade the free experience to drive revenue? If yes → **reject.**
6. All clear? **Ship it.**

---

*— End of Spec-Kit —*
