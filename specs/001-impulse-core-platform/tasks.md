# Tasks: Impulse Core Platform

**Input**: Design documents from `/specs/001-impulse-core-platform/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `apps/api/lib/impulse/` (contexts), `apps/api/lib/impulse_web/` (web layer)
- **Mobile**: `apps/mobile/app/` (screens, components, services, models, navigators)
- **Shared**: `packages/shared/` (types, presets, constants)
- **Infra**: `infra/` (Docker, CI/CD)
- **Migrations**: `apps/api/priv/repo/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo initialization, project scaffolding, tooling

- [ ] T001 Initialize Phoenix project with `mix phx.new impulse_api --no-html --no-assets` in apps/api/
- [ ] T002 [P] Initialize React Native project with Ignite CLI in apps/mobile/
- [ ] T003 [P] Create shared types package with TypeScript config in packages/shared/
- [ ] T004 [P] Create Docker Compose config with PostgreSQL 16 + PostGIS 3.4 in infra/docker-compose.yml
- [ ] T005 [P] Create GitHub Actions CI workflow (Elixir tests + RN lint + typecheck) in infra/.github/workflows/ci.yml
- [ ] T006 Add Oban dependency and configure for PostgreSQL-backed job queue in apps/api/mix.exs and apps/api/config/config.exs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema, shared contexts, plugs, and mobile shell that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create Ecto migration enabling PostGIS extension and creating users table in apps/api/priv/repo/migrations/
- [ ] T008 [P] Create Ecto migration for zones table with Polygon geometry in apps/api/priv/repo/migrations/
- [ ] T009 [P] Create Ecto migration for presets table in apps/api/priv/repo/migrations/
- [ ] T010 Create Ecto migration for activities table with PostGIS Point geometry (depends on users, presets FKs) in apps/api/priv/repo/migrations/
- [ ] T011 [P] Create Ecto migration for device_records table in apps/api/priv/repo/migrations/
- [ ] T012 Implement User schema with changesets and validation rules in apps/api/lib/impulse/accounts/user.ex
- [ ] T013 [P] Implement Activity schema with state machine transitions and mode validation in apps/api/lib/impulse/activities/activity.ex
- [ ] T014 [P] Implement Preset schema in apps/api/lib/impulse/gamification/preset.ex
- [ ] T015 [P] Implement Zone schema with geometry field in apps/api/lib/impulse/geo/zone.ex
- [ ] T016 [P] Implement DeviceRecord schema in apps/api/lib/impulse/safety/device_record.ex
- [ ] T017 Create seed data for activity presets (8 categories, pt-BR locale) and zones (São Paulo neighborhoods) in apps/api/priv/repo/seeds.exs
- [ ] T018 Configure Guardian JWT with access token (15min TTL) and refresh token (30d TTL) in apps/api/lib/impulse/guardian.ex
- [ ] T019 Implement AuthPlug for JWT verification in apps/api/lib/impulse_web/plugs/auth_plug.ex
- [ ] T020 [P] Implement RateLimitPlug in apps/api/lib/impulse_web/plugs/rate_limit_plug.ex
- [ ] T021 [P] Implement DeviceFingerprintPlug in apps/api/lib/impulse_web/plugs/device_fingerprint_plug.ex
- [ ] T022 Configure Phoenix router with /api/v1 scope, plug pipeline, and channel socket in apps/api/lib/impulse_web/router.ex
- [ ] T023 [P] Implement JSON error view with standard error format in apps/api/lib/impulse_web/controllers/error_json.ex
- [ ] T024 [P] Configure Apisauce API client with JWT interceptor and base URL in apps/mobile/app/services/api/api.ts
- [ ] T025 [P] Configure MMKV for encrypted token storage in apps/mobile/app/services/storage/storage.ts
- [ ] T026 [P] Set up React Navigation shell with RootNavigator, AuthStack, and MainTabs in apps/mobile/app/navigators/
- [ ] T027 [P] Configure i18n with PT-BR as primary locale in apps/mobile/app/i18n/
- [ ] T028 [P] Create shared TypeScript types for User, Activity, Participation, Preset, Zone in packages/shared/types/

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 3 — Phone-Based Authentication (Priority: P1) MVP

**Goal**: Users can register via phone SMS, set up profile, and maintain persistent sessions

**Independent Test**: Complete the full signup flow from phone entry to map screen landing

### Implementation for US3

