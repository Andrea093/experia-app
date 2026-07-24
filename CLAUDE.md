# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Experia by CEINFES — Codebase Guide

> **Experia** is a web platform for teacher training in Experience-Centered Design (DCE). Teachers progress through interactive lessons, challenges, and final deliverables, supervised by instructors.

**Production:** https://experia-app.pages.dev  
**Version:** v15 (June 2026) — multi-course + 4 immersive themes + **Modo Aula en Vivo** (quiz sincrónico tipo Kahoot)

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
| `course_enrollments` | Student ↔ course matrícula (drives course switcher + `enrolledCourseId`) |
| `user_courses` | Per-user course access grant (strict gate, migration 0018) |
| `institution_courses` | Course enabled per institution |
| `live_sessions` | Live quiz session state (phase, current question, **snapshot SIN respuestas**) — migration 0022 |
| `live_session_keys` | Respuestas correctas + explicación de la sesión (SOLO el host las lee) |
| `live_participants` | Quien se unió por PIN (nombre, apellido, correo, salón) + puntaje/racha |
| `live_answers` | Respuestas enviadas (1 por participante/pregunta) |
| `presence_gates` | Código presencial vigente por módulo (`course_modules.requires_presence_code`) — SOLO el host lo lee |
| `presence_unlocks` | Qué estudiante desbloqueó qué módulo con el código presencial (permanente) — migration 0039 |

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

**Course access — THREE tables that must stay in sync** (migration 0018):
A student seeing/entering a course depends on three separate tables. Mismatches between them are a recurring source of "el curso no aparece" bugs:
- `user_courses` (**strict gate**) — drives *"Elige tu curso"* (`CourseSelection.jsx`). A course only shows if there's a row here with `is_active=true` for that user. Managed from AdminUsers.
- `course_enrollments` (**matrícula**) — drives the multi-course switcher in `map.jsx` (`allEnrollments`) and `enrolledCourseId` (via `loadStudentSession`). Also gates `CourseSelection` vs `map` in `app.jsx`.
- `course_progress` — XP/completed/badges per enrollment.

⚠️ **Access and enrollment must go together.** The store keeps them synced per action: `enrollInCourse`, `setUserCourseAccess`/`Bulk`, and `autoEnrollInstitutionStudents` all upsert *both* `user_courses` **and** `course_enrollments` (+ empty `course_progress`, never resetting existing). `switchCourse` creates a missing enrollment on the fly. The map switcher shows the **union** of enrollments + active access (`switchableCourseIds`) so a lagging table self-heals. Granting access never resets progress; revoking access removes nothing.
- ⚠️ Creating a course (seed or AdminCourses) grants **no** access — assign it per institution (Admin → Cursos, runs `autoEnroll`) or per user (AdminUsers) afterwards, or it appears to nobody.

**Course expiry per institution** (migration 0030): `institution_courses.expires_at` (nullable, `null` = indefinido). Set from AdminCourses when enabling a course for an institution (or edited later by clicking the institution pill). On expiry the course is fully revoked for that institution — **not** the soft "leave existing access alone" behavior of a manual disable: `sync_my_institution_courses()` (called on every student login via `loadStudentSession`) deactivates the expired `institution_courses` row **and** flips `user_courses.is_active=false` for that student/course. Same caveat as the `is_active` gate above: a currently-logged-in student isn't kicked live, only blocked on their next session.

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

**Idle auto-logout** (`src/lib/idleTimeout.js`): logs out after **30 min of inactivity** (`IDLE_LIMIT_MS`). Tracks last activity (mouse/keyboard/scroll/touch/click) in `localStorage` (`experia:last-activity`). `App` starts `startIdleWatch(doLogout)` while logged in; `restoreSession` (`main.jsx`) checks `isSessionExpired()` and refuses to restore a stale session on browser reopen; `doLogout` clears the marker.

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
| `quiz` | Multiple-choice questions | `{ questions: [{question,questionAfter?,options,correct, image?,imageHeight?,imagePosition?,optionImages?,explanation?,explanationImage?,timeLimit?,points?,difficulty?}], passage? }` |
| `truefalse` | Mark statements true/false | `{ statements: [{id,text,answer:bool}] }` |
| `fillblank` | Fill blanks from a word bank | `{ blanks: [{id,before,answer,after}] }` |
| `designlab` | Open-ended final (rubric) | n/a (rubric in `content`) |

**Adding a challenge type** (e.g. `truefalse`) touches: `challenges.jsx` (render component + dispatcher map), `store.jsx` (`dbModToAppMod` forward + `publishRouteToCourse` ×2), `route-editor/constants.js` (`CHALLENGE_TYPES` + `CTYPE_EMOJI`), `route-editor/EditorContents.jsx` (author UI) + `ChallengeEditorModal.jsx` (register), `route-editor/RoutePreviewModal.jsx` (preview), `games.jsx` (icon/label).

