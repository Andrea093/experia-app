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
| `challenge_attempts` | Intentos de retos interactivos (todos, numerados, con curso y módulo) |
| `quiz_attempt_answers` | Una fila por pregunta respondida, con la opción elegida — alimenta el análisis de ítems |
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

## Modo Aula en Vivo (quiz sincrónico tipo Kahoot)

Para usar en clase: el profesor lanza un reto **Quiz** en vivo y los estudiantes responden contra reloj, con tabla de posiciones y podio. El estudiante no puede adelantarse: la pantalla sigue el ritmo del profesor.

- **Activar (una sola vez):** ejecuta `supabase/migrations/0022_live_classroom.sql` en el SQL Editor de Supabase.
- **Profesor:** menú lateral → **Aula en Vivo** → elige curso y un reto Quiz → *Iniciar*. Se muestra un **PIN** y un **QR**.
- **Estudiantes:** entran a `…/#/live` (sin login), escriben el PIN y sus datos (nombre, apellido, correo, salón), o escanean el QR.
- **Flujo por pregunta:** pregunta (con cuenta regresiva) → resultados → explicación → ranking → siguiente; al final, **podio**.
- El contenido sale de los retos `quiz` del curso. Edita preguntas, explicaciones, tiempo y puntos en **Ruta → reto Quiz** (incluye subida de imágenes y un texto/imágenes de apoyo "passage").

---

## Análisis de ítems (calidad de tus pruebas)

Le responde al instructor si **sus preguntas están bien construidas**, que es exactamente lo
que el curso de DCE enseña a hacer. Menú lateral → **Análisis de ítems** → colegio → curso →
reto.

- **Activar (una sola vez):** ejecuta `0048_analytics_capture.sql` y `0049_analytics_rpcs.sql`
  en el SQL Editor de Supabase, en ese orden.
- **Dificultad (p):** qué % acertó. Cerca de 0.5 es donde la pregunta aporta más información;
  por encima de 0.9 casi no distingue a nadie.
- **Discriminación (D):** compara el cuartil de mejor desempeño contra el de menor. Si es
  **negativa**, los que más saben la fallan más: casi siempre es un problema de redacción o de
  clave, no de los estudiantes. Los ítems salen ordenados de peor a mejor D, con semáforo.
- **Distractores:** al abrir un ítem se ve qué opción incorrecta eligió cada quién y **cuántos
  del cuartil alto** cayeron en ella — ahí se detecta la opción ambigua.
- **Evolución:** de los que fallaron y volvieron a intentar, cuántos acertaron después.
- **Muestra:** la cabecera siempre dice sobre cuántos intentos, cuántos estudiantes y en qué
  rango de fechas se calculó. Con menos de 10 estudiantes, `D` no se muestra (diría
  "muestra insuficiente"): con esa cantidad el número es ruido.
- **Sobre qué se calcula:** el **primer intento** de cada estudiante. Mezclar los reintentos
  inflaría la dificultad, porque quien repite ya vio la respuesta.
- **Exportar:** dos botones xlsx — la tabla de análisis y las respuestas crudas por
  estudiante/ítem, para quien quiera hacer su propio análisis.

> Las preguntas nuevas nacen con un id estable, así que **corregir el texto de una pregunta ya
> no parte su histórico**. Los quizzes creados antes reciben ese id la primera vez que se
> abren en el editor de ruta y se guardan.

---

## Acta de cierre (asistencia → PDF)

Un paso más de la ruta. Lo **diligencia el tutor** (confirma asistencia y deja observaciones) y
el **docente en formación lo ve como constancia** y lo descarga en PDF: en Experia el
"estudiante" es un docente, así que el acta también le pertenece.

- **Activar (una sola vez):** ejecuta `0050_closing_record.sql` en el SQL Editor de Supabase.
- **1 · El admin carga el listado:** Admin → Cursos → menú (⋮) del curso → **Listado de
  asistentes (acta)** → elige el colegio → sube el Excel. Una columna **Nombre** obligatoria,
  y opcionalmente **Documento** y **Correo** (también acepta *Nombres* y *Apellidos*
  separados). Hay botón de plantilla. No tienen que ser usuarios de la plataforma.
- **2 · El tutor agrega el nodo:** Ruta → **Agregar Acta de Cierre** → Publicar.
- **3 · El tutor la diligencia:** botón **📋 Diligenciar** en la fila del módulo → marca quién
  asistió, escribe observaciones por persona y generales, y **Guardar borrador** cuantas veces
  quiera.
- **4 · Cerrar y generar el PDF:** **🔒 Cerrar acta** la congela (ya no se edita, salvo un
  admin) y **🖨️ Imprimir / PDF** abre el diálogo del navegador → *Guardar como PDF*.

- **5 · El docente la consulta:** el nodo aparece en su mapa. Mientras el tutor no la cierre,
  ve "el acta todavía no está firmada"; cuando la cierra, ve el acta completa del grupo y puede
  descargarla en PDF, y **el nodo se le marca como completado**.

