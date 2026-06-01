# Experia by CEINFES — Plataforma de Formación Docente DCE

Plataforma web para la formación de docentes en **Diseño Centrado en Experiencias (DCE)**. Permite a los docentes recorrer una ruta de aprendizaje por áreas, completar retos interactivos, entregar productos finales y recibir retroalimentación de instructores.

**URL de producción:** https://experia-app.pages.dev

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend / Auth | Supabase (Postgres + Auth + RLS + Edge Functions) |
| Deploy frontend | Cloudflare Pages |
| Deploy funciones | Supabase Edge Functions (Deno) |
| Repositorio | GitHub (`sergio-baha/experia-app`) |

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `student` | Ruta de aprendizaje, retos, entrega de producto final |
| `instructor` | Panel de revisión y calificación de entregas |
| `admin` | Gestión de usuarios, colegios y carga masiva por Excel |

---

## Estructura del proyecto

```
experia-app/
├── public/
│   ├── _redirects          # SPA routing para Cloudflare Pages
│   └── _headers            # Cabeceras de seguridad HTTP
├── src/
│   ├── main.jsx            # Entrada: ReactDOM + restauración de sesión Supabase
│   ├── app.jsx             # Shell principal: routing, sidebar, header, paneles admin
│   ├── styles.css          # Estilos globales (variables CSS, animaciones)
│   ├── components/
│   │   └── ui.jsx          # Componentes compartidos: botones, modales, iconos, toasts
│   ├── pages/
│   │   ├── landing.jsx         # Página de bienvenida
│   │   ├── login.jsx           # Login con Supabase Auth
│   │   ├── map.jsx             # Mapa de aprendizaje (ruta del estudiante)
│   │   ├── lesson.jsx          # Visor de lecciones
│   │   ├── challenges.jsx      # Retos interactivos (drag-drop, simulación, matching)
│   │   ├── profile.jsx         # Perfil del usuario y cambio de área
│   │   ├── Grid.jsx            # Entrega de producto final + panel del instructor
│   │   └── InstructorDashboard.jsx  # Re-export desde Grid.jsx
│   ├── store/
│   │   └── store.jsx       # Estado global (custom store reactivo + acciones)
│   └── lib/
│       ├── supabaseClient.js   # Cliente Supabase (anon key)
│       └── api.js              # Capa de API: bulkCreateUsers via Edge Function
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql   # Schema completo: tablas, RLS, trigger, enums
│   └── functions/
│       └── bulk-create-users/
│           └── index.ts    # Edge Function: crea usuarios con service_role (solo admin)
├── .env                    # Variables de entorno locales (NO en Git)
├── .env.example            # Plantilla de variables
├── index.html              # Entrada HTML de Vite
├── vite.config.js
└── package.json
```

---

## Configuración local

### Prerrequisitos
- Node.js v20+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Cloudflare](https://cloudflare.com) (solo para deploy)

### 1. Clonar e instalar

```bash
git clone https://github.com/sergio-baha/experia-app.git
cd experia-app
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Estos valores se encuentran en Supabase → **Project Settings → API Keys**.

### 3. Base de datos

En Supabase → **SQL Editor**, ejecuta el archivo completo:

```
supabase/migrations/0001_init.sql
```

Esto crea: tablas, enum `user_role`, RLS, helpers `is_admin()` / `is_instructor()`, trigger de perfil automático e instituciones seed.

### 4. Primer usuario admin

1. Supabase → **Authentication → Users → Add user** (email + contraseña fuerte, Auto Confirm: ✓)
2. SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### 5. Ejecutar en local

```bash
npm run dev
# → http://localhost:5173
```

---

## Base de datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Extiende `auth.users`: nombre, rol, área, institución |
| `institutions` | Colegios / instituciones educativas |
| `progress` | XP, módulos completados, insignias por estudiante |
| `submissions` | Entregas de producto final con historial de versiones |
| `challenge_attempts` | Intentos de retos interactivos |
| `messages` | Notificaciones de devolución instructor → estudiante |

### Seguridad (RLS)

- **Estudiante:** solo lee y escribe sus propios datos.
- **Instructor:** lee todas las entregas e intentos; puede calificar.
- **Admin:** acceso total a perfiles, instituciones y operaciones de escritura.
- Las funciones `is_admin()` e `is_instructor()` son `SECURITY DEFINER` para evitar recursión en políticas.

---

## Edge Function: `bulk-create-users`

Crea usuarios en Supabase Auth usando `service_role` (que nunca puede ir al frontend).

**Endpoint:** `POST /functions/v1/bulk-create-users`

**Seguridad:** verifica que el llamador tenga `role = 'admin'` en `profiles` antes de ejecutar.

**Body:**
```json
{
  "users": [
    {
      "name": "María García",
      "email": "maria@colegio.com",
      "pass": "contraseña123",
      "role": "student",
      "area": "lectura",
      "institution_id": null
    }
  ]
}
```

**Respuesta:**
```json
{
  "results": [
    { "email": "maria@colegio.com", "ok": true, "error": null }
  ]
}
```

---

## Deploy

### Cloudflare Pages (automático)

Cada `git push` a `main` dispara un deploy automático en Cloudflare Pages.

**Configuración del build:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### URLs en Supabase

Después de cualquier cambio de dominio, actualizar en Supabase → **Authentication → URL Configuration**:
- Site URL: `https://experia-app.pages.dev`
- Redirect URLs: `https://experia-app.pages.dev/**`

---

## Áreas de formación

| ID | Nombre |
|----|--------|
| `lectura` | Lectura Crítica |
| `ciudadanas` | Competencias Ciudadanas |
| `ingles` | Inglés |
| `matematicas` | Matemáticas |
| `ciencias` | Ciencias Naturales |

---

## Flujo del estudiante

```
Login → Selección de área → Mapa de aprendizaje
  → Lecciones (mod1, mod2, mod3, mod4)
  → Retos (drag-drop, empatía, simulación, matching, lab DCE)
  → Entrega de producto final (2 archivos Word)
  → Revisión del instructor → Aprobado → Certificado
```

---

## Carga masiva de usuarios (Excel)

El admin puede importar usuarios desde un archivo `.xlsx` / `.csv` con las columnas:

| Columna | Requerido | Valores válidos |
|---------|-----------|----------------|
| Nombre | ✓ | Texto |
| Email | ✓ | email válido, único |
| Contraseña | ✓ | mínimo 6 caracteres |
| Rol | ✓ | `student` / `instructor` |
| Área | Para estudiantes | `lectura`, `ciudadanas`, `ingles`, `matematicas`, `ciencias` |
| Institución | — | Nombre del colegio |

Descarga la plantilla desde el panel Admin → Usuarios → Carga masiva.

---

## Comandos útiles

```bash
npm run dev        # Servidor de desarrollo (http://localhost:5173)
npm run build      # Build de producción → dist/
npm run preview    # Preview del build local
git push           # Deploy automático a Cloudflare Pages
```

---

## Pendientes / Roadmap

- [ ] Migrar progreso del estudiante (XP, módulos) a tabla `progress` en Supabase
- [ ] Migrar `submissions` y `challenge_attempts` a Supabase
- [ ] Agregar `deleteAccount` conectado a Supabase Auth
- [ ] Prueba de carga: 5 → 20 → 50 → 200 usuarios simultáneos
- [ ] Sentry para monitoreo de errores en producción

---

*Stack: Vite + React 18 · Cloudflare Pages · Supabase Pro (Postgres + Auth + RLS + Edge Functions)*
*Versión: v12 · 3 roles · instituciones · carga masiva · historial de versiones*
