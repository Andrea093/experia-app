# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Experia by CEINFES — Codebase Guide

> **Experia** is a web platform for teacher training in Experience-Centered Design (DCE). Teachers progress through interactive lessons, challenges, and final deliverables, supervised by instructors.

**Production:** https://experia-app.pages.dev  
**Version:** v14 (June 2026) — multi-course + 4 immersive course themes live

---

## Quick Start

```bash
npm install
cp .env.example .env          # Add VITE_SUPABASE_* vars
npm run dev                    # http://localhost:5173
npm run build                  # Production build
git push                       # Auto-deploys to Cloudflare
```

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Production build → dist/ |
| `npm run preview` | Preview locally |

---

## Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.3.1 |
| Build | Vite | 5.4.10 |
| Hosting | Cloudflare Pages | — |
| Backend | Supabase (PostgreSQL) | Pro |
| Auth | Supabase Auth (JWT) | — |
| Data imports | XLSX | 0.18.5 |

**Not used:** TypeScript, CSS frameworks (Tailwind), Redux, react-router, testing frameworks

---

## Architecture

**Frontend (React SPA):**
- Hash-based routing (`#/page/nodeId`)
- Custom reactive store (XS) — no Redux/Zustand
- Inline styles + CSS variables (dark mode + accent colors)
- Lazy-loaded pages per role (student/instructor/admin)

**Backend (Supabase):**
- PostgreSQL database with RLS (Row Level Security)
- JWT auth via Supabase Auth
- Realtime subscriptions to route_configs
- Edge Functions (Deno) for admin tasks

**Hosting (Cloudflare Pages):**
- Static SPA hosting
- Auto-deploys on git push
- Global CDN

---

## State Management (`src/store/store.jsx`)

**Custom store (80 lines)** — lightweight, reactive:

```javascript
const XS = createExpStore({
  isLoggedIn, user, page, nodeId,
  xp, completed, badges, notifications,
  selectedArea, accounts, submissions,
  routeConfigs, courses, courseModules
});

const useStore = (sel) => { /* React hook */ };
```

**Key actions:**
- `useStore(sel)` — Subscribe to state
- `nav(page, nodeId)` — Navigate
- `completeNode(id)` — Complete module, award XP
- `selectArea(areaId)` — Choose area
- `doLogout()` — Sign out

**Educational data (in code):**
- `AREAS` — 5 learning areas (lectura, ciudadanas, ingles, matematicas, ciencias)
- `SHARED_MODULES` — Common modules (Intro, Empathy) for all students
- `AREA_CONTENT` — Area-specific modules 3 & 4, match pairs, simulations
- `BADGES` — 9 achievement types
- `LEVELS` — XP progression (0 → 3500+)

---

## Routing (Hash-Based)

**No react-router.** Pure hash routing with manual state sync:

- URL pattern: `#/page/nodeId` (e.g., `#/lesson/mod1`)
- Synced via `hashchange` event listener
- Deep links work; browser back/forward work
- Pages lazy-loaded per role

**Main pages:**
- `landing` — Signup/login
- `login` — Auth form
- `map` — Learning map (students)
- `lesson` — Content viewer
- `challenge` — Interactive retos
- `grid` — Final deliverables
- `profile` — User settings
- `admin-*` — Admin pages (users, courses, schools, analytics, cohorts)
- `instructor-*` — Instructor pages (dashboard, stats, route editor)

---

## Components (`src/components/`)

**Main components:**
- `Sidebar` — Role-based navigation
- `Header` — User info, theme toggle, notifications
- `ui.jsx` — Reusable library:
  - Btn (7 variants), Modal, ProgressRing/Bar
  - 19 SVG icons
  - NotifManager (toasts), Charts

**Design system:**
- CSS variables: colors, spacing, shadows, fonts (DM Sans)
- Dark mode: `[data-theme="dark"]`
- Accent options: `[data-accent="azul"|"esmeralda"]`
- Animations, gradients, glassmorphism

