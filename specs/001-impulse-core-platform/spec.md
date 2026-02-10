# Feature Specification: Impulse Core Platform

**Feature Branch**: `001-impulse-core-platform`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Impulse Activity App - mobile-first platform for discovering, creating, and joining real-life activities with three modes (Flash, Planned, Recurring), invisible trust engine, safety-by-design, and fair monetization."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Join a Flash Activity (Priority: P1)

A user opens the app and sees a full-screen map showing live
activities near their location. They spot a coffee meetup pin
3 blocks away starting in 20 minutes. They tap the pin, see
the activity details (preset, time remaining, participant count),
and join with a single tap. They receive haptic feedback and
the pin animates to confirm their participation.

**Why this priority**: Flash activities are the product's core DNA
and signature differentiator. Without this flow working flawlessly,
the product has no reason to exist. This is the minimum viable
experience.

**Independent Test**: Can be fully tested by opening the app near
a seeded activity, tapping a map pin, and joining. Delivers the
core value of "impulse to real-world encounter."

**Acceptance Scenarios**:

1. **Given** the user has the app open on the map screen, **When**
   activities exist within the default 2km radius, **Then** activity
   pins appear on the map with preset icons, participant counts, and
   time remaining indicators.
2. **Given** the user taps an activity pin, **When** the activity
   detail sheet appears, **Then** it shows the preset category, title,
   location name, start time, duration, current/max participants, and
   a prominent "Join" button.
3. **Given** the user taps "Join," **When** the activity is not full,
   **Then** the user is added as a participant, receives haptic
   feedback, the pin animates, and the participant count updates in
   real-time for all viewers.
4. **Given** the user taps "Join," **When** the activity is already
   full, **Then** the system displays a clear message and the join
   action is blocked.
5. **Given** another user joins or leaves an activity, **When** the
   current user is viewing the map, **Then** the affected pin updates
   in real-time without the user refreshing.

---

### User Story 2 - Create a Flash Activity (Priority: P1)

A user feels spontaneous and wants to play basketball in 30
minutes. They tap the floating action button on the map, select
"Basketball" from a visual preset grid, confirm their current
location (or drag the pin), choose "starts in 30 min," set max
participants to 8, and confirm. The activity goes live on the map
immediately. The entire creation flow takes under 15 seconds.

**Why this priority**: Creation is the supply side of Flash
activities. Without creators, there is nothing to discover.
This is equally critical as discovery/joining.

**Independent Test**: Can be tested by tapping the FAB, completing
the 4-step bottom sheet, and verifying the new activity appears
on the map within seconds.

**Acceptance Scenarios**:

1. **Given** the user taps the floating action button, **When** the
   creation bottom sheet appears, **Then** it presents Step 1: a
   visual grid of 6-8 activity presets for the user's locale.
2. **Given** the user selects a preset, **When** Step 2 appears,
   **Then** their current location is pre-filled and they can drag
   the pin to adjust.
3. **Given** the user confirms location, **When** Step 3 appears,
   **Then** time options are presented (now, 15 min, 30 min, 1 hr,
   2 hr) and the user selects one.
4. **Given** the user selects a time, **When** Step 4 appears,
   **Then** a participant slider (3-20) is shown with a default of 5.
5. **Given** the user taps "Confirm," **When** the activity is
   created, **Then** it appears on the map for all nearby users
   within 2 seconds.
6. **Given** the entire creation flow, **When** measured end-to-end,
   **Then** it completes in under 15 seconds for a returning user.

---

### User Story 3 - Phone-Based Authentication (Priority: P1)

A new user downloads the app, enters their phone number, receives
an SMS verification code, enters the code, and is taken to a
one-time profile setup screen where they choose a display name,
select an abstract avatar, pick preferred activity types, and
select their broad neighborhood zone.

**Why this priority**: Authentication is a prerequisite for all
other functionality. Phone-based auth also serves as the first
layer of the safety system (one phone = one identity).

**Independent Test**: Can be tested by completing the full signup
flow from phone entry to profile setup and landing on the map
screen.

**Acceptance Scenarios**:

1. **Given** the user opens the app for the first time, **When**
   the auth screen loads, **Then** a phone number input is displayed
   with country code selection.