> ⚠️ **El nodo del acta bloquea el resto de la ruta hasta que el tutor la cierre.** Si un grupo
> aparece trabado al final del curso (o sin poder emitir el certificado), lo primero que hay que
> revisar es si el acta quedó en borrador.
>
> El acta guarda su propia copia de los asistentes: si el admin recarga el Excel después,
> las actas ya diligenciadas no cambian. Hay **una sola acta por curso y colegio**.
> Los docentes solo ven actas **cerradas**; los borradores no salen de manos del tutor.

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

## Modificar contenido de la ruta formativa

Todo el contenido educativo vive en **dos archivos**. No hay base de datos de contenido — los cambios se hacen en código y se despliegan con `git push`.

### Mapa de archivos de contenido

| Qué quieres cambiar | Archivo | Sección |
|---------------------|---------|---------|
| Títulos, descripción, XP, duración de módulos | `src/store/store.jsx` | `SHARED_MODULES` |
| Texto de lecciones compartidas (Módulo 1 y 2) | `src/store/store.jsx` | `SHARED_MODULES[].content[]` |
| Contenido de módulos por área (Módulo 3 y 4) | `src/store/store.jsx` | `AREA_CONTENT[area].m3` / `.m4` |
| Reto 3: contexto de simulación | `src/store/store.jsx` | `AREA_CONTENT[area].simContext` |
| Reto 4: pares de conceptos para conectar | `src/store/store.jsx` | `AREA_CONTENT[area].matchPairs` |
| Reto 1: orden de fases DCE (drag-drop) | `src/pages/challenges.jsx` | `correctOrder` (línea ~21) |
| Reto 2: mapa de empatía | `src/pages/challenges.jsx` | `EmpathyChallenge` |
| Nombres, colores e íconos de áreas | `src/store/store.jsx` | `AREAS` |
| Criterios de la rúbrica | `src/store/store.jsx` | `RUBRIC_CRITERIA` |
| Insignias (badges) | `src/store/store.jsx` | `BADGES` |

---

### Paso a paso: cambiar el texto de una lección

**Ejemplo:** cambiar el texto del Módulo 1 (Introducción al DCE)

**1.** Abre `src/store/store.jsx` en VS Code

**2.** Busca `SHARED_MODULES` (Ctrl+F → `SHARED_MODULES`)

**3.** Dentro del módulo que quieres editar, localiza el array `content:[]`. Cada elemento es una sección con este formato:

```js
// Tipo: párrafo introductorio
{ type:'intro', title:'Título de la sección', text:'Texto del párrafo...' }

// Tipo: destacado / callout
{ type:'callout', icon:'💡', title:'Título', text:'Texto destacado' }

// Tipo: lista de conceptos
{ type:'concepts', title:'Título', items:[
  { t:'Nombre concepto', d:'Descripción del concepto' },
  { t:'Otro concepto',   d:'Su descripción' },
]}

// Tipo: párrafo normal
{ type:'text', title:'Título', text:'Texto...' }

// Tipo: comparación tradicional vs DCE
{ type:'compare', title:'Título', label:'Tema',
  trad:'Enfoque tradicional...', dce:'Enfoque DCE...' }
```

**4.** Edita el texto directamente. Guarda el archivo.

**5.** En tu terminal:
```cmd
git add src/store/store.jsx
git commit -m "Actualizar contenido Módulo 1"
git push
```

En ~2 minutos el cambio está en producción.

---

### Paso a paso: cambiar el contenido de un área específica

**Ejemplo:** cambiar el Módulo 3 del área de Matemáticas

**1.** Abre `src/store/store.jsx`, busca `AREA_CONTENT`

**2.** Navega a `matematicas:` → `m3:` → `content:[]`

**3.** Edita las secciones con el mismo formato de tipos (`intro`, `callout`, `concepts`, etc.)

**4.** Para cambiar la simulación del Reto 3, edita `simContext`:
```js
simContext: 'una clase de geometría experiencial para 9° grado usando diseño de espacios reales',
// Cambia por tu contexto, por ejemplo:
simContext: 'una clase de estadística donde los estudiantes analizan datos de su colegio',
```

**5.** Para cambiar los pares del Reto 4 (conectar conceptos), edita `matchPairs`:
```js
matchPairs: [
  { id:1, concept:'Razonamiento lógico', def:'Proceso ordenado de deducción e inferencia', color:'#E8732C' },
  // Agrega, quita o modifica pares — máximo 6
]
```

**6.** Guarda, haz commit y push.

---

### Paso a paso: cambiar el Reto 1 (drag-drop de fases)

**1.** Abre `src/pages/challenges.jsx`

**2.** Busca `correctOrder` (Ctrl+F)

**3.** Edita el array con las fases en el orden correcto:
```js
const correctOrder = ['Empatizar','Definir','Idear','Prototipar','Evaluar'];
// Puedes cambiar las palabras, agregar o quitar fases
```

**4.** Guarda, commit y push.

---

### Paso a paso: agregar un módulo nuevo