**Lesson `content`** is an array of sections rendered by `lesson.jsx`. Supported `type`s: `intro`, `text`, `quote`, `steps`, `reveal`, `image`, `callout`, `concepts`, `compare`, `video`. There is **no** `heading` type. `steps`/`reveal`/`concepts` items use `t`/`d` keys; images use `url`.

**Quiz `passage` + per-question fields** (lectura crítica y similares): a `quiz` reto can carry an optional `challenge_data.passage` (texto/imágenes mostrados **encima** de las preguntas) and each question accepts optional fields:
- `passage`: `{ intro, title, paragraphs:[str], source, images:[{url,caption,width,height}], imagesLayout:'row'|'column' }`. Rendered by `QuizPassage` in `challenges.jsx` con `objectFit:contain` (no recorta); `width`/`height` aceptan número (px) o string CSS.
- Por pregunta: `image`+`imageHeight`+`imagePosition` (imagen del enunciado; `imagePosition ∈ before|between|after` — helper `QuestionImage` en `challenges.jsx`, default `before`). `before`=arriba de la pregunta, `after`=bajo las opciones, `between`=**en medio del texto del enunciado**: parte la pregunta en `question` (antes de la imagen) + `questionAfter` (después). `optionImages` (array alineado por índice con `options`: imagen por opción para preguntas visuales — helper `OptionContent`; una opción es válida con texto **o** imagen), `explanation`+`explanationImage` (se muestran tras responder y en el repaso), `timeLimit`/`points`/`difficulty` (metadatos que alimentan el **Modo Aula en Vivo**). El cuadro del enunciado en el editor es un `textarea` ampliable (preguntas largas con párrafos). ⚠️ El **Modo Aula en Vivo** (`LiveQuestionView.jsx` + snapshot SQL de `create_live_session`) aún NO renderiza `optionImages`/`imagePosition`/`questionAfter` (solo `image` arriba) — quedaría pendiente si se quiere allá.
- Se autoran en `route-editor/QuizCreatorModal.jsx` (sección "texto/imágenes de apoyo" + "⚙️ Opciones avanzadas" por pregunta, con reordenar/duplicar). El store reenvía `passage` y el array `questions` completo, así que campos nuevos por pregunta viajan solos.
- **Subida de imágenes in-app:** componente reutilizable `ImageUploader` (`ui.jsx`) → sube a Supabase Storage bucket `attachments` (carpeta `passage-images`) y devuelve la URL pública vía `onUploaded(url)`. El bucket `attachments` debe ser **público**.
- **Texto enriquecido ligero (enunciado + opciones):** el texto de pregunta/`questionAfter`/opciones respeta espacios y saltos de línea y soporta markup mínimo — `**negrilla**` y `{{#e8732c|color}}` (hex 3–8 díg.). Sin librerías: `parseRich`/`RichText` (render, `whiteSpace:pre-wrap`) y `RichInput` (editor con mini-barra B + colores que envuelve la selección) viven en `ui.jsx`. El markup se guarda como texto plano dentro de `challenge_data`, así que viaja solo y es retrocompatible. Aplicado en `QuizCreatorModal.jsx` (autoría) y `challenges.jsx` (`QuizChallenge`/`PollChallenge`, enunciado + opciones + repaso + mensaje de acierto/error). ⚠️ Igual que las imágenes por opción, el **Modo Aula en Vivo** aún NO interpreta el markup.

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

### 8. Modo Aula en Vivo (quiz sincrónico tipo Kahoot)

Capa **sincrónica** sobre los cursos existentes: el profesor lanza un quiz en vivo y la pantalla de cada estudiante queda **encadenada a su ritmo** (no puede adelantarse). Pensado para el aula. Backend en `0022_live_classroom.sql` (ejecutar manual en SQL Editor).

