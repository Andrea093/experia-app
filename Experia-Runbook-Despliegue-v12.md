# Experia by CEINFES — Runbook de Despliegue (v14)

> Ajustado a la versión actual del proyecto: **3 roles (student / instructor / admin)**,
> **instituciones (colegios)**, **carga masiva de usuarios por Excel**,
> **historial de versiones en entregas**, **cohortes vinculadas a instituciones**,
> **presencia en tiempo real**, **analítica admin**, **recordatorios automáticos por email**,
> **eliminación de usuarios vía Edge Function**.
>
> Stack objetivo: **Vite + Cloudflare Pages + Supabase (Postgres + Auth + RLS + Realtime + Edge Functions)**

---

## 1. Diagnóstico actualizado

| Aspecto | Estado actual | Cambio vs v13 |
|---|---|---|
| Build | **Vite + React 18** en Cloudflare Pages | Sin cambio |
| Roles | **3: `student`, `instructor`, `admin`** | Sin cambio |
| Auth | Supabase Auth (JWT) | Sin cambio |
| Entidades principales | profiles, institutions, cohorts, submissions, progress, challenge_attempts, messages | Sin cambio |
| Cohortes | Tabla `cohorts` con FK a `institutions` | Sin cambio |
| Presencia | `profiles.last_seen` + Realtime subscriptions | Sin cambio |
| Analítica admin | Panel `AdminAnalytics` con métricas de progreso | Sin cambio |
| Recordatorios email | Edge Function `send-reminders` (Resend API) | Sin cambio |
| Carga masiva | Edge Function `bulk-create-users` | Sin cambio |
| **Eliminación de usuarios** | Edge Function `delete-user` | **Nuevo en v14** |
| **Cohortes sin campo área** | `cohorts.area` eliminado — sólo `institution_id` | **Nuevo en v14** |
| Estado/datos | Supabase Postgres + RLS | Sin cambio |

**Estado de migración actual:** el proyecto está **en producción** en `https://experia-app.pages.dev`. Las fases 1–6 están completas. Este runbook documenta el estado real del código.

---

## 2. Arquitectura actual

```
   Navegador (estudiante / instructor / admin)
            │  HTTPS
            ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Cloudflare Pages  https://experia-app.pages.dev             │
   │  Deploy automático con git push a main                        │
   └──────────────────────────────────────────────────────────────┘
            │  REST + Realtime + Edge Functions
            ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Supabase Pro  (ref: ttgycluzeyuxsmgcijgi)                    │
   │  ┌────────┐ ┌───────────────────┐ ┌──────────────────────┐   │
   │  │ Auth   │ │ Postgres + RLS    │ │ Edge Functions:      │   │
   │  │ JWT    │ │ profiles          │ │  bulk-create-users   │   │
   │  │        │ │ institutions      │ │  send-reminders      │   │
   │  │        │ │ cohorts ──────────┤ │  (Resend API)        │   │
   │  │        │ │   └─ institution_id│ └──────────────────────┘   │
   │  │        │ │ submissions       │                             │
   │  │        │ │ progress          │ ┌──────────────────────┐   │
   │  │        │ │ challenge_attempts│ │ Realtime             │   │
   │  │        │ │ messages          │ │ profiles.last_seen   │   │
   │  └────────┘ └───────────────────┘ └──────────────────────┘   │
   └──────────────────────────────────────────────────────────────┘
```

**Costo: ~$25/mes Supabase Pro + $0 Cloudflare.**

---

## 3. Paso a paso: local → producción

### FASE 0 — Prerrequisitos

Igual que el plan anterior + **una herramienta más**:
- Node.js LTS (v20+), Git, cuentas en GitHub / Supabase / Cloudflare, VS Code.
- **Supabase CLI** (para desplegar la Edge Function):
  ```bash
  # 📁 cualquier carpeta
  npm install -g supabase
  supabase --version
  ```

---

### FASE 1 — Migrar a Vite

**1.1 Crear proyecto**
```bash
# 📁 carpeta padre (ej. Documentos)
npm create vite@latest experia-app -- --template react
cd experia-app
npm install
npm install @supabase/supabase-js xlsx
```
> **xlsx ahora se instala como dependencia**, no se carga por CDN. Reemplaza `<script src=".../xlsx.full.min.js">` por `import * as XLSX from 'xlsx'`.