**1.** En `src/store/store.jsx`, dentro de `SHARED_MODULES` agrega un nuevo objeto siguiendo esta estructura:

```js
{
  id: 'mod3_extra',          // ID único, sin espacios
  type: 'lesson',            // 'lesson' para lección, 'challenge' para reto
  area: null,                // null = para todos; 'lectura' = solo para esa área
  title: 'Título del módulo',
  subtitle: 'Módulo 5',
  desc: 'Descripción breve visible en el mapa.',
  duration: '45 min',
  xp: 150,                   // puntos que gana el estudiante al completar
  badge: null,               // nombre de insignia de BADGES, o null
  req: ['ch2'],              // IDs de módulos que deben completarse antes
  pos: { x: 42, y: 10 },    // posición en el mapa (x: 0-100, y: número de fila)
  side: 'right',             // 'right', 'left' o 'center'
  content: [
    { type:'intro', title:'Introducción', text:'...' },
    { type:'concepts', title:'Conceptos', items:[
      { t:'Concepto 1', d:'Descripción...' },
    ]},
  ]
}
```

**2.** Guarda, commit y push.

---

## Prueba de carga paso a paso

Antes de abrir la plataforma a los 200 docentes, valida que Supabase aguanta la concurrencia. El plan es: **5 → 20 → 50 → 100 usuarios simultáneos**.

### Preparación (una sola vez)

**Paso 1 — Generar cuentas de prueba**

```cmd
node scripts/generar-usuarios-prueba.js
```

Esto crea el archivo `scripts/usuarios-prueba.csv` con 50 docentes de prueba.

**Paso 2 — Importar en la plataforma**

1. Entra como admin en https://experia-app.pages.dev
2. Ve a **Usuarios → Carga masiva**
3. Sube el archivo `scripts/usuarios-prueba.csv`
4. Confirma que se crearon los 50 usuarios en Supabase → Authentication → Users

---

### Ejecutar las pruebas por rampas

Abre tu terminal y ejecuta cada oleada, esperando que la anterior termine antes de pasar a la siguiente:

**Oleada 1 — 5 usuarios (calentamiento)**
```cmd
node scripts/stress-test.js 5
```
✅ Espera: todos exitosos, tiempo promedio < 1.5s

**Oleada 2 — 20 usuarios**
```cmd
node scripts/stress-test.js 20
```
✅ Espera: todos exitosos, tiempo promedio < 2s

**Oleada 3 — 50 usuarios**
```cmd
node scripts/stress-test.js 50
```
✅ Espera: todos exitosos, tiempo promedio < 3s

**Oleada 4 — 100 usuarios (si el plan Supabase lo permite)**
```cmd
node scripts/stress-test.js 100
```

---

### Qué monitorear durante cada prueba

Abre estas dos ventanas en paralelo mientras corre el script:

**Supabase — en tiempo real:**
- Supabase → tu proyecto → **Reports → API**: requests/segundo y latencia
- Supabase → **Reports → Database**: queries lentas (slow queries > 1s = problema)

**Cloudflare — tiempo de carga del frontend:**
- Cloudflare → Workers & Pages → experia-app → **Metrics**

---

### Interpretar los resultados

| Resultado | Diagnóstico | Acción |
|-----------|-------------|--------|
| Todos OK, < 2s promedio | ✅ Listo para producción | Continúa con la siguiente oleada |
| Todos OK, 2–5s promedio | ⚠️ Lento pero funcional | Revisar slow queries en Supabase Reports |
| Errores de autenticación (401) | ❌ Límite de conexiones | Plan Free de Supabase; considera Pro |
| Errores de red / timeout | ❌ Saturación | Reducir concurrentes o revisar RLS policies |
| Tiempo > 5s | ❌ Inaceptable para usuarios | Agregar índices o simplificar queries |

---

### Después de la prueba: limpiar usuarios de prueba

Para no contaminar la base de datos de producción, elimina los usuarios de prueba desde Supabase:

```sql
-- SQL Editor en Supabase
DELETE FROM auth.users
WHERE email LIKE '%@prueba.com';
```

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

- [ ] Ejecutar `0049_analytics_rpcs.sql` en Supabase (sin esto la pantalla de análisis de ítems abre vacía)
- [ ] Migrar `InstructorStats` y `AdminAnalytics` a las RPC de `0049` — hoy calculan en el navegador sobre 300 filas de toda la plataforma
- [ ] Informe posterior a la clase en vivo: `live_answers` es la mejor muestra para discriminación (30 personas, misma pregunta) y hoy se descarta al terminar
- [ ] Definir retención de datos: intentos + respuestas por ítem, y PII de `live_participants`
- [ ] Agregar `deleteAccount` conectado a Supabase Auth
- [ ] Prueba de carga: 5 → 20 → 50 → 200 usuarios simultáneos
- [ ] Sentry para monitoreo de errores en producción

---

*Stack: Vite + React 18 · Cloudflare Pages · Supabase Pro (Postgres + Auth + RLS + Edge Functions)*
*Versión: v12 · 3 roles · instituciones · carga masiva · historial de versiones*