- [ ] T029 [US3] Implement Twilio Verify integration (request_code, check_code) in apps/api/lib/impulse/accounts/sms_verification.ex
- [ ] T030 [US3] Implement Accounts context functions (register_or_login, update_profile, get_user) in apps/api/lib/impulse/accounts/accounts.ex
- [ ] T031 [US3] Implement AuthController with request_code, verify, and refresh actions in apps/api/lib/impulse_web/controllers/auth_controller.ex
- [ ] T032 [P] [US3] Implement AuthJSON view for token and user responses in apps/api/lib/impulse_web/controllers/auth_json.ex
- [ ] T033 [P] [US3] Implement UserController with show (GET /me) and update (PATCH /me) actions in apps/api/lib/impulse_web/controllers/user_controller.ex
- [ ] T034 [P] [US3] Implement UserJSON view in apps/api/lib/impulse_web/controllers/user_json.ex
- [ ] T035 [P] [US3] Implement DeviceController with create action (POST /devices) in apps/api/lib/impulse_web/controllers/device_controller.ex
- [ ] T036 [US3] Implement auth service (requestCode, verify, refresh, logout) in apps/mobile/app/services/api/auth-service.ts
- [ ] T037 [P] [US3] Implement device fingerprint service (collect + SHA-256 hash) using expo-device in apps/mobile/app/services/device/fingerprint.ts
- [ ] T038 [US3] Create PhoneEntryScreen with country code selection and phone input in apps/mobile/app/screens/auth/PhoneEntryScreen.tsx
- [ ] T039 [US3] Create CodeVerificationScreen with 6-digit input and retry logic in apps/mobile/app/screens/auth/CodeVerificationScreen.tsx
- [ ] T040 [US3] Create ProfileSetupScreen with display name, avatar grid, preset picker, and zone selector in apps/mobile/app/screens/auth/ProfileSetupScreen.tsx
- [ ] T041 [US3] Wire AuthStack navigator with auth state persistence (MMKV token check on launch) in apps/mobile/app/navigators/AuthStack.tsx

**Checkpoint**: Users can sign up, log in, set up profile, and reach the map screen

---

## Phase 4: User Story 2 — Create a Flash Activity (Priority: P1) MVP

**Goal**: Authenticated users can create Flash activities via a 4-step bottom sheet in under 15 seconds

**Independent Test**: Tap FAB, complete creation flow, verify activity appears on map within 2 seconds

### Implementation for US2

- [ ] T042 [US2] Implement Activities context create_activity function with Flash mode validation (0-2h starts_at) in apps/api/lib/impulse/activities/activities.ex
- [ ] T043 [P] [US2] Implement Presets context list_by_locale function in apps/api/lib/impulse/gamification/presets.ex
- [ ] T044 [US2] Implement ActivityController with create action (POST /activities) in apps/api/lib/impulse_web/controllers/activity_controller.ex
- [ ] T045 [P] [US2] Implement ActivityJSON view in apps/api/lib/impulse_web/controllers/activity_json.ex
- [ ] T046 [P] [US2] Implement PresetController with index action (GET /presets) in apps/api/lib/impulse_web/controllers/preset_controller.ex
- [ ] T047 [P] [US2] Implement PresetJSON view in apps/api/lib/impulse_web/controllers/preset_json.ex
- [ ] T048 [US2] Implement MapChannel joining with city_id topic and PubSub broadcast on activity:created in apps/api/lib/impulse_web/channels/map_channel.ex
- [ ] T049 [US2] Implement AutoCompleteWorker (Oban) scheduled at starts_at + duration_minutes in apps/api/lib/impulse/activities/workers/auto_complete_worker.ex
- [ ] T050 [US2] Create WebSocket service wrapping Phoenix JS client with JWT auth and reconnection in apps/mobile/app/services/socket/socket-service.ts
- [ ] T051 [P] [US2] Create PresetGrid component (visual grid of 6-8 presets with icons) in apps/mobile/app/components/PresetGrid.tsx
- [ ] T052 [US2] Create CreateActivitySheet (4-step bottom sheet: preset → location → time → participants) in apps/mobile/app/screens/map/CreateActivitySheet.tsx
- [ ] T053 [US2] Create basic MapScreen with full-screen map, FAB, and channel subscription for new activities in apps/mobile/app/screens/map/MapScreen.tsx

**Checkpoint**: Users can create Flash activities that appear on the live map in real-time

---

## Phase 5: User Story 1 — Discover and Join a Flash Activity (Priority: P1) MVP

