# Experia by CEINFES — Referencia Técnica

> Documento técnico del proyecto. Para instrucciones de despliegue ver `Experia-Runbook-Despliegue-v12.md`.
> Última actualización: v14 (junio 2026).

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend framework | React | 18.3.1 |
| Build tool | Vite | 5.4.10 |
| Hosting frontend | Cloudflare Pages | — |
| Base de datos | Supabase (PostgreSQL) | Pro |
| Auth | Supabase Auth (JWT) | — |
| Edge Functions | Deno (TypeScript) | — |
| Excel import | XLSX | 0.18.5 |
| Email reminders | Resend API | — |

**No se usa:** TypeScript en frontend, CSS framework (Tailwind/Bootstrap), framework de testing, Redux/Zustand, servidor REST propio.

---

## Estructura del repositorio

```
experia-app/
├── index.html                    # Punto de entrada HTML (Vite)
├── vite.config.js                # Config build + chunk splitting
├── package.json
├── .env                          # Credenciales locales (NO en Git)
├── .env.example                  # Plantilla vacía (sí en Git)
├── .gitignore
│
├── public/
│   ├── _redirects                # /* /index.html 200  (SPA routing)
│   ├── _headers                  # Cabeceras de seguridad
│   └── uploads/
│
├── src/
│   ├── main.jsx                  # Bootstrap: sesión, hidratación de datos
│   ├── app.jsx                   # Shell: routing, sidebar, header
│   ├── styles.css                # Variables CSS globales + animaciones
│   │
│   ├── components/
│   │   ├── ui.jsx                # Componentes reutilizables (botones, modales, charts…)
│   │   └── ErrorBoundary.jsx
│   │
│   ├── pages/
│   │   ├── landing.jsx
│   │   ├── login.jsx
│   │   ├── map.jsx               # Mapa de aprendizaje (nodos interactivos)
│   │   ├── lesson.jsx            # Visor de lecciones
│   │   ├── challenges.jsx        # Retos interactivos (drag-drop, empathy map…)
│   │   ├── profile.jsx           # Perfil + selección de área
│   │   ├── Grid.jsx              # Entrega de productos + calificación instructor
│   │   ├── InstructorDashboard.jsx
│   │   ├── InstructorStudentView.jsx  # Vista de progreso por estudiante
│   │   ├── AdminAnalytics.jsx    # Panel de métricas (5 gráficos)
│   │   ├── AdminCohorts.jsx      # CRUD cohortes + asignación de docentes
│   │   ├── AdminSchools.jsx      # CRUD instituciones
│   │   └── AdminUsers.jsx        # Gestión usuarios + carga masiva Excel
│   │
│   ├── store/
│   │   └── store.jsx             # Estado reactivo centralizado (custom hook)
│   │
│   └── lib/
│       ├── supabaseClient.js     # Cliente Supabase inicializado
│       └── api.js                # bulkCreateUsers()
│
├── scripts/
│   └── (generación de datos de prueba, stress testing)
│
└── supabase/
    ├── migrations/
    │   ├── 0001_init.sql
    │   ├── 0002_features.sql
    │   ├── 0003_cohort_institution.sql
    │   └── 0004_cohort_drop_area.sql
    └── functions/
        ├── bulk-create-users/index.ts
        ├── delete-user/index.ts
        └── send-reminders/index.ts
```

---

## Variables de entorno

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```
Solo estas dos variables tocan el frontend. La `service_role` key **nunca** sale del entorno de las Edge Functions.

### Edge Functions (Supabase Secrets)
| Variable | Fuente |
|---|---|
| `SUPABASE_URL` | Inyectada automáticamente |
| `SUPABASE_ANON_KEY` | Inyectada automáticamente |
| `SUPABASE_SERVICE_ROLE_KEY` | Inyectada automáticamente |
| `RESEND_API_KEY` | Agregar manualmente en Supabase → Edge Functions → Secrets |

---

## Base de datos

### Diagrama de relaciones

```
auth.users (Supabase)
     │ trigger: handle_new_user()
     ▼
institutions (id, name, logo)
     ▲                    ▲
     │                    │
