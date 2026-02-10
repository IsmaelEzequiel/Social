# Data Model: Impulse Core Platform

**Phase**: 1 — Design & Contracts
**Date**: 2026-02-10
**Database**: PostgreSQL 16 + PostGIS 3.4

## Entity Relationship Overview

```text
users 1──* participations *──1 activities
users 1──* activities (creator)
users 1──* badges
users 1──* trophies
users 1──* device_records
users 1──* trust_events
users 1──* reports (reporter)
users 1──* reports (reported)
users *──1 zones
users 1──0..1 subscriptions
activities *──1 presets
activities 1──* messages
activities 1──* participations
activities 1──* reports
zones belongs_to city (implicit via fields)
```

## Entities

### users

Primary identity entity. Phone-verified, one account per device fingerprint.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| phone_hash | VARCHAR(64) | NOT NULL, UNIQUE | SHA-256 of phone number |
| display_name | VARCHAR(30) | NOT NULL | User-chosen, public |
| avatar_preset | INTEGER | NOT NULL, DEFAULT 1 | Index into abstract avatar set |
| preferred_presets | INTEGER[] | DEFAULT '{}' | Array of preset IDs |
| zone_id | UUID (FK → zones) | NULLABLE | Broad neighborhood |
| trust_score | FLOAT | NOT NULL, DEFAULT 0.5 | Range: 0.0–1.0, never exposed |
| device_fingerprint | VARCHAR(64) | NOT NULL | SHA-256 hash, UNIQUE |
| subscription_tier | ENUM('free', 'pro') | NOT NULL, DEFAULT 'free' | |
| subscription_expires_at | TIMESTAMP WITH TZ | NULLABLE | NULL if free |
| status | ENUM('active', 'shadow_banned', 'suspended') | NOT NULL, DEFAULT 'active' | |
| activities_joined_count | INTEGER | NOT NULL, DEFAULT 0 | Denormalized counter |
| activities_created_count | INTEGER | NOT NULL, DEFAULT 0 | Denormalized counter |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |
| updated_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `phone_hash` (unique), `device_fingerprint` (unique), `zone_id`, `trust_score`, `status`

**Validation rules**:
- `display_name`: 2-30 characters, no special characters except spaces and hyphens
- `trust_score`: clamped to [0.0, 1.0] on every update
- `avatar_preset`: must reference a valid preset index (1-20)
- `device_fingerprint`: exactly 64 hex characters (SHA-256 output)

### activities

Core entity representing a time-bound, location-bound event.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| creator_id | UUID (FK → users) | NOT NULL | |
| mode | ENUM('flash', 'planned', 'recurring') | NOT NULL | |
| preset_id | UUID (FK → presets) | NOT NULL | Activity category |
| title | VARCHAR(60) | NOT NULL | Auto-generated from preset, editable |
| location | GEOMETRY(Point, 4326) | NOT NULL | PostGIS point, SRID 4326 (WGS84) |
| location_name | VARCHAR(100) | NULLABLE | Venue name or area description |
| starts_at | TIMESTAMP WITH TZ | NOT NULL | |
| duration_minutes | INTEGER | NOT NULL | Range: 30–360 |
| max_participants | INTEGER | NOT NULL | Range: 3–20 |
| min_participants | INTEGER | NOT NULL, DEFAULT 3 | |
| status | ENUM('open', 'full', 'active', 'completed', 'cancelled') | NOT NULL, DEFAULT 'open' | |
| visibility_score | FLOAT | NOT NULL | Derived from creator's trust_score |
| confirmed_count | INTEGER | NOT NULL, DEFAULT 0 | Denormalized (planned mode) |
| recurring_rule | JSONB | NULLABLE | Only for recurring mode: {day, time, frequency} |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `location` (GiST), `creator_id`, `mode`, `status`, `starts_at`, `preset_id`, composite `(status, mode, starts_at)` for upcoming queries

**Validation rules**:
- Flash mode: `starts_at` must be within 0-2 hours from now
- Planned mode: `starts_at` must be within 1 hour to 7 days from now
- Recurring mode: `recurring_rule` must not be null
- `duration_minutes`: 30-240 (free), 30-360 (pro)
- `max_participants`: 3-20
- `min_participants`: 2-max_participants, default 3

**State transitions**:
```text
open → full         (when participant count == max_participants)
full → open         (when participant leaves and count < max)
open → active       (when starts_at is reached and count >= min)
full → active       (when starts_at is reached)
active → completed  (when starts_at + duration_minutes is reached)
open → cancelled    (auto: < min confirmed at T-1h for planned)
open → cancelled    (manual: creator cancels)
active → cancelled  (when all participants leave)
```

### participations

Join table tracking user-activity relationship and attendance.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| user_id | UUID (FK → users) | NOT NULL | |
| activity_id | UUID (FK → activities) | NOT NULL | |
| status | ENUM('joined', 'confirmed', 'attended', 'no_show', 'cancelled') | NOT NULL, DEFAULT 'joined' | |
| joined_at | TIMESTAMP WITH TZ | NOT NULL | |
| confirmed_at | TIMESTAMP WITH TZ | NULLABLE | Planned mode only |
| attended_at | TIMESTAMP WITH TZ | NULLABLE | Set by proximity check |
| feedback_score | INTEGER | NULLABLE | 1–5, post-activity |
| feedback_text | VARCHAR(200) | NULLABLE | Optional short feedback |

**Indexes**: UNIQUE `(user_id, activity_id)`, `activity_id`, `status`

**Validation rules**:
- One participation per user per activity (unique constraint)
- `feedback_score`: 1-5, only settable after activity status is `completed`
- `confirmed_at`: only applicable when activity mode is `planned`

