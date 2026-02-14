# UX/UI Audit & Improvement Plan — Impulse App

**Based on current implementation screenshots (iOS Simulator)**
**February 2026**

---

## Table of Contents

- [Current State Summary](#current-state-summary)
- [Critical Bugs](#critical-bugs)
- [Map Screen (Home)](#1-map-screen-home)
- [Activity Creation Flow](#2-activity-creation-flow)
- [Activity Pins / Markers](#3-activity-pins--markers)
- [Tab Bar](#4-tab-bar)
- [Missing Screens & Features](#5-missing-screens--features)
- [Complete Revised Flow](#6-complete-revised-flow)
- [Design System Recommendations](#7-design-system-recommendations)
- [Priority Implementation Order](#8-priority-implementation-order)

---

## Current State Summary

### What's Working
- ✅ Mapbox integration is functional
- ✅ Radius filter pills (1km, 5km, 10km, 25km) — good concept
- ✅ Bottom sheet for activity creation — right pattern
- ✅ Step-by-step creation (location → type → duration → size) — logical flow
- ✅ Activity pins appear on map after creation
- ✅ Tab bar with 4 sections (Map, Próximos, My Events, Perfil)
- ✅ FAB (+) button for creation — correct pattern
- ✅ Participant count shown on pins (0/5)

### What Needs Work
- 🔴 Icons rendering as text names instead of actual icons (critical bug)
- 🔴 Activity type grid shows 3 identical columns (critical bug)
- 🟡 Map pins show raw icon names ("lightning-bolt", "volleyball")
- 🟡 No visual distinction between Flash and Planned activities
- 🟡 Mixed languages in UI (English + Portuguese)
- 🟡 Creation flow has too many separate steps
- 🟡 No activity detail view when tapping a pin
- 🟡 No visual feedback on join actions
- 🟡 Missing time indicator on pins (when does it start? how long left?)

---

## Critical Bugs

### Bug 1: Icons Showing as Text Names

**Screen:** Choose Type (Image 4) + Map Pins (Images 1, 5, 7)

The icon names are rendering as raw text ("soccer-ball", "running", "basketball", "lightning-bolt") instead of actual icons. This is likely one of:

- **MaterialCommunityIcons / FontAwesome not loaded** — fonts not bundled or `expo-font` not loading them
- **Icon component rendering `name` prop as text** instead of passing it to the icon library
- **Font linking issue** — native fonts not linked after Ignite scaffold

**Fix approach:**
```typescript
// Instead of rendering the icon name as text:
<Text>{preset.icon}</Text>  // ❌ Current (broken)

// Render the actual icon component:
import { MaterialCommunityIcons } from "@expo/vector-icons"
<MaterialCommunityIcons name={preset.icon} size={32} color="#6C63FF" />  // ✅ Fixed
```

**Verification:** Check that `@expo/vector-icons` is installed and fonts are loaded in `App.tsx` or `app.tsx` before rendering the navigator.

---

### Bug 2: Activity Type Grid Shows 3 Identical Columns

**Screen:** Choose Type (Image 4)

Each activity type (Futebol, Corrida, Basquete, etc.) appears 3 times in 3 identical columns. This is a rendering bug — likely the grid is mapping over the same array 3 times or the `FlatList`/`FlashList` `numColumns` prop is conflicting with the data.

**Likely cause:**
```typescript
// Possible bug: data duplicated or mapped multiple times
const columns = [presets, presets, presets]  // ❌ 3x duplication

// Or: FlatList rendering issue with key extraction
<FlatList
  data={presets}
  numColumns={3}
  renderItem={...}
  keyExtractor={(item) => item.id}  // Make sure IDs are unique
/>
```

**Fix:** Ensure the data source is a single flat array and `numColumns={3}` handles the grid layout. Each item should appear once.

---

## 1. Map Screen (Home)

### 1.1 Radius Filter Pills

**Current:** Horizontal row of pills (1km, 5km, 10km, 25km) at the top of the map.

**Issues:**
- Pills overlap with map controls and status bar
- No visual connection between selected radius and map zoom level
- "5 km" is selected (blue fill) but the map shows a much larger area than 5km

**Recommendations:**

| Change | Why |
|--------|-----|
| Move pills below the safe area (add top padding) | Prevents overlap with status bar/notch |
| Auto-zoom map when radius changes | User expects selecting "1km" to zoom in |
| Add subtle radius circle overlay on map | Shows the actual search area visually |
| Consider replacing with a single expandable chip | Saves space: show "5 km ▼" that expands to options |
| Animate transitions between radius changes | Smooth zoom + circle resize feels polished |

**Suggested implementation:**
```
┌─────────────────────────────────┐
│ ●  Search area                  │  ← subtle label
│ [1km] [5km•] [10km] [25km]     │  ← pills with dot indicator
│                                 │
│         ╭─── ─── ───╮          │
│        │    ◉ you    │          │  ← faint circle showing radius
│         ╰─── ─── ───╯          │
│                                 │
│              [+]                │  ← FAB
└─────────────────────────────────┘
```

### 1.2 Empty State

**Current:** When no activities exist nearby, the map just shows... nothing. No guidance.

**Recommendation:** Add an empty state message:

```
┌─────────────────────────────────┐
│                                 │
│          🫥                      │
│   Nothing happening nearby      │
│   Be the first! Tap + to       │
│   create an activity            │
│                                 │
│              [+]                │
└─────────────────────────────────┘
```

This could be a translucent card floating on the map that disappears once there are activities.

### 1.3 FAB (+) Button

**Current:** Purple circle with "+" in bottom-right corner. Fine, but:

**Recommendations:**
- Add a subtle label on first launch: "Create activity" tooltip that appears once
- Consider a pulsing animation when map is empty (draws attention)
- On tap, should expand into the creation sheet (not navigate to a new screen)
- The "ℹ️" button next to it — what does it do? If it's not essential, remove it. Every button competes for attention.

---

## 2. Activity Creation Flow

### Current Flow (5 separate steps):

```
1. Tap (+)
2. "Where?" → tap on map → confirm location ✓
3. "Choose type" → full-screen grid → tap type
4. "New activity: Duration" → bottom sheet → tap duration
5. "New activity: How many?" → bottom sheet → tap count → "Create activity"
```

**Problem:** This is **5 taps minimum** across **3 different UI patterns** (map interaction, full-screen grid, bottom sheet). The spec says "Create activity < 15 seconds" — this flow takes ~20-30 seconds because of screen transitions.

### Recommended Revised Flow (Single Bottom Sheet)

Collapse everything into one progressive bottom sheet with swipeable steps:

```
Tap (+) → Bottom sheet opens (half screen)

┌─────────────────────────────────┐
│ New Activity                  ✕ │
│─────────────────────────────────│
│                                 │
│ What?                           │
│ [⚽] [🏃] [🏀] [🏐] [🛹] [🚴] │  ← icon grid (1 row, scroll)
│ [🚶] [☕] [🎬] [🧘] [🍺] [+]  │  ← 2 rows max
│                                 │
│ When?                    Flash ⚡│
│ [Now] [15m] [30m] [1hr] [2hr]  │  ← pills, "Now" default
│                                 │
│ How many?                       │
│ ○○○○○●○○○○○○○○○○○○  5          │  ← simple slider
│ 3                          20   │
│                                 │
│ Where?                          │
│ 📍 Near SFMOMA (current loc)   │  ← auto-filled, tap to change
│                                 │
│ ┌─────────────────────────────┐ │
│ │      ⚡ Create Flash         │ │  ← primary CTA
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Key changes:**
- **Everything in one sheet** — no screen transitions
- **"What?" first** — the most important decision
- **"Where?" auto-fills** to current location (90% of users won't change it)
- **"When?" defaults to "Now"** — reinforces Flash as the core mode
- **Slider for participant count** instead of button grid (faster, more visual)
- **One tap to create** after selections
- **Total taps: 4** (open sheet → pick type → confirm defaults → create)
- **Total time: 5-8 seconds** for a Flash activity with defaults

### 2.1 "Where?" Location Selection

**Current:** Full-screen map with "Where?" banner, user taps map, then confirms with ✓ checkmark button.

**Problems:**
- It's a separate full-screen step (feels heavy)
- Two buttons appear (✓ and +) — confusing which does what
- No search/autocomplete for venue names

**Recommendation:**
- Auto-fill with current GPS location + reverse geocoded name
- Show as a tappable row in the bottom sheet: `📍 Near SFMOMA`
- Tap to expand → map with draggable pin + search bar
- Most users will accept the default → zero friction for the common case

### 2.2 Activity Type Selector

**Current:** Full-screen grid, 3 columns, icon names as text, Portuguese labels below.

**Problems (beyond the bug):**
- Full screen for 6-8 options is overkill
- No visual grouping (sports vs social vs culture)
- Icon names as text make everything look the same
- 3 identical columns is a rendering bug

**Recommendation:**
- 2 rows of horizontally scrollable icon chips inside the bottom sheet
- Each chip: actual icon (24px) + short label below
- Selected state: filled background + subtle scale animation
- Group by feel: Row 1 = Active (sports), Row 2 = Chill (coffee, movie, walk)

```
Active:  [⚽ Futebol] [🏃 Corrida] [🏀 Basquete] [🏐 Vôlei] [🛹 Skate] →
Chill:   [☕ Café]    [🍺 Bar]     [🎬 Cinema]   [🧘 Yoga]  [🚶 Walk]  →
```

### 2.3 Duration Selector

**Current:** Bottom sheet with pill buttons (30 min, 60 min, 90 min, 120 min, 180 min).

**What's good:** Simple, clear options. 60 min default is smart.

**Improvements:**
- Reduce to one row (remove 180 min — too long for Flash, keep for Planned)
- Add subtle time indicator: "Ends at ~21:36" below the pills
- Visual: selected pill should have more contrast (current blue is subtle)

### 2.4 Participant Count

**Current:** Bottom sheet with number buttons (3, 5, 8, 10, 15, 20).

**What's good:** Reasonable range, 5 as default.

**Improvements:**
- Replace with a slider (faster, more compact, fits inside single-sheet design)
- Or keep buttons but make them a single row: `[3] [5•] [8] [10] [15] [20]`
- Show what the number means: "5 people including you"

---

## 3. Activity Pins / Markers

### Current State

Pins show as purple rounded rectangles with text:
```
[lightning-bolt 0/5]
[volleyball 0/5]
```

### Problems

1. **Icon names as text** — should be actual icons (see Bug 1)
2. **No time information** — when does it start? How long left?
3. **All pins look identical** — same purple, same shape, no visual differentiation
4. **"0/5" is ambiguous** — does 0 mean nobody joined? Including the creator?
5. **No tap interaction visible** — what happens when you tap a pin?
6. **Pins overlap** — no clustering for dense areas

### Recommended Pin Design

```
     ╭──────────────╮
     │ ⚽  2/5  45m  │    ← icon + participants + time remaining
     ╰──────┬───────╯
            ▼             ← pointer to location

Color coding:
  🟢 Green  = starting soon (< 15 min)
  🔵 Blue   = active now
  🟡 Yellow = filling up (> 75% full)
  🟣 Purple = default (open, future)
  ⚫ Grey   = completed/expired

Size coding:
  Smaller pin = fewer spots left
  Larger pin  = more spots available
  Pulse animation = starting in < 5 min
```

**Tap interaction:**
```
Tap pin → Bottom sheet slides up:

┌─────────────────────────────────┐
│ ⚽ Futebol          Starting now│
│ 📍 Near SFMOMA      ⏱ 60 min   │
│ 👥 2/5 joined                   │
│                                 │
│ Created by André ⭐ (12 events) │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         Join ⚡              │ │  ← one-tap join
│ └─────────────────────────────┘ │
│ Share  •  Report                │
└─────────────────────────────────┘
```

---

## 4. Tab Bar

### Current Tabs

```
[🗺 Map] [🔔 Próximos (9+)] [♡ My Events] [🫲 Perfil]
```

### Issues

| Issue | Detail |
|-------|--------|
| Mixed languages | "Próximos" is Portuguese, rest is English |
| "Próximos" label | Means "nearby" but the bell icon + "9+" badge suggests notifications, not nearby events |
| "My Events" with heart icon | Heart usually means "favorites" or "liked", not "my events" |
| "Perfil" icon | The waving hand icon doesn't read as "profile" |
| Badge "9+" on Próximos | 9+ what? Nearby activities? Notifications? Unclear |

### Recommended Tab Bar

```
[🗺 Map] [📅 Upcoming] [⚡ Active] [👤 Profile]
```

| Tab | Icon | Purpose | Badge |
|-----|------|---------|-------|
| **Map** | Map/layers icon (current) | Flash activities on live map | Count of nearby activities |
| **Upcoming** | Calendar icon | Planned activities feed (list) | Count of upcoming confirmed |
| **Active** | Lightning bolt (only visible when in an activity) | Current activity + chat | Pulsing dot when active |
| **Profile** | Person silhouette | Profile, badges, trophies, settings | None |

**Key change:** The "Active" tab only appears when the user has joined an activity. Otherwise it's 3 tabs. This prevents an empty tab and creates a sense of "something is happening."

**Language:** Pick ONE language for the entire UI and use i18n for all labels. Don't mix English and Portuguese in the same screen.

---

## 5. Missing Screens & Features

### 5.1 Activity Detail View (when tapping a pin)

Currently missing or not shown. This is critical — users need to see details before joining.

**Required fields:**
- Activity type icon + name
- Creator info (name, avatar, activity count)
- Location name + distance from user
- Start time (or "Starting now" / "In 23 min")
- Duration
- Participant count + slots remaining
- Join button (one tap)
- Share + Report actions

### 5.2 Onboarding

Not shown in screenshots. For v1:
- Screen 1: "See what's happening near you" (map visual)
- Screen 2: "Join in one tap" (join animation)
- Screen 3: "Create your own" (creation visual)
- Then: phone verification → name + avatar selection → done
- **Target: < 60 seconds total**

### 5.3 Post-Activity Feedback

After an activity ends, a mandatory quick feedback:
```
┌─────────────────────────────────┐
│ How was it?                     │
│                                 │
│  😕   🙂   😊   🤩              │
│                                 │
│ Would you do this again?        │
│ [Yes]  [Maybe]  [No]           │
│                                 │
│           [Done]                │
└─────────────────────────────────┘
```

### 5.4 Join Confirmation + Live Activity View

When a user joins an activity, they need:
- Haptic feedback + animation on join
- The "Active" tab appears in the tab bar
- Live activity screen with: map showing other participants, chat, countdown timer, "Leave" option

### 5.5 Push Notification Triggers

| Trigger | Message | Timing |
|---------|---------|--------|
| New activity nearby | "⚽ Futebol starting near you — 3 spots left" | Real-time |
| Activity starting soon | "Your volleyball starts in 15 min at Dolores Park" | 15 min before |
| Activity full | "The coffee meetup filled up! Catch the next one" | On full |
| Someone joined yours | "André joined your corrida! 3/5 now" | On join |
| Post-activity feedback | "How was the basketball? Quick feedback" | 30 min after end |

---

## 6. Complete Revised Flow

### User Journey: Create a Flash Activity

```
Open app
  → Map loads with current location centered
  → See nearby activity pins (if any)
  → Tap (+) FAB
    → Bottom sheet rises (half screen)
    → Pick activity type from icon grid (1 tap)
    → Location auto-filled (current GPS)
    → Time defaults to "Now"
    → Participants default to 5
    → Tap "Create Flash ⚡" (1 tap)
  → Pin appears on map immediately
  → Push notification sent to nearby users
  → Wait for people to join
  → Activity starts → Active tab appears
  → Chat available → meet in person
  → Activity timer ends
  → Feedback prompt appears
  → Done

Total creation taps: 3 (FAB → type → create)
Total creation time: ~5 seconds
```

### User Journey: Join a Flash Activity

```
Open app (or receive push notification)
  → See activity pin on map
  → Tap pin
    → Bottom sheet shows activity details
    → Tap "Join ⚡" (1 tap)
  → Haptic feedback + join animation
  → Active tab appears with live view
  → Chat opens → coordinate arrival
  → Meet in person
  → Activity ends → feedback prompt
  → Done

Total join taps: 2 (pin → join)
Total join time: ~3 seconds
```

---

## 7. Design System Recommendations

### Color Palette

```
Primary:     #6C63FF  (purple — your current brand color, keep it)
Flash:       #FF6B6B  (warm red — urgency, "happening now")
Planned:     #4ECDC4  (teal — calm, "scheduled")
Success:     #2ECC71  (green — joined, confirmed)
Warning:     #F39C12  (amber — filling up, time running out)
Text:        #1A1A2E  (near-black)
Subtle:      #8E8E93  (grey for secondary text)
Background:  #FFFFFF
Card:        #F8F8FA
```

### Typography (stick with system fonts for performance)

```
Title:       SF Pro Display Bold, 24pt
Heading:     SF Pro Display Semibold, 18pt
Body:        SF Pro Text Regular, 16pt
Caption:     SF Pro Text Regular, 13pt
Pin label:   SF Pro Text Medium, 12pt
```

### Interaction Patterns

| Action | Feedback |
|--------|----------|
| Join activity | Haptic (medium) + pin pulse animation + success toast |
| Create activity | Haptic (heavy) + confetti/spark animation + pin appears |
| Leave activity | Haptic (light) + pin shrink animation |
| Earn badge | Haptic (heavy) + modal with badge animation |
| Receive nudge | Haptic (light) + subtle banner |

### Animation Guidelines

- Bottom sheets: spring animation (damping: 0.8, stiffness: 300)
- Pin appearances: scale from 0 → 1 with overshoot
- Join/leave: particle effect on the pin
- Timer running out: pin pulse speed increases
- All animations via `react-native-reanimated` (already in Ignite stack)

---

## 8. Priority Implementation Order

### 🔴 P0 — Fix Before Anything Else (Week 1)

1. **Fix icon rendering** — icons must show as actual icons, not text names
2. **Fix activity type grid duplication** — each type should appear once
3. **Fix language consistency** — pick PT-BR or EN, use i18n everywhere

### 🟠 P1 — Core UX Improvements (Weeks 2-3)

4. **Collapse creation flow into single bottom sheet** — the biggest UX win
5. **Add activity detail bottom sheet** (tap pin → see details → join)
6. **Fix map pin design** — add actual icons, time indicator, color coding
7. **Auto-fill location** from GPS in creation flow
8. **Fix tab bar** — consistent icons, labels, and language

### 🟡 P2 — Polish & Engagement (Weeks 4-5)

9. **Add empty state** for map when no activities nearby
10. **Add haptic feedback** on join/create actions
11. **Add join animation** (pin pulse + success state)
12. **Add push notifications** for nearby activities
13. **Add post-activity feedback** screen
14. **Add radius circle overlay** on map

### 🟢 P3 — Planned Activities Mode (Weeks 6-8)

15. **Add date/time picker** to creation sheet for Planned mode
16. **Build Upcoming tab** with list of planned activities
17. **Add confirmation flow** (confirm 1hr before)
18. **Add pre-event chat** (opens 2hr before)
19. **Add auto-cancel logic** (< 3 confirmed = cancelled)

### 🔵 P4 — Profile & Trust (Weeks 9-10)

20. **Build profile screen** (avatar, stats, badges)
21. **Implement trust scoring** (invisible, backend)
22. **Add badges** (appears, good organizer, active now)
23. **Add trophies** (milestones)

---

## Quick Reference: Current vs Target

| Metric | Current | Target |
|--------|---------|--------|
| Taps to create activity | 5-6 | 3 |
| Time to create activity | ~25 sec | < 10 sec |
| Taps to join activity | Unknown (no detail view) | 2 |
| Time to join activity | Unknown | < 5 sec |
| Pin information | Icon name + count | Icon + count + time + color |
| Languages in UI | Mixed EN/PT | Single (i18n) |
| Icon rendering | ❌ Text names | ✅ Actual icons |
| Activity type grid | ❌ 3x duplicated | ✅ Single grid |
| Empty state | ❌ None | ✅ Guidance card |
| Post-activity feedback | ❌ None | ✅ Quick emoji survey |
| Haptic feedback | ❌ None | ✅ On all key actions |

---

*End of UX/UI Audit*