profiles (id, email, name, role, area, institution_id, cohort_id, last_seen, current_module)
     │
     ├──▶ progress (user_id, xp, completed[], badges[])
     │
     ├──▶ submissions (id, student_id, area, rejilla_data, pregunta_data,
     │                 grade, feedback, status, return_count, history[])
     │
     ├──▶ challenge_attempts (id, student_id, challenge_id, score, max_score)
     │
     └──▶ messages (id, to_user_id, submission_id, type, read)

cohorts (id, name, deadline, institution_id, notes)
     ▲
     │
profiles.cohort_id
```

### Tablas

#### `institutions`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `name` | text UNIQUE | nombre del colegio |
| `logo` | text | URL o inicial |
| `created_at` | timestamptz | |

#### `profiles`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | FK → auth.users |
| `email` | text UNIQUE | |
| `name` | text | |
| `avatar` | text | inicial del nombre |
| `role` | user_role | `student` / `instructor` / `admin` |
| `area` | text | área asignada por admin |
| `institution_id` | uuid | FK → institutions |
| `cohort_id` | uuid | FK → cohorts |
| `last_seen` | timestamptz | presencia en tiempo real |
| `current_module` | text | módulo activo actual |
| `created_at` | timestamptz | |

#### `cohorts`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `deadline` | timestamptz | |
| `institution_id` | uuid | FK → institutions |
| `notes` | text | |
| `created_at` | timestamptz | |

> **Nota v14:** el campo `area` fue eliminado de `cohorts` (migración 0004). La agrupación por área se hace desde `profiles.area`.

#### `progress`
| Campo | Tipo | Notas |
|---|---|---|
| `user_id` | uuid PK | FK → profiles |
| `xp` | int | puntos de experiencia |
| `completed` | text[] | IDs de nodos completados |
| `badges` | text[] | insignias obtenidas |
| `updated_at` | timestamptz | |

#### `submissions`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid | FK → profiles |
| `area` | text | |
| `rejilla_name` | text | nombre del archivo rejilla |
| `rejilla_data` | jsonb | contenido del archivo |
| `pregunta_name` | text | |
| `pregunta_data` | jsonb | |
| `grade` | int | calificación |
| `feedback` | text | comentario del instructor |
| `status` | text | `pending` / `graded` / `returned` / `approved` |
| `return_count` | int | veces devuelta |
| `return_notes` | text | |
| `instr_rejilla_*` | text/jsonb | archivos del instructor |
| `history` | jsonb | array de versiones anteriores |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `challenge_attempts`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid | FK → profiles |
| `challenge_id` | text | |
| `area` | text | |
| `questions` | jsonb | respuestas del intento |
| `score` | int | |
| `max_score` | int | |
| `created_at` | timestamptz | |

#### `messages`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `to_user_id` | uuid | FK → profiles |
| `type` | text | tipo de notificación |
| `return_notes` | text | notas de devolución |
| `submission_id` | uuid | FK → submissions |
| `read` | boolean | |
| `created_at` | timestamptz | |

---

## Seguridad (RLS)

### Funciones helper
```sql
-- Ambas son SECURITY DEFINER para evitar recursión en RLS
public.is_instructor() → boolean
public.is_admin()      → boolean
```

### Matriz de permisos por tabla

| Tabla | Student | Instructor | Admin |
|---|---|---|---|
| `institutions` | SELECT | SELECT | CRUD |
| `profiles` | SELECT/UPDATE propio | SELECT todos | CRUD |
| `progress` | CRUD propio | SELECT | SELECT |
| `submissions` | SELECT propio + INSERT + UPDATE propio | SELECT + UPDATE (calificar) | Todo |
| `challenge_attempts` | SELECT propio + INSERT | SELECT | SELECT |
| `messages` | SELECT/UPDATE propio (marcar leído) | INSERT | SELECT + INSERT |
| `cohorts` | SELECT | SELECT | CRUD |

### Trigger de creación automática
Al crear un usuario en `auth.users`, `handle_new_user()` inserta automáticamente en `profiles` y `progress`. Lee `raw_user_meta_data` para asignar `name`, `role`, `area`, `institution_id`.

---

## Edge Functions

### `bulk-create-users`
- **Método:** POST
- **Auth:** Requiere Bearer token de admin
- **Body:** `{ users: [{ name, email, pass, role, area, institution_id }] }`
- **Retorna:** `{ results: [{ email, ok, error }] }`
- **Usa:** `service_role` para crear usuarios sin email de confirmación

### `delete-user`
- **Método:** POST
- **Auth:** Requiere Bearer token de admin
- **Body:** `{ userId: "<uuid>" }`
- **Retorna:** `{ ok: true }` o error
- **Nota:** El `ON DELETE CASCADE` en `profiles` limpia todos los datos relacionados automáticamente

### `send-reminders`
- **Método:** POST
- **Auth:** Requiere Bearer token de admin
- **Body:** vacío
- **Retorna:** `{ sent, total, results }`
- **Lógica:**
  1. Busca `profiles` con `role='student'` y `last_seen <= now() - 3 días` (o NULL)
  2. Excluye estudiantes con entrega aprobada
  3. Envía email personalizado por área vía Resend API
  4. Máximo 50 emails por invocación

---

## Arquitectura del frontend

### Estado global (`store.jsx`)
Custom hook reactivo sin librerías externas. Patrón:
```js
const store = createExpStore();
export const useStore = () => useSyncExternalStore(store.subscribe, store.getState);
```

**Contenido educativo embebido en el store:**
- 5 áreas de aprendizaje: Lectura Crítica, Competencias Ciudadanas, Inglés, Matemáticas, Ciencias Naturales
- 2 módulos compartidos (Intro DCE + Empatía Educativa)
- 4 módulos por área = 20 módulos en total
- ~30 retos interactivos
- 8 tipos de insignias
- Niveles XP: 0 → 3500

### Routing
Routing manual en `app.jsx` via estado (`currentPage`). No se usa React Router.

### Hidratación de datos (`main.jsx`)
Al iniciar la app:
1. Restaura sesión de Supabase Auth
2. Carga `profiles` del usuario logueado
3. Carga `institutions`, `cohorts`, `submissions`, `challenge_attempts`
4. Suscripción Realtime a `profiles.last_seen` para presencia

### Chunk splitting (vite.config.js)
```
vendor-react      → React + ReactDOM
vendor-supabase   → @supabase/supabase-js
vendor-xlsx       → XLSX
```
Límite de advertencia: 600 KB.

---

## Tipos de retos interactivos (`challenges.jsx`)

| Tipo | Descripción |
|---|---|
| Drag-drop | Arrastrar conceptos a categorías |
| Empathy map | Costruir mapa de empatía del estudiante |
| Simulation | Escenarios de decisión con consecuencias |
| Matching pairs | Emparejar términos con definiciones |

---

## Deployment

### Flujo CI/CD
```
git push origin main
        │
        ▼