- **Ingreso del estudiante:** página **pública** `#/live` (sin login, ver routing abajo) → PIN + registro ligero (nombre, apellido, correo, salón) en `live_participants`. El profe lanza desde el sidebar instructor → "Aula en Vivo" (page `live-host`, también en switch admin).
- **Flujo por pregunta (lo dicta el profe):** `lobby → question → reveal → explanation → leaderboard → podium`. El estado vive en `live_sessions`; estudiantes y host se suscriben por realtime (`subscribeSession`/`subscribeParticipants` en `lib/liveClient.js`) + red de seguridad por poll cada 7s y en `visibilitychange`.
- **Anti-trampa:** la respuesta correcta NO está en lo que leen los estudiantes. `live_sessions.questions` es un snapshot **sin `correct`**; las respuestas/explicación viven en `live_session_keys` (solo el host la lee por RLS). Toda escritura de estudiante pasa por RPCs **SECURITY DEFINER**: `join_live_session`, `submit_live_answer` (calcula el puntaje **en el servidor**: `base*(1-0.5*tiempo/límite)`, racha). Control del profe: `create_live_session` (arma snapshot+keys), `live_set_phase`, `live_goto`, `live_end`. El "revelado" lo dispara el host (copia correct+explicación a `live_sessions.current_reveal`).
- **Routing público:** `PUBLIC_PAGES=['cert','live']` en `store.jsx` permite el deep link sin sesión (3 puntos gated del hash routing + un bootstrap inicial); `app.jsx` renderiza `live` **antes** del gate de login (igual que `cert`).
- **Pulido:** `lib/sound.js` (beeps; el acierto/error suena en `reveal`, no al enviar, para no adelantar el resultado), QR del PIN (api.qrserver.com), `Podium` animado + `Confetti`, botón de silencio (`experia:live-muted`).
- **Origen del contenido:** reúsa los retos `quiz` del curso (incluye `timeLimit`/`points`/`difficulty`/`explanation` por pregunta, §5). El host snapshotea las `questions` del módulo elegido.

### 9. Código presencial (bloquear un paso hasta activarlo en clase)

Candado **opcional por nodo** (aplica a cualquier `course_modules.type`, no es un `challenge_type` nuevo): marca `requires_presence_code = true` y el estudiante no puede ver el contenido de ese módulo/reto hasta ingresar un código corto que el instructor genera y dice en voz alta en clase. Pensado para asegurar que esa parte puntual de la ruta se resuelva estando físicamente presente. Backend en `0039_presence_gate.sql` + `0040_gate_module_content_server_side.sql` (ejecutar ambas, en orden, manual en SQL Editor).

- **Marcar el nodo:** en el editor de ruta (`InstructorRouteEditor.jsx`), cada fila de módulo tiene un botón-candado que alterna `requiresPresenceCode`; con el candado activo y el módulo ya publicado aparece un botón "🔑 Código" que abre un modal para generarlo.
- **Generar el código (profe, en clase):** `generatePresenceCode(moduleId)` → RPC `generate_presence_code`, solo instructor/admin. Desactiva el código anterior de ese módulo e inserta uno nuevo de 6 dígitos en `presence_gates` — **sin vencimiento** (0042; antes expiraba a 3h, `expires_at` ahora es NULL). Mismo patrón anti-trampa que Modo Aula en Vivo (§8): el código en texto plano solo se devuelve al host, `presence_gates` no tiene policy de select pública.
- **Canjearlo (estudiante):** el gate (`PresenceGate` en `ui.jsx`, insertado al inicio de `LessonView`/`ChallengeView`) llama `redeemPresenceCode(moduleId, code)` → RPC `redeem_presence_code` (SECURITY DEFINER), que valida el código en el servidor y, si coincide, hace upsert idempotente en `presence_unlocks`. Una vez desbloqueado queda desbloqueado (se carga en `unlockedPresenceModules` vía `loadStudentSession`, igual que `completed`/`badges`).
- **La entrega final (Grid / cargar documentos) también respeta el código:** `Grid.jsx` inserta el mismo `PresenceGate` sobre el módulo `final_delivery` cuando este tiene `requiresPresenceCode` (antes solo se gateaba por el taller `requires_workshop`). Si la entrega usa código, el código **reemplaza** la lógica del taller (`workshopEnabled = finalUsesCode || …`). También aplica el bloqueo por gate anterior (`isBlockedByPresence`).
- **`final_delivery` es un paso más de la cadena (jul 2026):** antes `nodeStatus` exigía **TODOS** los módulos completos para la entrega (`others.every(done)`) y la cadena secuencial **saltaba** el final_delivery (usaba `others`), así que un módulo después de la entrega no la exigía. Ahora `nodeStatus` usa una única cadena sobre la lista COMPLETA: cada módulo pide sus `req` explícitos o, por defecto, el **módulo anterior en el orden** (incluida la entrega) — así **la entrega bloquea el módulo siguiente** como cualquier paso. `Grid.jsx` calcula `routeComplete` (habilitar el cargue) solo sobre los módulos **antes** de la entrega (`modsBeforeFinal`).
- **La entrega se completa al APROBARLA (no al enviarla), y NO genera certificado (jul 2026):** enviar la entrega NO la marca completa — el módulo siguiente queda bloqueado hasta que el instructor **apruebe** la entrega. La finalización se hace en la sesión del ESTUDIANTE: un `useEffect` en `map.jsx` detecta una submission con `status==='approved'` del propio usuario y llama `completeNode(finalMod.id)` (completeNode escribe en el `course_progress` del estudiante; el instructor no puede escribirlo). Idempotente. ⚠️ Sin realtime en submissions: el estudiante ve el desbloqueo tras recargar. El diploma **ya no se emite en el Grid**: el bloque `status==='approved'` solo muestra confirmación (antes `CertificatePage` → `issueCertificate`). El certificado lo emite **solo** el nodo `certificate` → `CourseCertificatePage` al 100% (`maybeIssueCourseCertificate`). `CertificatePage` en Grid.jsx quedó como código muerto.
- **Bloquea "de ahí en adelante" (no solo el nodo puntual):** `nodeStatus` (store.jsx) recibe `unlockedPresenceModules` y usa el helper `isBlockedByPresence` — si algún módulo ANTERIOR en el orden exige código y el estudiante no lo desbloqueó (ni completó, que implica haberlo desbloqueado), TODOS los nodos posteriores quedan `locked` en el mapa. El módulo gateado NO se bloquea a sí mismo (debe abrirse para ingresar el código). Cierra el hueco de cuando los módulos no forman cadena estricta de requisitos (p. ej. todos dependen solo del primero) y el gateado se saltaba. Callers de `nodeStatus` que pasan el nuevo arg: `map.jsx` (×2) y `games.jsx`. Además, `LessonView`/`ChallengeView` llaman `isBlockedByPresence` para cerrar el acceso por **enlace directo** a un nodo posterior (muestran "Paso bloqueado → Volver al mapa"). Solo frontend, sin migración.
- **El contenido en sí también se oculta en el servidor (0040), no solo en la UI:** los tres puntos donde el estudiante carga `course_modules` (`loadStudentSession.js`, `switchCourse`, `loadCourseModules`) usan la RPC `get_course_modules_for_student` en vez de `select('*')` plano — esa RPC vacía `content`/`challenge_data` de cualquier módulo gateado que el usuario no tenga en `presence_unlocks`, así que el candado no se puede saltar leyendo la respuesta de red en DevTools. `redeemPresenceCode` vuelve a llamar la RPC tras un canje exitoso para traer el contenido real. El editor de instructor sigue leyendo `course_modules` directo (necesita el contenido completo siempre).

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
│   ├── idleTimeout.js       # Idle auto-logout (30 min)
│   ├── theme.js             # Dark/light + accents
│   ├── liveClient.js        # Modo Aula en Vivo: RPCs + suscripciones realtime
│   └── sound.js             # Beeps Web Audio (sin archivos) + mute para el modo en vivo
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
    ├── LivePlay.jsx            # Modo Aula en Vivo — estudiante (página PÚBLICA #/live, sin login)
    ├── LiveHost.jsx            # Modo Aula en Vivo — profesor (page 'live-host': lanzador + panel)
    ├── AdminUsers.jsx, AdminCourses.jsx, etc.
    └── InstructorStudentView.jsx, forum.jsx, etc.