**1.2 Estructura de carpetas actual**
```
experia-app/
├─ public/
│  ├─ _redirects                  # SPA routing
│  ├─ _headers                    # seguridad
│  └─ uploads/
├─ src/
│  ├─ components/                 # ui.jsx → componentes reutilizables
│  ├─ pages/
│  │  ├─ Landing.jsx
│  │  ├─ Login.jsx
│  │  ├─ MapPage.jsx
│  │  ├─ Lesson.jsx
│  │  ├─ Challenges.jsx
│  │  ├─ Games.jsx
│  │  ├─ Profile.jsx
│  │  ├─ Grid.jsx                 # entrega de productos + InstructorDashboard
│  │  ├─ InstructorStats.jsx
│  │  ├─ AdminUsers.jsx           # gestión usuarios + bulk upload
│  │  ├─ AdminSchools.jsx         # CRUD instituciones
│  │  ├─ AdminCohorts.jsx         # cohortes vinculadas a instituciones (v13)
│  │  └─ AdminAnalytics.jsx       # métricas de progreso (v13)
│  ├─ store/
│  │  └─ store.jsx
│  ├─ lib/
│  │  ├─ supabaseClient.js
│  │  └─ mappers.js
│  ├─ styles.css
│  ├─ app.jsx
│  └─ main.jsx
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_init.sql                  # schema base
│  │  ├─ 0002_features.sql              # presencia + cohortes (v13)
│  │  ├─ 0003_cohort_institution.sql    # FK cohorts → institutions (v13)
│  │  └─ 0004_cohort_drop_area.sql      # eliminar campo área de cohorts (v14)
│  └─ functions/
│     ├─ bulk-create-users/
│     │  └─ index.ts
│     ├─ delete-user/                   # eliminar usuario (v14)
│     │  └─ index.ts
│     └─ send-reminders/                # recordatorios email (v13)
│        └─ index.ts
├─ .env                           # NO se sube
├─ .env.example
├─ .gitignore
├─ index.html
├─ package.json
└─ vite.config.js
```

**1.3 Conversión `window.*` → módulos ES**
Igual que el plan anterior: cada archivo deja de hacer `Object.assign(window, {…})` y pasa a `export { … }`; los consumidores agregan `import` arriba. Lo nuevo: ahora son más componentes (3 dashboards de admin/instructor en lugar de uno).

**1.4 `index.html` (Vite)**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Experia · CEINFES — Formación Docente DCE</title>
  <link rel="stylesheet" href="/src/styles.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```
> Ya no se cargan React, Babel ni XLSX por `<script>`. Vite los empaqueta.

**1.5 Probar en local:** `npm run dev`. Migra archivo por archivo (orden sugerido: `ui` → `store` → `landing` → `login` → `map` → `lesson` → `challenges` → `grid` → `profile` → `app`).

---

### FASE 2 — Schema en Supabase (ajustado a v12)

Crea el proyecto Supabase (igual que antes) y en **SQL Editor → New query** ejecuta:

```sql
-- ============ ROL como enum ============
create type user_role as enum ('student', 'instructor', 'admin');

-- ============ INSTITUCIONES (NUEVO) ============
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  logo text,
  created_at timestamptz default now()
);

-- ============ PERFILES (extiende auth.users) ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  avatar text,
  role user_role not null default 'student',
  area text,                                                    -- NUEVO: área asignada por admin
  institution_id uuid references public.institutions(id),       -- NUEVO
  created_at timestamptz default now()
);
create index on public.profiles (role);
create index on public.profiles (institution_id);

-- ============ PROGRESO POR USUARIO ============
create table public.progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp int default 0,
  completed text[] default '{}',
  badges text[] default '{}',
  updated_at timestamptz default now()
);

-- ============ ENTREGAS (con historial) ============
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  area text,
  rejilla_name text, rejilla_data jsonb,
  pregunta_name text, pregunta_data jsonb,
  grade int, feedback text,
  status text default 'pending' check (status in ('pending','graded','returned','approved')),
  return_count int default 0, return_notes text,
  instr_rejilla_name text, instr_rejilla_data jsonb,
  instr_pregunta_name text, instr_pregunta_data jsonb,
  history jsonb default '[]'::jsonb,                            -- NUEVO: versiones
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.submissions (student_id);
create index on public.submissions (status);

-- ============ INTENTOS DE RETOS ============
create table public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id text, area text,
  questions jsonb, score int, max_score int,
  created_at timestamptz default now()
);

-- ============ MENSAJES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  type text, return_notes text,
  submission_id uuid references public.submissions(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);
```