**Goal**: Users see live activity pins on the map and join with one tap + haptic feedback

**Independent Test**: Open app near seeded activities, tap a pin, join, verify real-time update for all viewers

### Implementation for US1

- [ ] T054 [US1] Create Ecto migration for participations table with unique (user_id, activity_id) constraint in apps/api/priv/repo/migrations/
- [ ] T055 [US1] Implement Participation schema with state transitions in apps/api/lib/impulse/activities/participation.ex
- [ ] T056 [US1] Implement Geo context with list_activities_in_radius (ST_DWithin) and list_activities_in_viewport (ST_Within) in apps/api/lib/impulse/geo/geo.ex
- [ ] T057 [US1] Implement join_activity and leave_activity in Activities context with atomic participant limit check in apps/api/lib/impulse/activities/activities.ex
- [ ] T058 [US1] Add index (GET /activities with geo query), join, and leave actions to ActivityController in apps/api/lib/impulse_web/controllers/activity_controller.ex
- [ ] T059 [US1] Add activity:joined, activity:left, and activity:full broadcasts to MapChannel in apps/api/lib/impulse_web/channels/map_channel.ex
- [ ] T060 [US1] Add viewport:update handler with differential PostGIS query to MapChannel in apps/api/lib/impulse_web/channels/map_channel.ex
- [ ] T061 [US1] Create ActivityPin custom map marker (preset icon + participant count + time remaining) in apps/mobile/app/components/ActivityPin.tsx
- [ ] T062 [US1] Create ActivityDetailModal (bottom sheet: activity info + participant list + Join button) in apps/mobile/app/screens/map/ActivityDetailModal.tsx
- [ ] T063 [US1] Integrate activity pins, tap-to-detail, and real-time join/leave updates into MapScreen in apps/mobile/app/screens/map/MapScreen.tsx
- [ ] T064 [US1] Add haptic feedback on join via expo-haptics and pin join animation via RN Reanimated in apps/mobile/app/screens/map/ActivityDetailModal.tsx
- [ ] T065 [US1] Implement pull-to-refresh fallback for poor connectivity in MapScreen in apps/mobile/app/screens/map/MapScreen.tsx

**Checkpoint**: Core Flash activity loop works end-to-end — create, discover on map, join with real-time updates

---

## Phase 6: User Story 4 — Schedule and Join a Planned Activity (Priority: P2)

**Goal**: Users can schedule activities up to 7 days ahead, browse Upcoming tab, confirm attendance

**Independent Test**: Create planned activity, join with 3+ users, verify confirmation flow and auto-cancel

### Implementation for US4

- [ ] T066 [US4] Extend Activities context with planned mode validation (1h-7d starts_at, up to 4h duration, free-tier 2/week limit) in apps/api/lib/impulse/activities/activities.ex
- [ ] T067 [US4] Add confirm_participation function and confirmed_count tracking to Activities context in apps/api/lib/impulse/activities/activities.ex
- [ ] T068 [US4] Implement AutoCancelWorker (Oban) scheduled at starts_at - 60min to check confirmed count vs min_participants in apps/api/lib/impulse/activities/workers/auto_cancel_worker.ex
- [ ] T069 [US4] Add upcoming (GET /activities/upcoming with geo query) and confirm actions to ActivityController in apps/api/lib/impulse_web/controllers/activity_controller.ex
- [ ] T070 [US4] Extend CreateActivitySheet with planned mode toggle, date picker, and extended duration options in apps/mobile/app/screens/map/CreateActivitySheet.tsx
- [ ] T071 [US4] Create UpcomingListScreen with chronological list of planned activities in apps/mobile/app/screens/upcoming/UpcomingListScreen.tsx
- [ ] T072 [P] [US4] Create ActivityDetailScreen for planned activity detail with join and confirm buttons in apps/mobile/app/screens/upcoming/ActivityDetailScreen.tsx
- [ ] T073 [US4] Add UpcomingTab to MainTabs navigator in apps/mobile/app/navigators/MainTabs.tsx

**Checkpoint**: Planned activities can be created, browsed, joined, confirmed, and auto-cancelled

---

## Phase 7: User Story 5 — Invisible Trust Scoring (Priority: P2)

**Goal**: Background trust engine silently adjusts user visibility based on behavior

**Independent Test**: Simulate positive/negative events for test accounts, verify visibility_score changes and shadow ban at < 0.2

### Implementation for US5