Cloudflare Pages (build automático)
  npm run build → dist/
        │
        ▼
https://experia-app.pages.dev
```

### Variables en Cloudflare Pages
```
VITE_SUPABASE_URL      = https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY = <anon_key>
```

### Comandos de despliegue de Edge Functions
```bash
supabase login
supabase link --project-ref <ref>
supabase functions deploy bulk-create-users --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy send-reminders --no-verify-jwt
```

---

## Realtime

Habilitado en la tabla `profiles` vía:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

Campos relevantes para presencia:
- `profiles.last_seen` — timestamp de última actividad
- `profiles.current_module` — módulo activo en este momento

El frontend suscribe a cambios en `profiles` y actualiza la UI de presencia en el panel de instructor/admin sin necesidad de polling.

---

## Costos estimados

| Servicio | Costo mensual |
|---|---|
| Supabase Pro | ~$25 USD |
| Cloudflare Pages | $0 |
| Resend (hasta 3000 emails/mes) | $0 |
| **Total** | **~$25 USD/mes** |

---

## Limitaciones conocidas

- Sin framework de testing — no hay tests unitarios ni de integración.
- Sin TypeScript en el frontend — solo JSX.
- El store tiene ~6000 líneas incluyendo todo el contenido educativo embebido; considerar separar contenido a JSON o Supabase si crece.
- `send-reminders` tiene un límite de 50 emails por invocación manual; para volúmenes mayores se necesita paginación o un cron job.
- La eliminación de usuarios (`delete-user`) es irreversible — no hay soft-delete.

---

*Experia by CEINFES · Stack: Vite 5 + React 18 · Supabase Pro · Cloudflare Pages · Deno Edge Functions*