**2.2 Helpers de rol (NUEVO: `is_admin`)**
```sql
create or replace function public.is_instructor()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'instructor');
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
```

**2.3 RLS + políticas (admin tiene súper poder; instructor lee/califica; estudiante ve lo suyo)**
```sql
alter table public.institutions        enable row level security;
alter table public.profiles            enable row level security;
alter table public.progress            enable row level security;
alter table public.submissions         enable row level security;
alter table public.challenge_attempts  enable row level security;
alter table public.messages            enable row level security;

-- INSTITUTIONS: todos leen; solo admin escribe
create policy "anyone read institutions" on institutions for select using (auth.uid() is not null);
create policy "admin write institutions" on institutions for all
  using (public.is_admin()) with check (public.is_admin());

-- PROFILES: propio o instructor/admin leen; usuario edita lo suyo; admin total
create policy "read profiles"            on profiles for select using (id = auth.uid() or public.is_instructor() or public.is_admin());
create policy "update own profile"       on profiles for update using (id = auth.uid());
create policy "admin manage profiles"    on profiles for all    using (public.is_admin()) with check (public.is_admin());

-- PROGRESS
create policy "own progress"             on progress for all    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "instructor admin read"    on progress for select using (public.is_instructor() or public.is_admin());

-- SUBMISSIONS
create policy "student read own subs"    on submissions for select using (student_id = auth.uid() or public.is_instructor() or public.is_admin());
create policy "student insert subs"      on submissions for insert with check (student_id = auth.uid());
create policy "student update own subs"  on submissions for update using (student_id = auth.uid());
create policy "instructor grade subs"    on submissions for update using (public.is_instructor() or public.is_admin());

-- CHALLENGE ATTEMPTS
create policy "student own attempts"     on challenge_attempts for select using (student_id = auth.uid() or public.is_instructor() or public.is_admin());
create policy "student insert attempts"  on challenge_attempts for insert with check (student_id = auth.uid());

-- MESSAGES
create policy "recipient read msgs"      on messages for select using (to_user_id = auth.uid() or public.is_admin());
create policy "instructor admin send"    on messages for insert with check (public.is_instructor() or public.is_admin());
create policy "recipient mark read"      on messages for update using (to_user_id = auth.uid());
```