supabase/
├── migrations/          # Database schema (run manually in Supabase SQL Editor)
│   ├── 0001_init.sql
│   ├── 0007_multi_course.sql
│   ├── 0011_course_modules_area.sql   # adds area_id + allows type 'final_delivery'
│   ├── 0012_course_theme.sql          # adds courses.theme + character_line
│   ├── 0013–0016_seed_*.sql           # themed course seeds (detective/escape/lab/time-travel)
│   ├── 0017_active_users_institutions.sql  # is_active gate
│   ├── 0018_user_course_access.sql    # user_courses (strict per-user access)
│   ├── 0019_admin_manage_course_progress.sql
│   ├── 0020_seed_ecosistema_ia_course.sql  # 8-module video MOOC, sequential unlock
│   ├── 0021_seed_lectura_critica_llanto.sql # seed quiz con passage (texto+imágenes) — reemplazar URLs PLACEHOLDER
│   ├── 0022_live_classroom.sql             # Modo Aula en Vivo: tablas live_* + RLS + RPCs (scoring server-side)
│   ├── 0039_presence_gate.sql              # Código presencial: presence_gates/presence_unlocks + RPCs
│   ├── 0040_gate_module_content_server_side.sql # RPC get_course_modules_for_student: oculta content/challenge_data en el servidor
│   ├── 0041_cross_institution_fork_clone.sql # RLS: instructor multi-colegio puede leer forks de sus otros colegios para clonarlos
│   ├── 0042_presence_code_no_expiry.sql # Código presencial sin vencimiento (expires_at NULL)
│   └── 0043_certificate_hours.sql # Intensidad horaria del certificado (courses.certificate_hours + certificates.hours)
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
3. **Realtime:** `route_configs` + `live_sessions`/`live_participants` (Modo Aula en Vivo) subscribed; other tables need refresh
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