2. **Given** the user submits a valid phone number, **When** the
   system sends an SMS, **Then** a code verification screen appears
   within 3 seconds.
3. **Given** the user enters the correct verification code, **When**
   this is their first login, **Then** the profile setup screen
   appears with required fields: display name, abstract avatar
   selection, preferred activity types (preset list), and
   neighborhood zone.
4. **Given** the user completes profile setup, **When** they tap
   "Done," **Then** they are taken to the map screen and their
   session persists across app restarts.
5. **Given** the user enters an incorrect code, **When** they have
   remaining attempts, **Then** an error message is shown and they
   can retry.
6. **Given** the user is a returning user, **When** they verify
   their phone, **Then** they skip profile setup and land directly
   on the map.

---

### User Story 4 - Schedule and Join a Planned Activity (Priority: P2)

A user wants to organize a group run for Saturday morning. They
switch to the creation flow, select "Running" preset, pick a
date/time via a date picker (up to 7 days ahead), set a meeting
point, and publish. The activity appears in the "Upcoming" tab
(not on the main map). Other users discover it there, join, and
2 hours before the event a group chat opens. One hour before start,
participants must confirm attendance. If fewer than 3 confirm, the
activity auto-cancels.

**Why this priority**: Planned activities expand the product beyond
pure impulse and serve users who want to organize ahead. This is
the "body" to Flash's "soul."

**Independent Test**: Can be tested by creating a planned activity,
having 3+ users join, verifying chat opens 2 hours before, testing
the confirmation flow, and verifying auto-cancel with fewer than 3
confirmations.

**Acceptance Scenarios**:

1. **Given** the user selects "Planned" mode in the creation flow,
   **When** the date picker appears, **Then** dates up to 7 days
   in advance are selectable and duration can extend to 4 hours.
2. **Given** a planned activity exists, **When** users browse the
   "Upcoming" tab, **Then** the activity appears in a chronological
   list with details but does NOT appear on the main map.
3. **Given** the activity start is 2 hours away, **When** the
   scheduled time arrives, **Then** a group chat opens for all
   joined participants.
4. **Given** the activity start is 1 hour away, **When** the
   confirmation window opens, **Then** all participants receive
   a notification to confirm attendance.
5. **Given** fewer than 3 participants confirm, **When** the
   confirmation window closes, **Then** the activity auto-cancels
   and all participants are notified.
6. **Given** the user is a free-tier user, **When** they attempt
   to create a third planned activity in the same week, **Then**
   the system informs them of the weekly limit (2 per week).

---

### User Story 5 - Invisible Trust Scoring (Priority: P2)

After joining and attending several activities, a user builds
trust through consistent positive behavior — showing up, getting
good feedback, not cancelling last-minute. Their activities
gradually gain higher visibility on the map. Conversely, a user
who repeatedly no-shows or receives reports sees their activities
silently deprioritized. They are never told their trust is low;
their activities simply appear less often to others.

**Why this priority**: The trust engine is the invisible backbone
of safety and quality. Without it, the platform has no way to
self-regulate and bad actors degrade the experience for everyone.

**Independent Test**: Can be tested by simulating a series of
positive and negative events for test accounts and verifying that
activity visibility scores change accordingly, including shadow
ban behavior at score < 0.2.

**Acceptance Scenarios**:

1. **Given** a new user registers, **When** their trust score is
   initialized, **Then** it starts at 0.5.
2. **Given** a user attends an activity, **When** their trust
   score is recalculated, **Then** it increases by the defined
   weight (+0.03).
3. **Given** a user no-shows (joined but absent), **When** their
   trust score is recalculated, **Then** it decreases by the
   defined weight (-0.08).
4. **Given** a user's trust score drops below 0.2, **When** they
   create an activity, **Then** the activity is invisible to all
   other users (shadow ban) and the user receives no notification
   of this state.
5. **Given** a user's trust score is above 0.7, **When** their
   activities appear in search results, **Then** they rank higher
   in visibility than activities from users with lower scores.

---

### User Story 6 - Ephemeral Activity Chat (Priority: P2)

After joining a Flash activity, a user gains access to a group
chat scoped to that activity. They can coordinate logistics
("I'm wearing a blue jacket") with other participants. The chat
expires 30 minutes after the activity ends and all messages are
permanently deleted. Late joiners only see messages posted after
their join time.