**2.4 Trigger de creación automática de perfil**
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_role user_role;
begin
  -- role/area/institution_id pueden venir desde la Edge Function en raw_user_meta_data
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'student');
  insert into public.profiles (id, email, name, avatar, role, area, institution_id)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email),1)),
    v_role,
    new.raw_user_meta_data->>'area',
    nullif(new.raw_user_meta_data->>'institution_id','')::uuid
  );
  insert into public.progress (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**2.5 Crear el primer admin a mano** (una sola vez):
1. **Authentication → Users → Add user** con email/password de un admin real (NO `admin@ceinfes.com / admin123`).
2. En **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin' where email = 'tu-admin@ceinfes.com';
   ```
3. Carga las instituciones iniciales:
   ```sql
   insert into public.institutions (name) values
     ('IED San Francisco'),
     ('Colegio Nacional Simón Bolívar'),
     ('Liceo Los Andes');
   ```

---

### FASE 2B — Migraciones adicionales (v13 + v14)

Ejecutar en **SQL Editor** de Supabase en orden:

**`0002_features.sql` — Presencia en tiempo real + Cohortes**
```sql
-- Presencia
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz,
  ADD COLUMN IF NOT EXISTS current_module text;

-- Cohortes
CREATE TABLE IF NOT EXISTS public.cohorts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  area        text,
  deadline    timestamptz,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read cohorts"
  ON cohorts FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin manage cohorts"
  ON cohorts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen  ON public.profiles (last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_cohort_id  ON public.profiles (cohort_id);

-- Habilitar Realtime en profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

**`0003_cohort_institution.sql` — Relación cohorte → institución**
```sql
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cohorts_institution_id ON public.cohorts (institution_id);
```

**`0004_cohort_drop_area.sql` — Eliminar campo área de cohortes (v14)**
```sql
ALTER TABLE public.cohorts DROP COLUMN IF EXISTS area;
```
> Simplificación del modelo: la clasificación por área quedó redundante una vez que cada cohorte se vincula a una institución. Los filtros por área se resuelven a través del perfil del docente (`profiles.area`).

> **Modelo de datos clave:**
> ```
> institutions (id, name, logo)
>     ↑                    ↑
> profiles.institution_id  cohorts.institution_id
>     ↑
> profiles.cohort_id → cohorts (id)
> ```
> Una cohorte pertenece a una institución. Al asignar docentes a una cohorte, el modal filtra automáticamente solo los docentes de esa institución.

### FASE 2C — Migraciones `0005` en adelante (v15)

De `0005` a `0049` las migraciones **no se transcriben aquí**: viven como archivos en
`supabase/migrations/` y se ejecutan **una por una, en orden, copiándolas al SQL Editor**
(el listado con la descripción de cada una está en `CLAUDE.md`). Todas son aditivas e
idempotentes salvo que el encabezado del archivo diga lo contrario.

⚠️ **Regla de oro: la migración va ANTES del `git push`.** Cloudflare despliega el frontend en
~2 minutos, pero las migraciones son manuales; si el código nuevo escribe una columna que
todavía no existe, PostgREST **rechaza el insert completo**. Pasó en julio de 2026 con
`0048_analytics_capture.sql`: durante un día no se guardó ningún intento de reto, y **en
silencio** — el error solo iba a `console.error` y el store actualiza el estado local de forma
optimista, así que ni el estudiante ni el instructor notaron nada.

Cómo comprobar desde afuera si una migración ya está aplicada, sin abrir el dashboard
(la anon key basta; RLS devuelve `[]` pero el error de esquema es distinto):

```bash
curl -s "$SUPABASE_URL/rest/v1/<tabla>?select=<columna>&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
# []                          → existe (RLS lo deja vacío, pero el objeto está)
# 42703 column ... not exist  → falta la columna
# PGRST205 Could not find the table → falta la tabla
```

Al día de hoy (2026-07-28) están aplicadas hasta `0048`; **`0049_analytics_rpcs.sql` está
pendiente**. Al ser solo funciones de lectura, desplegar el frontend antes no rompe nada: la
pantalla de análisis de ítems simplemente no muestra datos.

---

### FASE 3 — Edge Functions (carga masiva + recordatorios)

**Por qué:** operaciones que requieren `service_role` o API keys de terceros nunca pueden ir al frontend. Ambas funciones validan que el llamador sea admin antes de ejecutar.

**3.1 Inicializar Supabase en el proyecto**
```bash
# 📁 experia-app/
supabase login
supabase link --project-ref TU_PROJECT_REF   # lo ves en la URL del dashboard
supabase functions new bulk-create-users
```

**3.2 `supabase/functions/bulk-create-users/index.ts`**
```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401);

  // Cliente con JWT del llamador — para verificar quién es
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const { data: profile } = await userClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Forbidden: admin only" }, 403);

  // Cliente con service_role — solo en el servidor
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { users } = await req.json();
  if (!Array.isArray(users)) return json({ error: "users must be an array" }, 400);

  const results = [];
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.pass,
      email_confirm: true,                              // sin email de confirmación
      user_metadata: {
        name: u.name, role: u.role || "student",
        area: u.area || null, institution_id: u.institution_id || null,
      },
    });
    results.push({ email: u.email, ok: !error, error: error?.message });
  }
  return json({ results });
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json", ...corsHeaders() }});
}
```

**3.3 Desplegar la función**
```bash
# 📁 experia-app/
supabase functions deploy bulk-create-users --no-verify-jwt
```
> `--no-verify-jwt` porque ya validamos manualmente. Las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase automáticamente al deploy.

**3.4 Llamarla desde la app** (reemplaza `bulkCreateAccounts`):
```js
// src/lib/api.js
import { supabase } from './supabaseClient.js';

export async function bulkCreateUsers(users) {
  const { data, error } = await supabase.functions.invoke('bulk-create-users', {
    body: { users },
  });
  if (error) throw error;
  return data.results;
}
```
En `AdminUsers.jsx`, donde hoy llamas `bulkCreateAccounts(valid.map(...))`, ahora:
```js
const results = await bulkCreateUsers(
  valid.map(r => ({
    name: r.nombre, email: r.email, pass: r.contrasena.toString(),
    role: r._role, area: r._area, institution_id: r.institution_id || null,
  }))
);
// muestra al admin cuántos OK y cuántos fallaron
```

**Error común:** "Forbidden: admin only" cuando lo invocas → tu usuario no tiene `role = 'admin'` en la tabla `profiles`. Confírmalo con el UPDATE de la Fase 2.5.

---

### FASE 3B — Edge Function `delete-user` (v14)

Elimina un usuario de Supabase Auth y sus datos asociados. Solo accesible por admin.

**Desplegar:**
```bash
supabase functions new delete-user
supabase functions deploy delete-user --no-verify-jwt
```

**Llamarla desde la app** (en `AdminUsers.jsx`):
```js
await supabase.functions.invoke('delete-user', {
  body: { userId: profile.id },
});
```

**Lógica:**
1. Verifica que quien llama tiene `role = 'admin'`.
2. Elimina el usuario de `auth.users` con `service_role` → el trigger `on_auth_user_created` y el `ON DELETE CASCADE` limpian `profiles`, `progress`, `submissions` y `messages` automáticamente.
3. Devuelve `{ ok: true }` o un error descriptivo.

---

### FASE 3C — Edge Function `send-reminders` (v13)

Envía recordatorios por email a docentes con 3+ días sin avanzar, usando [Resend](https://resend.com).

**Prerrequisito:** crear cuenta en Resend y agregar el secret `RESEND_API_KEY` en Supabase → Edge Functions → Secrets.

**Desplegar:**
```bash
supabase functions deploy send-reminders --no-verify-jwt
```

**Invocar desde panel admin** (POST con Bearer token del admin):
```js
await supabase.functions.invoke('send-reminders')
```
El botón "Enviar recordatorios" en el panel admin ya lo invoca automáticamente.

**Lógica:**
1. Verifica que quien llama es admin.
2. Busca `profiles` con `role='student'` y `last_seen <= ahora - 3 días` (o `last_seen IS NULL`).
3. Excluye docentes con entregas aprobadas (ya terminaron).
4. Envía email personalizado por área a cada docente inactivo (máx 50 por invocación).
5. Devuelve `{ sent, total, results }`.

**Variables necesarias** (ya inyectadas por Supabase automáticamente excepto RESEND_API_KEY):
| Variable | Fuente |
|---|---|
| `SUPABASE_URL` | Auto |
| `SUPABASE_ANON_KEY` | Auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto |
| `RESEND_API_KEY` | Agregar manualmente en Secrets |

---

### FASE 4 — Migración del store a Supabase

**Patrón:** tu store sigue siendo el estado local de UI; **la persistencia se mueve a Supabase**. `userProgress[email]` en localStorage **desaparece** (cada login carga el progreso del usuario desde la BD).

| Acción actual | Reemplazo |
|---|---|
| `doLogin(e,p)` | `supabase.auth.signInWithPassword` + `select` de `profiles` |
| `createAccount` | `supabase.functions.invoke('bulk-create-users', { body:{ users:[u] } })` |
| `bulkCreateAccounts` | misma Edge Function |
| `deleteAccount` | Edge Function `delete-user` (desplegada en v14) |
| `changeAccountArea(email, area)` | `update profiles set area=… where email=…` (RLS permite solo admin) |
| `createInstitution / update / delete` | `insert/update/delete on public.institutions` (RLS: solo admin) |
| `completeNode` | `update progress set xp, completed, badges where user_id=auth.uid()` |
| `recordAttempt` | `insert into challenge_attempts` |
| `submitProduct` | `insert into submissions` |
| `resubmitProduct` | `update submissions` (mete versión en `history`) |
| `gradeSubmission / approveSubmission / returnSubmission` | `update submissions` (RLS: solo instructor/admin) |
| `dismissStudentMessage` | `update messages set read=true` |

**Ejemplo de versión con historial** (`resubmitProduct`):
```js
export async function resubmitProduct(subId, rejillaName, preguntaName, rejillaData, preguntaData) {
  // 1) leer entrega actual
  const { data: cur } = await supabase.from('submissions').select('*').eq('id', subId).single();
  const newVersion = {
    version: (cur.history?.length || 0) + 1,
    date: new Date().toISOString(),
    rejilla_name: cur.rejilla_name, rejilla_data: cur.rejilla_data,
    pregunta_name: cur.pregunta_name, pregunta_data: cur.pregunta_data,
    grade: cur.grade, feedback: cur.feedback,
  };
  // 2) escribir nueva versión + apilar la previa en history
  await supabase.from('submissions').update({
    rejilla_name: rejillaName, rejilla_data: rejillaData,
    pregunta_name: preguntaName, pregunta_data: preguntaData,
    status: 'pending', grade: null, feedback: '',
    history: [...(cur.history || []), newVersion],
  }).eq('id', subId);
}
```

**Quitar del store al migrar:**
- `INITIAL_ACCOUNTS`, `INITIAL_INSTITUTIONS`, `userProgress`, los `localStorage.setItem/getItem/removeItem`.
- Las versiones viejas (`experia-v7…v11`) ya las limpia el código actual — déjalo unas semanas y luego también quita el `removeItem` para no cargar lógica muerta.

---

### FASE 5 — Variables de entorno

**📁 experia-app/`.env`** (no se sube):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```
**📁 experia-app/`.env.example`** (sí se sube, vacío).

> La `service_role` key vive **solo** en Supabase como secret de la Edge Function. Nunca en `.env`, nunca en GitHub, nunca en Cloudflare Pages.

---

### FASE 6 — GitHub, Cloudflare Pages, dominio

Igual que el plan original. Resumen:

```bash
# 📁 experia-app/
git init && git add . && git commit -m "Migración a Vite + Supabase + Edge Function"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/experia-app.git
git push -u origin main
```

Cloudflare Pages → conectar repo → Framework: **Vite**, build: `npm run build`, output: `dist`, env vars `VITE_SUPABASE_*`. Crea **📁 public/_redirects** con `/* /index.html 200` y **📁 public/_headers** con cabeceras de seguridad. Custom domain `experia.ceinfes.com` y agrégalo a las **Redirect URLs** de Supabase Auth.

---

### FASE 7 — Monitoreo, seguridad, costos

- **Logs Supabase:** vigila los logs de la Edge Function tras cada carga masiva.
- **Auth settings:** sube contraseña mínima a 8+, activa confirmación de email (opcional si admin precarga usuarios).
- **No exponer `service_role`** en ningún lado fuera del entorno de la Edge Function.
- **Backups Pro:** diarios. Para algo crítico exporta dump semanal.
- **Sentry** en frontend, **Cloudflare Web Analytics** para visitas.
- **Costo total:** $25/mes Supabase Pro + $0 Cloudflare. Las Edge Functions están incluidas con buen margen.

---

## 4. Checklist actualizado (v14)

```
BASE (completo en producción)
[x] npm run build pasa sin errores
[x] .env NO está en Git
[x] Schema 0001_init.sql aplicado (institutions, profiles, RLS, trigger)
[x] Helpers is_instructor() y is_admin() creados
[x] RLS activa en todas las tablas
[x] Primer admin creado y rol=admin asignado por SQL
[x] Edge Function bulk-create-users desplegada
[x] Repo en GitHub + Cloudflare Pages con deploy automático
[x] Vars VITE_* en Cloudflare

MIGRACIONES v13 (verificar que estén aplicadas)
[x] 0002_features.sql aplicado (last_seen, cohorts, realtime)
[x] 0003_cohort_institution.sql aplicado (cohorts.institution_id)

MIGRACIÓN v14
[ ] 0004_cohort_drop_area.sql aplicado (DROP COLUMN area en cohorts)

EDGE FUNCTIONS v13
[ ] Cuenta Resend creada y dominio verificado
[ ] RESEND_API_KEY agregado en Supabase → Edge Functions → Secrets
[ ] supabase functions deploy send-reminders --no-verify-jwt ejecutado
[ ] Probado: botón "Enviar recordatorios" → emails llegan a docentes inactivos

EDGE FUNCTION v14
[ ] supabase functions deploy delete-user --no-verify-jwt ejecutado
[ ] Probado: admin elimina usuario desde AdminUsers → desaparece de la lista

MIGRACIONES v15 (analítica de pruebas)
[x] 0048_analytics_capture.sql aplicado (challenge_attempts.course_id/module_id/attempt_no + quiz_attempt_answers)
[ ] 0049_analytics_rpcs.sql aplicado (item_analysis y demás RPC de agregación)
[ ] Verificado: un reto respondido dos veces genera DOS filas en challenge_attempts (attempt_no 1 y 2)
[ ] Verificado: un quiz de N preguntas genera N filas en quiz_attempt_answers con la opción elegida
[ ] Verificado: el instructor solo ve datos de su institución (probar con dos instituciones)

FUNCIONALIDAD v13 (verificar en producción)
[x] Admin puede crear cohorte asignando institución
[x] Modal "Asignar docentes" solo muestra docentes de esa institución
[x] Panel AdminAnalytics muestra métricas de progreso
[x] Presencia en tiempo real visible para admin/instructor
[x] Recordatorio no se envía a docentes con entrega aprobada
```

---

## 5. Riesgos comunes (ajustados)

| Riesgo | Causa | Solución |
|---|---|---|
| Edge Function "Forbidden: admin only" | usuario no tiene rol admin en `profiles` | UPDATE rol manual en SQL |
| Edge Function devuelve 500 | falta `SUPABASE_SERVICE_ROLE_KEY` o error al crear usuario | revisar logs en Supabase → Functions |
| Bulk import crea usuarios pero sin perfil | el trigger `handle_new_user` falló | revisar logs SQL; el trigger se ejecuta con security definer |
| Excel sube pero `pass` viene como número | XLSX devuelve número si la celda no es texto | `u.pass.toString()` al llamar la Edge Function |
| "infinite recursion" en RLS | política consulta la misma tabla | usar siempre `is_admin()` / `is_instructor()` security definer |
| Admin de Supabase no puede iniciar sesión | confundir Auth del dashboard con Auth de la app | son distintos: el admin de la app es un usuario más en `auth.users` con `role='admin'` |
| Usuarios viejos del seed (`admin123` / `123456`) en producción | quedaron en código | borra `INITIAL_ACCOUNTS` antes del primer deploy |
| Se dejan de guardar datos **sin ningún error visible** | se desplegó código que escribe una columna cuya migración aún no se corrió: PostgREST rechaza el insert completo y el frontend solo hace `console.error` | corre la migración; de ahí en adelante, migración **antes** del push (ver FASE 2C) |
| La pantalla de análisis de ítems abre vacía | falta `0049`; las RPC no existen | ejecutar `0049_analytics_rpcs.sql` en el SQL Editor |

---

## 6. Recomendaciones finales

1. **Antes del primer despliegue real, borra TODAS las cuentas seed con contraseñas débiles** (`admin123`, `123456`). El admin real lo creas tú con una contraseña fuerte vía Supabase Authentication → Users.
2. **Prueba la Edge Function en `localhost` primero**: `supabase functions serve bulk-create-users` y un fetch al endpoint local. Mucho más rápido que iterar deploy tras deploy.
3. **Versionar el schema** desde el día 1 con archivos en `supabase/migrations/`. En este proyecto los archivos se aplican **a mano en el SQL Editor** (no hay `supabase db push` en el flujo): por eso cada uno es idempotente y por eso la migración va antes del push. Si algún día se adopta el CLI, migrar el historial completo de una vez, no a medias.
4. **Migra en este orden estrictamente:** Fase 1 (Vite, todo funcional en local con seeds duros) → Fase 2 (schema en Supabase) → Fase 3 (Edge Function) → Fase 4 (reemplazo de cada acción del store, **una por una**, verificando en local con `supabase start` o contra Supabase remoto en dev). No mezcles fases en el mismo commit.
5. **Plan de prueba de carga sugerido** antes del pico de 200: 5 → 20 → 50 → 100 estudiantes en sesiones reales (clases pequeñas), midiendo tiempos de respuesta en Supabase → Reports. Si todo va bien, el salto a 200 es seguro.

---

*Stack: Vite + React 18 · Cloudflare Pages · Supabase Pro (Postgres + Auth + RLS + Realtime + Edge Functions) · ~$25/mes.*
*Experia v14: 3 roles · instituciones · cohortes por institución · carga masiva · eliminación de usuarios · historial de versiones · presencia en tiempo real · analítica · recordatorios email.*