**State transitions**:
```text
joined → confirmed    (user confirms planned activity attendance)
joined → cancelled    (user leaves before activity starts)
confirmed → cancelled (user cancels after confirming)
joined → attended     (proximity check confirms presence)
confirmed → attended  (proximity check confirms presence)
joined → no_show      (activity completed without attendance)
confirmed → no_show   (activity completed without attendance)
```

### presets

Localized activity category definitions.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| name | VARCHAR(40) | NOT NULL | Localized display name |
| icon | VARCHAR(50) | NOT NULL | Icon identifier |
| locale | VARCHAR(5) | NOT NULL, DEFAULT 'pt-BR' | BCP-47 locale code |
| allowed_hours | JSONB | NOT NULL | {start: 6, end: 23} — hours of day |
| max_duration | INTEGER | NOT NULL, DEFAULT 240 | Minutes |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display ordering |
| active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `(locale, active)`, `sort_order`

### zones

Broad neighborhood polygons per city.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| city | VARCHAR(50) | NOT NULL | City name |
| name | VARCHAR(50) | NOT NULL | Neighborhood name |
| geometry | GEOMETRY(Polygon, 4326) | NOT NULL | Boundary polygon |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `geometry` (GiST), `city`

### badges

Contextual, revocable achievements.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| user_id | UUID (FK → users) | NOT NULL | |
| type | VARCHAR(30) | NOT NULL | Badge type identifier |
| earned_at | TIMESTAMP WITH TZ | NOT NULL | |
| revoked_at | TIMESTAMP WITH TZ | NULLABLE | Set if conditions no longer met |

**Indexes**: `user_id`, `(user_id, type)`

### trophies

Permanent, non-revocable milestones.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| user_id | UUID (FK → users) | NOT NULL | |
| type | VARCHAR(30) | NOT NULL | Trophy type identifier |
| earned_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `user_id`, UNIQUE `(user_id, type)`

### messages

Ephemeral chat messages scoped to activities.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| activity_id | UUID (FK → activities) | NOT NULL | |
| user_id | UUID (FK → users) | NOT NULL | |
| body | VARCHAR(500) | NOT NULL | Message content |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |
| expires_at | TIMESTAMP WITH TZ | NOT NULL | Hard-delete deadline |

**Indexes**: `(activity_id, inserted_at)`, `expires_at` (for cleanup job)

**Validation rules**:
- `body`: 1-500 characters, no empty messages
- `expires_at`: auto-calculated (Flash: activity end + 30 min; Planned: activity end + 1 hour)

### device_records

Device fingerprint tracking for fraud detection.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| user_id | UUID (FK → users) | NOT NULL | |
| fingerprint | VARCHAR(64) | NOT NULL | SHA-256 hash |
| platform | ENUM('ios', 'android') | NOT NULL | |
| last_seen_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `fingerprint`, `user_id`

### trust_events

Audit log of all trust score changes.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| user_id | UUID (FK → users) | NOT NULL | |
| event_type | VARCHAR(30) | NOT NULL | E.g., 'attended', 'no_show', 'reported' |
| delta | FLOAT | NOT NULL | Positive or negative change |
| score_after | FLOAT | NOT NULL | Trust score after applying delta |
| reference_id | UUID | NULLABLE | Activity or report ID |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `user_id`, `(user_id, inserted_at)`, `event_type`

**Event types and weights**:

| event_type | delta | trigger |
|-----------|-------|---------|
| attended | +0.03 | Proximity-verified attendance |
| created_completed | +0.05 | Activity created by user reached completion |
| no_show | -0.08 | Joined but not present at activity |
| cancelled_late | -0.04 | Cancelled < 30 min before start |
| cancelled_early | -0.01 | Cancelled > 2 hours before start |
| positive_feedback | +0.02 | Received feedback score 4-5 |
| negative_feedback | -0.03 | Received feedback score 1-2 |
| reported | -0.06 | Reported by another user |
| report_verified | -0.15 | Report verified by system |
| false_report | -0.10 | Reporter penalized for invalid report |
| consecutive_active | +0.01 | Per consecutive active day (max +0.05) |
| device_change | -0.10 | Device fingerprint changed |

### reports

User safety reports.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| reporter_id | UUID (FK → users) | NOT NULL | |
| reported_id | UUID (FK → users) | NOT NULL | |
| activity_id | UUID (FK → activities) | NULLABLE | Context activity |
| reason | VARCHAR(50) | NOT NULL | Preset reason categories |
| details | VARCHAR(500) | NULLABLE | Additional context |
| status | ENUM('pending', 'verified', 'dismissed', 'false_report') | NOT NULL, DEFAULT 'pending' | |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `reporter_id`, `reported_id`, `status`

### subscriptions

Pro subscription records.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID (PK) | NOT NULL, gen_random_uuid() | |
| user_id | UUID (FK → users) | NOT NULL, UNIQUE | One active subscription per user |
| stripe_customer_id | VARCHAR(50) | NOT NULL | Stripe customer ID |
| stripe_subscription_id | VARCHAR(50) | NOT NULL | Stripe subscription ID |
| status | ENUM('active', 'past_due', 'cancelled', 'expired') | NOT NULL | |
| current_period_end | TIMESTAMP WITH TZ | NOT NULL | |
| inserted_at | TIMESTAMP WITH TZ | NOT NULL | |
| updated_at | TIMESTAMP WITH TZ | NOT NULL | |

**Indexes**: `user_id` (unique), `stripe_customer_id`, `stripe_subscription_id`

## PostGIS Configuration

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Activities spatial index
CREATE INDEX idx_activities_location ON activities USING GIST (location);

-- Zones spatial index
CREATE INDEX idx_zones_geometry ON zones USING GIST (geometry);
```

**SRID**: 4326 (WGS84) for all geometry columns. This is the standard GPS coordinate system used by mobile devices.