**Why this priority**: Minimal coordination is needed for
real-world meetups (finding each other, last-minute changes)
but chat must remain ephemeral to prevent the product from
becoming a messaging app.

**Independent Test**: Can be tested by joining an activity,
sending messages, verifying late joiners see only newer messages,
and confirming messages are deleted after the expiry window.

**Acceptance Scenarios**:

1. **Given** a user joins a Flash activity, **When** the activity
   chat is accessed, **Then** they see only messages sent after
   their join time.
2. **Given** a user is in an activity chat, **When** they send a
   message, **Then** it appears in real-time for all current
   participants.
3. **Given** a Flash activity has ended, **When** 30 minutes pass,
   **Then** all messages are permanently deleted from the system.
4. **Given** a planned activity, **When** the start time is 2 hours
   away, **Then** the chat becomes available; it expires 1 hour
   after the activity ends.

---

### User Story 7 - Profile, Badges, and Trophies (Priority: P3)

A user views their profile to see their abstract avatar, display
name, zone, and activity stats (count of activities joined and
created). They browse earned badges (contextual achievements like
"5 Flash activities in a row") and trophies (permanent milestones
like "50 activities attended"). Badges and trophies are visible to
others only during shared activities.

**Why this priority**: Lightweight identity builds minimum trust
between strangers without creating social network dynamics. Badges
and trophies provide intrinsic motivation to stay active.

**Independent Test**: Can be tested by viewing a profile with
seeded activity history and verifying all stats, badges, and
trophies display correctly.

**Acceptance Scenarios**:

1. **Given** the user navigates to their profile, **When** the
   profile screen loads, **Then** it displays: abstract avatar
   (large, centered), display name, zone, activity stats
   (X joined, Y created), badges section, and trophies section.
2. **Given** the user has earned badges, **When** viewing the
   badges screen, **Then** each badge shows type and date earned.
3. **Given** a user views another participant's info during an
   activity, **When** the info loads, **Then** badges and trophies
   are visible but no freeform text, bio, or social links exist.
4. **Given** the user has never participated in an activity,
   **When** viewing their profile, **Then** stats show zero and
   badge/trophy sections display an encouraging empty state.

---

### User Story 8 - Pro Subscription (Priority: P3)

A power user who creates many planned activities hits the free
tier limit (2 planned per week). They navigate to the subscription
screen, review Pro benefits (unlimited planned creation, recurring
activities, activity insights, extended duration, custom presets),
and subscribe for $4.99/month. After subscribing, the limits are
immediately lifted.

**Why this priority**: Monetization is necessary for sustainability
but is deliberately the last priority because core free experience
must be solid before layering revenue.

**Independent Test**: Can be tested by hitting the free tier limit,
subscribing, and verifying all Pro features unlock immediately.

**Acceptance Scenarios**:

1. **Given** a free user navigates to the subscription screen,
   **When** the screen loads, **Then** all Pro benefits are clearly
   listed with a subscribe button at $4.99/month.
2. **Given** the user completes payment, **When** the subscription
   is active, **Then** planned activity creation limits are
   immediately lifted.
3. **Given** a Pro user, **When** they create a planned activity,
   **Then** they can set duration up to 6 hours (vs 4 hours free).
4. **Given** a Pro user cancels their subscription, **When** the
   current billing period ends, **Then** they revert to free tier
   limits but retain any badges/trophies earned.

---

### Edge Cases

- What happens when a user's device loses connectivity mid-join?
  The system queues the join request and processes it when
  connectivity resumes; the user sees a pending state indicator.
- How does the system handle simultaneous joins that would exceed
  max participants? The server enforces the limit atomically;
  the later request receives a "full" response.
- What happens when a user changes devices? Device fingerprint
  change triggers a trust penalty (-0.10) and 24-hour cooldown
  before full functionality is restored.
- What happens if a creator leaves their own activity? The
  activity remains active if above minimum participants; it
  auto-cancels if below minimum after a 5-minute grace period.
- How does the system handle GPS spoofing for attendance
  verification? Attendance verification cross-references device
  fingerprint, GPS proximity, and activity-check-in timing;
  anomalies reduce trust score.