- [ ] T074 [US5] Create Ecto migration for trust_events table in apps/api/priv/repo/migrations/
- [ ] T075 [P] [US5] Create Ecto migration for reports table in apps/api/priv/repo/migrations/
- [ ] T076 [US5] Implement TrustEvent schema with event types and weights in apps/api/lib/impulse/trust/trust_event.ex
- [ ] T077 [P] [US5] Implement Report schema in apps/api/lib/impulse/safety/report.ex
- [ ] T078 [US5] Implement Trust context (record_event, recalculate_score, clamp 0.0-1.0, update user status on threshold) in apps/api/lib/impulse/trust/trust.ex
- [ ] T079 [US5] Implement TrustEventWorker (Oban) for async trust score recalculation per event in apps/api/lib/impulse/trust/workers/trust_event_worker.ex
- [ ] T080 [US5] Implement Safety context (validate_fingerprint, create_report, handle false_report penalty) in apps/api/lib/impulse/safety/safety.ex
- [ ] T081 [US5] Implement attendance verification via proximity check in apps/api/lib/impulse/trust/attendance_verification.ex
- [ ] T082 [US5] Add visibility_score filtering to Geo context activity queries (shadow ban: exclude activities from users with status shadow_banned) in apps/api/lib/impulse/geo/geo.ex
- [ ] T083 [US5] Wire trust events into activity lifecycle (attended → +0.03, no_show → -0.08, created_completed → +0.05) in apps/api/lib/impulse/activities/activities.ex
- [ ] T084 [US5] Implement ReportController with create action (POST /reports) in apps/api/lib/impulse_web/controllers/report_controller.ex
- [ ] T085 [US5] Add feedback action (POST /activities/:id/feedback) to ActivityController with trust event triggering in apps/api/lib/impulse_web/controllers/activity_controller.ex

**Checkpoint**: Trust engine silently modifies visibility — high-trust users rank higher, shadow-banned users are invisible

---

## Phase 8: User Story 6 — Ephemeral Activity Chat (Priority: P2)

**Goal**: Activity-scoped real-time chat with hard message deletion after expiry

**Independent Test**: Join activity, send messages, verify late-joiner filtering, confirm deletion after expiry window

### Implementation for US6

- [ ] T086 [US6] Create Ecto migration for messages table with expires_at column in apps/api/priv/repo/migrations/
- [ ] T087 [US6] Implement Message schema with expiry calculation (Flash: end + 30min, Planned: end + 1h) in apps/api/lib/impulse/chat/message.ex
- [ ] T088 [US6] Implement Chat context (send_message, list_messages_after_join_time, calculate_expiry) in apps/api/lib/impulse/chat/chat.ex
- [ ] T089 [US6] Implement MessageCleanupWorker (Oban, hourly cron) for hard-deleting messages where expires_at < now() in apps/api/lib/impulse/chat/workers/message_cleanup_worker.ex
- [ ] T090 [US6] Implement ActivityChannel with chat:message broadcast, join-time filtering, and chat availability window in apps/api/lib/impulse_web/channels/activity_channel.ex
- [ ] T091 [US6] Create ChatScreen with real-time message list, input field, and auto-scroll in apps/mobile/app/screens/activity/ChatScreen.tsx
- [ ] T092 [US6] Create LiveActivityScreen (active activity view with chat access, participant list, time remaining) in apps/mobile/app/screens/activity/LiveActivityScreen.tsx
- [ ] T093 [US6] Add ActivityTab to MainTabs navigator (conditionally visible when user is in an active activity) in apps/mobile/app/navigators/MainTabs.tsx

**Checkpoint**: Ephemeral chat works within activities, messages are filtered by join time and hard-deleted on expiry

---

## Phase 9: User Story 7 — Profile, Badges, and Trophies (Priority: P3)

**Goal**: Users view lightweight profiles with stats, badges (contextual, revocable), and trophies (permanent milestones)

**Independent Test**: View profile with seeded activity history, verify stats, badges, and trophies display correctly

### Implementation for US7