---

## Database (Supabase)

**Core tables:**

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (extends auth.users) |
| `institutions` | Schools |
| `cohorts` | Teacher cohorts |
| `progress` | XP tracking (legacy) |
| `course_progress` | XP per course enrollment |
| `submissions` | Final deliverables |
| `challenge_attempts` | Challenge answers |
| `messages` | Instructor feedback |
| `route_configs` | Custom learning routes |
| `courses` | Course definitions |
| `course_modules` | Modules per course |

**Security:**
- RLS (Row Level Security) per role
- Helper functions: `is_admin()`, `is_instructor()`
- Students: read/write own data only
- Instructors: read students in institution
- Admins: full access

**Active/inactive access control** (migration 0017):
- `profiles.is_active` and `institutions.is_active` (both default `true`).
- A non-admin is blocked if their profile **or** their institution is inactive. Admins are never blocked.
- Enforced frontend-side via `getAccessBlockReason()` at login (`login.jsx`, shows message) and session restore (`main.jsx`, silent sign-out). Toggled from AdminUsers / AdminSchools. ⚠️ Currently logged-in users are blocked on next session, not kicked live.

**Realtime:**
- Subscribed to `route_configs` changes

---

## Session & Data Flow

**On app launch** (`src/main.jsx`):
1. Restore Supabase auth session
2. Load profiles, institutions, cohorts
3. Load role-specific data (submissions, etc.)
4. Load course_modules if courses enabled
5. Determine landing page (area/course selection guards)
6. Subscribe to route_configs realtime
7. Support deep links via hash
8. Render App with XS store hydrated
9. Timeout: 20 seconds max

---

## Key Patterns

### 1. Component Memoization

```javascript
const Sidebar = React.memo(({ mobileOpen }) => {
  const page = useStore(s => s.page);  // Re-render only if page changes
  // ...
});
```

Narrow selectors prevent unnecessary re-renders.

### 2. Responsive Design

```javascript
const isMobile = useMobile(768);  // Custom hook
```

Sidebar + header on desktop; mobile overlay on phone.

### 3. Inline Styles (No CSS Classes)

All styling via inline objects + CSS variables:
- Style isolation (no class conflicts)
- Theme switching via data attributes
- Dynamic colors at runtime

### 4. Module Completion

```
User completes challenge
  ↓
completeNode(id) → XS updates xp, completed[], badges[]
  ↓
Write to Supabase (progress or course_progress)
  ↓
Show XP popup + badge toast
  ↓
Next module unlocks (dependencies checked)
```

### 5. Challenge Types

`challenge_type` value (exact string, **no hyphens**) → component in `challenges.jsx`. Unknown values fall back to `designlab`.