- What happens when all participants leave before the activity
  ends? The activity auto-cancels and is removed from the map.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register and authenticate
  via phone number with SMS verification code
- **FR-002**: System MUST support three activity modes: Flash
  (starts 0-2 hours), Planned (up to 7 days ahead), and Recurring
  (weekly, v2 feature)
- **FR-003**: System MUST render activities as pins on a real-time
  map with preset icons, participant counts, and time indicators
- **FR-004**: System MUST allow one-tap joining of activities with
  immediate real-time feedback to all map viewers
- **FR-005**: System MUST enforce participant limits (3-20) with
  atomic server-side validation
- **FR-006**: System MUST calculate and maintain an invisible trust
  score (0.0-1.0) for every user, updated after each relevant event
- **FR-007**: System MUST shadow-ban users with trust score below
  0.2 without any user-visible indication
- **FR-008**: System MUST enforce one active account per device
  fingerprint
- **FR-009**: System MUST provide ephemeral activity-scoped chat
  that is permanently deleted after the configured expiry window
- **FR-010**: System MUST auto-cancel planned activities with fewer
  than 3 confirmed participants 1 hour before start
- **FR-011**: System MUST support localized activity presets per
  city/locale
- **FR-012**: System MUST provide proximity-based attendance
  verification for trust score calculations
- **FR-013**: System MUST support two subscription tiers: Free
  (core features, 2 planned/week) and Pro ($4.99/month, unlimited
  planned, recurring, extended duration, insights)
- **FR-014**: System MUST display user profiles with abstract
  avatars, activity stats, badges, and trophies only — no bios,
  followers, or freeform text
- **FR-015**: System MUST send push notifications for: nearby
  activity nudges, confirmation reminders, badge/trophy earned,
  and activity status changes
- **FR-016**: System MUST support a report system where users can
  report others, with trust penalties for verified reports and
  false-report penalties for the reporter
- **FR-017**: System MUST separate Flash activities (main map) and
  Planned activities (Upcoming tab) in the user interface
- **FR-018**: System MUST limit Flash activity creation flow to
  a bottom sheet completing in under 15 seconds

### Key Entities

- **User**: Registered individual with phone-verified identity,
  display name, abstract avatar, preferred activity types,
  neighborhood zone, invisible trust score, and subscription tier
- **Activity**: A time-bound, location-bound event with a mode
  (flash/planned/recurring), preset category, participant limits,
  lifecycle status, and visibility score derived from creator trust
- **Participation**: Relationship between a user and an activity
  tracking status (joined, confirmed, attended, no-show, cancelled)
  and post-activity feedback
- **Preset**: Localized activity category with icon, allowed hours,
  and max duration constraints
- **Zone**: Broad neighborhood polygon within a city used for
  user location (never precise)
- **Badge**: Contextual achievement earned through activity
  patterns, revocable if conditions change
- **Trophy**: Permanent milestone achievement that cannot be
  revoked once earned
- **Message**: Ephemeral chat message scoped to an activity with
  an expiry timestamp for hard deletion
- **Trust Event**: Logged record of each trust score change with
  event type, delta, and timestamp
- **Subscription**: Pro subscription record with status and
  billing period

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the Flash activity creation flow
  in under 15 seconds from tapping the FAB to activity going live
- **SC-002**: Activity map updates reach all viewers within
  2 seconds of any state change (join, leave, create, cancel)
- **SC-003**: At least 50% of created activities reach completion
  (minimum participants attend) by week 4 of city launch
- **SC-004**: Average participants per completed activity reaches
  4.5 or higher by week 8 of city launch
- **SC-005**: No-show rate decreases below 30% by week 8 of
  city launch, driven by trust engine effects
- **SC-006**: At least 35% of users who participate in one activity
  return for a second activity within 7 days by week 8
- **SC-007**: Non-founder-initiated activities reach 10 per day
  by week 8 of city launch, indicating organic supply growth
- **SC-008**: Users can complete phone authentication and profile
  setup in under 2 minutes on first launch
- **SC-009**: System supports 1,000 concurrent users per city
  with real-time map updates without degradation
- **SC-010**: Ephemeral chat messages are permanently deleted
  within 1 hour of their expiry timestamp
