<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)

  Modified principles: N/A (first version)

  Added sections:
    - Core Principles (7 principles)
    - Technical Constraints
    - Development Workflow
    - Governance

  Removed sections: N/A

  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible
      (Constitution Check section is generic; principles map cleanly)
    - .specify/templates/spec-template.md ✅ compatible
      (User stories + requirements structure aligns with phased delivery)
    - .specify/templates/tasks-template.md ✅ compatible
      (Phase-based structure matches constitution's phased workflow)
    - .specify/templates/checklist-template.md ✅ compatible
      (Category-based structure can absorb principle-driven checks)

  Follow-up TODOs: None
-->

# Impulse Constitution

## Core Principles

### I. Flash-First (Core DNA)

Flash activities are the product's signature and MUST always be the
default mode. The impulse-to-action path — from opening the app to
a live activity on the map — MUST complete in under 15 seconds.

- Flash activities start within 0-2 hours from creation
- The main map view MUST show only Flash activities; Planned
  activities appear in a separate "Upcoming" tab
- Creation flow MUST be a bottom sheet, not a full-page form
- Any change that adds friction to the Flash creation path MUST be
  rejected regardless of other benefits

**Rationale**: Spontaneity is the product's competitive moat. If
creating an activity feels like filling out a form, users revert to
group chats and the product loses its reason to exist.

### II. Real-World Encounters Over Engagement

Every feature MUST increase real-world encounters between people.
If a feature increases time-in-app but decreases real-world
encounters, it MUST NOT ship.

- Features are evaluated by the 5-step decision filter (see
  Development Workflow) before any implementation begins
- Metrics that measure app-time (session duration, scroll depth,
  DAU/MAU) MUST NOT be used as primary success indicators
- Primary success metrics: activities completed, participants per
  activity, repeat attendance rate, no-show rate reduction

**Rationale**: The product exists to move people from screens to
streets. Optimizing for engagement without real-world outcomes
turns Impulse into another social feed.

### III. Anti-Social-Network

The product MUST NOT replicate social network dynamics. Profiles
serve minimum trust ("this person completed 12 activities"), not
social identity or vanity.

- No followers/following, no bios or freeform text fields
- No direct messages outside of activity-scoped ephemeral chat
- No photo galleries, no selfies or real photos as avatars
- No "who visited your profile" or interest-based matching
- No algorithmic feed; discovery is strictly geospatial and temporal
- Avatars MUST be abstract/illustrated only

**Rationale**: Social network patterns (vanity metrics, passive
browsing, parasocial dynamics) erode the action-first identity.
Every social feature is a gravitational pull toward becoming
"another app people scroll."

### IV. Invisible Trust

Trust is applied heavily but shown lightly. Trust scores MUST
never be exposed to users in any form. Bad users are made
irrelevant by the system, not punished visibly.

- Trust score: float 0.0-1.0, recalculated after every relevant
  event via background workers
- New users start at 0.5 (neutral)
- Score < 0.2 triggers silent shadow ban (activities invisible
  to others, user unaware)
- Score affects visibility ranking but MUST NOT be displayed,
  hinted at, or referenced in any user-facing copy
- All trust effects are silent — no "your trust is low" warnings

**Rationale**: Visible punishment systems create gaming behavior
and resentment. Invisible trust lets honest users enjoy a
high-quality environment while bad actors quietly fade out.

### V. Safety by Design

Safety MUST be structural, not reactive. The system architecture
itself prevents harm rather than relying on moderation after the
fact.

- One active account per device fingerprint (SHA-256 hash of
  device model + OS version + screen resolution + fonts + timezone)
- Fingerprint change triggers trust penalty (-0.10) and 24h cooldown
- Chat is ephemeral: messages have `expires_at` timestamps and
  are hard-deleted by scheduled jobs
- No message history for late joiners (only messages after join)
- No freeform text fields on profiles (preset-only selections)
- Report system with false-report penalties (-0.10 trust)
- Proximity-based attendance verification

**Rationale**: Moderation at scale is impossible for a small team.
Designing the system so that abuse is structurally difficult is
more effective than hiring moderators.

### VI. Fair Monetization

Free users MUST never encounter "you can't do this" for core
actions. Pro features grant creation power, not discovery access.
Revenue MUST never distort the trust system or activity ranking.

- Flash activities: create and join unlimited, free forever
- Planned activities: free users create up to 2 per week,
  join unlimited
- Pro ($4.99/month): unlimited planned creation, recurring
  activities, activity insights, extended duration, custom presets
- Pro users get subtle priority in map rendering but MUST NOT
  receive trust score advantages or ranking manipulation
- Local commerce (v2+): venue visibility as "suggested spots,"
  never shown as ads, zero-commission model

**Rationale**: Gating core functionality behind a paywall
(as competitors do) destroys network effects at the seed stage
and creates a two-class user base that erodes trust.

### VII. Map-First, Real-Time

The map is the product. Everything else is infrastructure. All
activity discovery is geospatial-first. Core features MUST use
live updates via WebSocket; polling is not acceptable for
primary interactions.

- Home screen MUST be a full-screen map with activity pins
- Activity queries are PostGIS spatial queries
  (`ST_DWithin`, `ST_Within`)
- Real-time updates via Phoenix Channels (PubSub broadcast
  on every activity state change)
- Map channel sends differential updates on viewport change
- Pull-to-refresh is a fallback for poor connectivity, not
  the primary update mechanism
- Activities are filtered by trust score before broadcast

**Rationale**: A list-based or feed-based discovery model
loses the spatial context that makes spontaneous meetups
possible. Real-time updates create the "living city" feel
that drives urgency.

## Technical Constraints

- **Monorepo**: single repository containing both API and mobile
  app with shared types and constants in `packages/shared/`
- **Backend**: Elixir/Phoenix 1.7+ with OTP supervision trees;
  Phoenix Channels for all real-time communication
- **Database**: PostgreSQL with PostGIS extension; every activity
  query is a spatial query
- **Mobile**: React Native 0.81 + Expo SDK 54 + TypeScript;
  Ignite boilerplate for project structure
- **Background Jobs**: Oban for trust recalculation, message
  cleanup, activity lifecycle (auto-complete, auto-cancel)
- **Auth**: Phone-based SMS verification (Twilio) + JWT (Guardian);
  no email/password, no social login
- **Payments**: Stripe for subscriptions with webhook integration
- **Testing**: ExUnit for backend, Maestro for mobile E2E;
  each development phase gated by acceptance criteria

## Development Workflow

### Phased Delivery

Development follows 8 sequential phases (0-7), each with defined
acceptance criteria that MUST pass before proceeding:

| Phase | Focus |
|-------|-------|
| 0 | Foundation (monorepo + auth + CI) |
| 1 | Core Map (Flash activities + real-time) |
| 2 | Trust + Safety (invisible trust engine) |
| 3 | Profiles + Badges (identity layer) |
| 4 | Planned Activities (scheduled events) |
| 5 | Chat + Notifications (real-time comms) |
| 6 | Monetization (Pro subscriptions) |
| 7 | Polish + Launch (i18n, E2E tests, store) |

### Feature Decision Filter

Before any feature implementation begins, it MUST pass this
filter in order. Failure at any step is a hard reject:

1. Does it increase real-world encounters? If no — **reject**
2. Does it add friction to the impulse-to-action path? If yes — **reject**
3. Does it create social network dynamics? If yes — **reject**
4. Does it compromise the invisible trust system? If yes — **reject**
5. Does it degrade the free experience to drive revenue? If yes — **reject**
6. All clear? **Ship it**

### Code Quality Gates

- All PRs MUST pass CI (Elixir tests + RN lint + type check)
- Database migrations MUST be reversible
- API endpoints MUST include rate limiting via plugs
- All user-facing strings MUST support i18n (PT-BR primary locale)

## Governance

This constitution is the authoritative reference for all product
and engineering decisions on the Impulse project. It supersedes
conflicting guidance in other documents.

- **Amendments**: Any change to this constitution MUST be
  documented with a version bump, sync impact report, and
  review of all dependent templates
- **Versioning**: Semantic versioning (MAJOR.MINOR.PATCH)
  - MAJOR: principle removal or backward-incompatible redefinition
  - MINOR: new principle added or existing guidance materially expanded
  - PATCH: clarifications, wording fixes, non-semantic refinements
- **Compliance**: All PRs and design reviews MUST verify alignment
  with the Core Principles. The Feature Decision Filter MUST be
  applied before implementation begins
- **Runtime Guidance**: For day-to-day development guidance,
  refer to `CLAUDE.md` (or equivalent agent guidance file) which
  MUST remain consistent with this constitution

**Version**: 1.0.0 | **Ratified**: 2026-02-10 | **Last Amended**: 2026-02-10