- [ ] T094 [US7] Create Ecto migration for badges table in apps/api/priv/repo/migrations/
- [ ] T095 [P] [US7] Create Ecto migration for trophies table in apps/api/priv/repo/migrations/
- [ ] T096 [US7] Implement Badge and Trophy schemas in apps/api/lib/impulse/gamification/badge.ex and trophy.ex
- [ ] T097 [US7] Implement Gamification context (award_badge, revoke_badge, award_trophy, check_badge_eligibility, check_trophy_milestones) in apps/api/lib/impulse/gamification/gamification.ex
- [ ] T098 [US7] Wire badge/trophy evaluation into activity completion lifecycle in apps/api/lib/impulse/activities/activities.ex
- [ ] T099 [US7] Add badges (GET /me/badges) and trophies (GET /me/trophies) actions to UserController in apps/api/lib/impulse_web/controllers/user_controller.ex
- [ ] T100 [P] [US7] Implement BadgeJSON and TrophyJSON views in apps/api/lib/impulse_web/controllers/
- [ ] T101 [US7] Implement UserChannel for personal notifications (badge:earned, trophy:unlocked) in apps/api/lib/impulse_web/channels/user_channel.ex
- [ ] T102 [US7] Create ProfileScreen (avatar, name, zone, stats, badges summary, trophies summary) in apps/mobile/app/screens/profile/ProfileScreen.tsx
- [ ] T103 [P] [US7] Create BadgesScreen (full badge list with types and dates) in apps/mobile/app/screens/profile/BadgesScreen.tsx
- [ ] T104 [P] [US7] Create TrophiesScreen (milestone grid) in apps/mobile/app/screens/profile/TrophiesScreen.tsx
- [ ] T105 [US7] Add ProfileTab to MainTabs navigator in apps/mobile/app/navigators/MainTabs.tsx

**Checkpoint**: Users can view profiles, stats, badges, and trophies — no social network features present

---

## Phase 10: User Story 8 — Pro Subscription (Priority: P3)

**Goal**: Users can subscribe to Impulse Pro ($4.99/month) for creation power features

**Independent Test**: Hit free-tier planned activity limit, subscribe, verify limits lift immediately

### Implementation for US8

- [ ] T106 [US8] Create Ecto migration for subscriptions table in apps/api/priv/repo/migrations/
- [ ] T107 [US8] Implement Subscription schema in apps/api/lib/impulse/billing/subscription.ex
- [ ] T108 [US8] Implement Billing context (create_checkout_session, sync_subscription_from_webhook, cancel_subscription) in apps/api/lib/impulse/billing/billing.ex
- [ ] T109 [US8] Implement SubscriptionController with create (POST /subscriptions) and delete (DELETE /subscriptions) actions in apps/api/lib/impulse_web/controllers/subscription_controller.ex
- [ ] T110 [US8] Implement Stripe webhook endpoint (POST /webhooks/stripe) with signature verification in apps/api/lib/impulse_web/controllers/webhook_controller.ex
- [ ] T111 [US8] Wire subscription_tier check into activity creation limits (planned 2/week free, unlimited pro; duration cap 4h free, 6h pro) in apps/api/lib/impulse/activities/activities.ex
- [ ] T112 [US8] Create SubscriptionScreen (Pro benefits list, subscribe button, current status) in apps/mobile/app/screens/profile/SubscriptionScreen.tsx
- [ ] T113 [US8] Create SettingsScreen with subscription link and account settings in apps/mobile/app/screens/profile/SettingsScreen.tsx

**Checkpoint**: Pro subscription works end-to-end — subscribe, unlock features, cancel

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Notifications, animations, i18n completion, and final validation

- [ ] T114 [P] Implement push notification service (FCM + APNs) in apps/api/lib/impulse/notifications/
- [ ] T115 [P] Implement notification triggers (nearby_activity nudge, confirmation_reminder, badge_earned, activity_status_change) in apps/api/lib/impulse/notifications/triggers.ex
- [ ] T116 [P] Configure expo-notifications for push token registration and handling in apps/mobile/app/services/notifications/
- [ ] T117 [P] Complete PT-BR translations for all user-facing strings in apps/mobile/app/i18n/pt-BR.ts
- [ ] T118 [P] Add pin animations (join pulse, time-remaining countdown) using RN Reanimated in apps/mobile/app/components/ActivityPin.tsx
- [ ] T119 Run quickstart.md validation (full backend + mobile setup from scratch on clean environment)
- [ ] T120 Code cleanup: remove unused imports, run `mix format` and `npm run lint --fix`, verify TypeScript strict mode

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US3 Auth (Phase 3)**: Depends on Phase 2 — BLOCKS US1, US2, US4 (they need auth)
- **US2 Create Flash (Phase 4)**: Depends on Phase 3 (auth required to create)
- **US1 Discover/Join (Phase 5)**: Depends on Phase 4 (needs activities to exist on map)
- **US4 Planned (Phase 6)**: Depends on Phase 3 (auth); can run in parallel with US1/US2
- **US5 Trust (Phase 7)**: Depends on Phase 5 (needs participation data to generate trust events)
- **US6 Chat (Phase 8)**: Depends on Phase 5 (needs active activities to scope chat)
- **US7 Profile (Phase 9)**: Depends on Phase 3 (auth); can run in parallel with Phases 4-8
- **US8 Subscription (Phase 10)**: Depends on Phase 6 (planned activity limits to gate)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US3 Auth (P1)**: After Foundational — prerequisite for all other stories
- **US2 Create Flash (P1)**: After US3 — supply side of the map
- **US1 Discover/Join (P1)**: After US2 — discovery needs activities on the map
- **US4 Planned (P2)**: After US3 — independent from Flash stories
- **US5 Trust (P2)**: After US1 — needs join/attendance data to trigger trust events
- **US6 Chat (P2)**: After US1 — needs activity participation for chat scoping
- **US7 Profile (P3)**: After US3 — can proceed independently
- **US8 Subscription (P3)**: After US4 — gates planned creation limits