| `challenge_type` | Mechanic | `challenge_data` shape |
|------------------|----------|------------------------|
| `dragdrop` | Reorder phrases | `{ dragItems: ["str", ...] }` (array of strings in correct order) |
| `empathy` | Sort cards into 4 quadrants | `{ empathyCards: [{id,text,correct}] }`, `correct ∈ piensa\|siente\|dice\|hace` |
| `simulation` | Multi-step decision tree | ⚠️ ignored — always renders the built-in generic `SIM_TREE` (store doesn't forward sim data) |
| `matching` | Connect concepts ↔ definitions | `{ matchPairs: [{id,concept,def}] }` |
| `quiz` | Multiple-choice questions | `{ questions: [{question,options,correct}] }` |
| `truefalse` | Mark statements true/false | `{ statements: [{id,text,answer:bool}] }` |
| `designlab` | Open-ended final (rubric) | n/a (rubric in `content`) |

**Adding a challenge type** (e.g. `truefalse`) touches: `challenges.jsx` (render component + dispatcher map), `store.jsx` (`dbModToAppMod` forward + `publishRouteToCourse` ×2), `route-editor/constants.js` (`CHALLENGE_TYPES` + `CTYPE_EMOJI`), `route-editor/EditorContents.jsx` (author UI) + `ChallengeEditorModal.jsx` (register), `route-editor/RoutePreviewModal.jsx` (preview), `games.jsx` (icon/label).

**Lesson `content`** is an array of sections rendered by `lesson.jsx`. Supported `type`s: `intro`, `text`, `quote`, `steps`, `reveal`, `image`, `callout`, `concepts`, `compare`, `video`. There is **no** `heading` type. `steps`/`reveal`/`concepts` items use `t`/`d` keys; images use `url`.

### 6. Content as Code (No CMS)

All lesson text, images, match pairs, simulations live in `store.jsx`. Change content → commit + push → auto-deploy. Version control built-in.

### 7. Immersive Course Themes

A course can have an immersive visual theme via the `courses.theme` column. Active themes:

| `theme` | Course | Character |
|---------|--------|-----------|
| `detective` | Lenguaje | Vera Clío |
| `escape-room` | Matemáticas | — |
| `lab` | Ciencias Naturales | — |
| `time-travel` | Ciencias Sociales | Prof. Kronos |

- **Activation:** `getActiveCourseTheme()` reads `theme` of the enrolled course. `<CourseAmbient>` (in `app.jsx`) subscribes **once** to the active theme and lazy-loads the matching `*Ambient.jsx` overlay (each is a separate chunk — only downloaded when its course is active). Themed end-of-module celebration in `ThemeCelebration.jsx`.
- **Adding a theme:** add the `theme` value to `AdminCourses.jsx` (`THEME_HINTS` + `<option>`), build a `*Ambient.jsx`, register it in `CourseAmbient.jsx`, add a branch in `ThemeCelebration.jsx`, and a character entry in `src/lib/characters.jsx`.
- **Characters (reactive):** `src/lib/characters.jsx` is the single registry (theme → character: avatar, `ui` palette, `lines` per context). `CharacterFloat` (lazy-loaded via `CourseAmbient`) renders the active theme's character and reacts to events fired with `reactCharacter(context)` — contexts: `idle`, `lessonIntro`, `correct`, `wrong`, `moduleComplete`, `routeComplete`. Triggered from `lesson.jsx` (intro/complete) and `recordAttempt` in `store.jsx` (correct/wrong by score). Missing lines fall back to `idle`; missing character = nothing renders.
- **Seeds:** course content lives in `supabase/migrations/0013`–`0016`. These are **run manually** in the Supabase SQL Editor (git push deploys only the frontend; migrations are never automatic). Canonical correct template: `0013`. They must match the real `course_modules` schema (id uuid auto, `"order"`, `is_enabled`, `area_id`, `challenge_type`, `challenge_data`) and the content shapes in §5.

---

## File Structure

```
src/
├── main.jsx                 # Bootstrap, session restore
├── app.jsx                  # Shell: sidebar, header, routing
├── styles.css               # Design system
├── store/store.jsx          # Reactive store + modules
├── lib/
│   ├── supabaseClient.js    # Supabase init
│   ├── loadStudentSession.js # Load XP, badges
│   └── theme.js             # Dark/light + accents
├── components/
│   ├── ui.jsx               # Reusable components
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── Onboarding.jsx
│   ├── CourseAmbient.jsx    # Gate: lazy-loads the active course's theme overlay
│   ├── DetectiveAmbient.jsx, EscapeRoomAmbient.jsx, LabAmbient.jsx, TimeTravelAmbient.jsx
│   ├── ThemeCelebration.jsx, CharacterBubble.jsx  # Themed celebration + companion
│   └── ErrorBoundary.jsx
└── pages/
    ├── landing.jsx, login.jsx
    ├── map.jsx, lesson.jsx, challenges.jsx
    ├── Grid.jsx, profile.jsx
    ├── AdminUsers.jsx, AdminCourses.jsx, etc.
    └── InstructorStudentView.jsx, forum.jsx, etc.

supabase/
├── migrations/          # Database schema (run manually in Supabase SQL Editor)
│   ├── 0001_init.sql
│   ├── 0007_multi_course.sql
│   ├── 0011_course_modules_area.sql   # adds area_id + allows type 'final_delivery'
│   ├── 0012_course_theme.sql          # adds courses.theme + character_line
│   └── 0013–0016_seed_*.sql           # themed course seeds (detective/escape/lab/time-travel)
└── functions/           # Edge Functions
    ├── bulk-create-users/
    └── send-reminders/
```

---

## Student Learning Path

```
1. Landing / Login
2. Onboarding (optional)
3. Area Selection (or Course Selection)
4. Learning Map - Interactive node graph
   ├── Module 1: Intro to DCE (shared)
   ├── Challenge 1: Drag-drop phases
   ├── Module 2: Empathy (shared)
   ├── Challenge 2: Empathy map
   ├── Module 3: Area-specific lesson
   ├── Challenge 3: Simulation
   ├── Module 4: Area-specific evaluation
   ├── Challenge 4: Matching concepts
   └── Final: Design Lab (5-question rubric)
5. Grid - Upload 2 Word documents
6. Instructor review & grading
7. Approved - Certificate + master badge
```

**Duration:** 20-30 hours per area  
**XP:** 100-300 per module; 9 levels (0 → 3500+)

---

## Customization

### Add New Learning Area

1. Edit `src/store/store.jsx`
2. Add to `AREAS`: `{ id: 'newarea', name: '...', icon: '...', color: '#...' }`
3. Add to `AREA_CONTENT[newarea]`: `m3: {...}, m4: {...}, simContext: '...', matchPairs: [...]`
4. Modules auto-generate; commit + push

### Change Lesson Content

1. Open `src/store/store.jsx`
2. Find module in `SHARED_MODULES` or `AREA_CONTENT[area].m3`
3. Edit `content: [...]` array
4. Commit + push

### Add Challenge Type

1. Define in `store.jsx` (e.g., `ctype: 'quiz'`)
2. Render in `src/pages/challenges.jsx`
3. Call `recordAttempt()`
4. Commit + push

---

## Environment & Deployment

**Frontend (`.env`):**
```
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Deployment:**
1. `git push` to main
2. Cloudflare Pages auto-builds (`npm run build`)
3. Publishes to CDN (~2 minutes)

**Local:** `npm run dev` (http://localhost:5173)

---

## Performance

- **Code splitting:** Pages lazy-loaded per role
- **Chunk vendors:** React, Supabase, XLSX in separate chunks
- **Memoization:** React.memo on large components
- **Narrow selectors:** useStore picks only needed state
- **CSS variables:** No runtime recalculation
- **Debounced resize:** Mobile detection (80ms debounce)

---

## Testing

**No test framework.** Manual testing:
- Dev: `npm run dev` + DevTools
- Dark mode: Click moon icon in header
- Supabase: Check SQL Editor + API usage
- Network: Verify RLS (403 = permission denied)
- Load: `node scripts/stress-test.js 50`

---

## Known Issues

1. **Hash routing:** URLs use `#/page/nodeId` (not pathname)
2. **RLS policies:** Check Supabase if students can't read data
3. **Realtime:** Only route_configs subscribed; others need refresh
4. **XP migrations:** Still migrating to course_progress table
5. **Content changes:** Require `git push` (no hot reload)

---

## Resources

- **README.md** — Setup, content editing, load testing
- **Experia-Technical-Reference.md** — DB schema, API
- **Experia-Runbook-Despliegue-v12.md** — Deployment
- **Supabase:** https://supabase.com/docs
- **React:** https://react.dev
- **Vite:** https://vitejs.dev

---

## Maintenance

- **Author:** Sergio Bahamon (sergiobaha05@gmail.com)
- **Version:** v14 (stable, multi-course)
- **Roadmap:** course_progress migration, Sentry, advanced analytics