### Within Each User Story

- Migrations before schemas
- Schemas before contexts
- Contexts before controllers/channels
- Backend before mobile (API must exist for mobile to call)
- Core implementation before integration

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005 can all run in parallel
- Phase 2: T008, T009, T011 (migrations) in parallel; T013, T014, T015, T016 (schemas) in parallel; T020, T021 (plugs) in parallel; T024-T028 (mobile setup) all in parallel
- Phase 3: T032, T034, T035, T037 (backend) in parallel; T038-T040 (screens) sequential
- Phase 4: T043, T045, T046, T047 in parallel; T050, T051 in parallel
- Phase 5: T061, T062 in parallel (different components)
- Phase 7: T074, T075 (migrations) in parallel; T076, T077 (schemas) in parallel
- Phase 9: T094, T095 in parallel; T100, T103, T104 in parallel
- Phase 11: T114, T115, T116, T117, T118 all in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all independent migrations together:
Task: "Create Ecto migration for zones table in apps/api/priv/repo/migrations/"
Task: "Create Ecto migration for presets table in apps/api/priv/repo/migrations/"
Task: "Create Ecto migration for device_records table in apps/api/priv/repo/migrations/"

# Launch all independent schemas together:
Task: "Implement Activity schema in apps/api/lib/impulse/activities/activity.ex"
Task: "Implement Preset schema in apps/api/lib/impulse/gamification/preset.ex"
Task: "Implement Zone schema in apps/api/lib/impulse/geo/zone.ex"
Task: "Implement DeviceRecord schema in apps/api/lib/impulse/safety/device_record.ex"

# Launch all mobile setup together:
Task: "Configure Apisauce API client in apps/mobile/app/services/api/api.ts"
Task: "Configure MMKV in apps/mobile/app/services/storage/storage.ts"
Task: "Set up React Navigation shell in apps/mobile/app/navigators/"
Task: "Configure i18n in apps/mobile/app/i18n/"
Task: "Create shared types in packages/shared/types/"
```

---

## Implementation Strategy

### MVP First (US3 + US2 + US1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US3 — Phone auth works
4. Complete Phase 4: US2 — Users can create Flash activities
5. Complete Phase 5: US1 — Users can discover and join
6. **STOP and VALIDATE**: Full Flash activity loop works end-to-end
7. Deploy/demo to seed users

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US3 (Auth) → Users can register → Deploy
3. US2 (Create Flash) → Supply side → Deploy
4. US1 (Discover/Join) → Full Flash loop → Deploy (MVP!)
5. US4 (Planned) → Scheduled events → Deploy
6. US5 (Trust) → Quality self-regulation → Deploy
7. US6 (Chat) → Coordination layer → Deploy
8. US7 (Profile) → Identity layer → Deploy
9. US8 (Subscription) → Revenue → Deploy
10. Polish → Store ready → Launch

### Parallel Team Strategy

With 2 developers (backend + mobile):

1. Both complete Setup + Foundational together
2. Backend dev: US3 backend → US2 backend → US1 backend → US5 → US6 backend
3. Mobile dev: US3 mobile → US2 mobile → US1 mobile → US4 mobile → US7 mobile
4. Sync at MVP checkpoint (after US1 complete)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend before mobile within each story (API must exist for mobile to call)
- All file paths are relative to repository root
