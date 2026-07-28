# Plan — Analítica de resultados de pruebas

> Estado al **2026-07-28**: **Fases 1–4 implementadas.** `0048` ya está corrida en
> producción (verificado). Queda **ejecutar `0049_analytics_rpcs.sql`** en el SQL Editor;
> sin ella la pantalla "Análisis de ítems" carga pero no devuelve datos.
> Fase 5 (clases en vivo) sin empezar.
> Escrito el 2026-07-27 tras revisar el código real.
> Objetivo: que el análisis de respuestas sea el diferencial de Experia, no un tablero decorativo.

> ⚠️ **Lección de la Fase 1.** El código de captura se desplegó antes de correr `0048`, y
> como `recordAttempt` inserta `course_id`/`module_id`, PostgREST rechazaba el insert
> completo: durante un día no se guardó **ningún** intento, en silencio (el error solo iba a
> `console.error` y el store actualiza el estado local de forma optimista). Cuando una
> migración y su código viajan juntos, **la migración va primero**.

---

## 1. Por qué

CEINFES forma docentes en **Diseño Centrado en Evidencias**: cómo construir pruebas que midan lo
que dicen medir. La plataforma debería aplicarse a sí misma ese estándar y devolverle al
instructor evidencia sobre *sus propias pruebas*. Hoy no lo hace: los datos se capturan a medias,
se archivan con una taxonomía obsoleta y se leen truncados.

**El norte de este plan: análisis de ítems.** No "más gráficas".

---

## 2. Diagnóstico (verificado en código, 2026-07-27)

### Lo que ya existe y funciona

| Pantalla | Qué muestra |
|---|---|
| `src/pages/InstructorStats.jsx` | **Sí hace análisis por pregunta**: las 10 preguntas más difíciles y, por reto, el % de acierto de cada pregunta ordenado de peor a mejor |
| `src/pages/AdminAnalytics.jsx` | KPIs globales, dona de estado de entregas, completitud por área e institución. **Nada por pregunta** |
| `src/pages/InstructorStudentView.jsx` → `StudentProgressModal` | Por estudiante: % por reto, intentos de quiz (`quiz_attempts`) |

La capacidad de análisis por pregunta **ya está construida**. El problema está debajo.

### Los cinco problemas de fondo

**P1 · Solo se guarda el primer intento.**
`recordAttempt` (`src/store/store.jsx`, ~línea 683) descarta el intento si ya existe uno de ese
estudiante para ese reto:

```js
if (s.challengeAttempts.some(a => a.studentEmail === s.user.email && a.challengeId === challengeId)) return;
```

Los reintentos y la mejora no existen en los datos. En una plataforma formativa eso borra
justamente lo que importa: el aprendizaje ocurre entre el intento 1 y el 2.

**P2 · La analítica se organiza por ÁREA, no por CURSO.**
`challenge_attempts` no tiene columna de curso (esquema en `0001_init.sql`):

```sql
create table public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id text, area text,
  questions jsonb, score int, max_score int,
  created_at timestamptz default now()
);
```

`recordAttempt` guarda `area: s.selectedArea`, que en el mundo multi-curso suele venir vacío, e
`InstructorStats` filtra por las 5 áreas heredadas. Los datos existen pero están archivados con
una taxonomía que ya no corresponde a cómo funcionan los cursos. **Probablemente la causa
principal de la sensación de "no vemos las respuestas".**

**P3 · La muestra está truncada y no se avisa.**
`src/lib/sessionData.js` (~línea 26):

```js
supabase.from('challenge_attempts').select('*')
  .gte('created_at', since)          // últimos 30 días
  .order('created_at', { ascending: false }).limit(300)
```

300 filas de **toda la plataforma**, no del instructor. Con varios colegios activos las
estadísticas se calculan sobre un pedazo arbitrario y se presentan como si fueran el total.
No es solo incompleto: es engañoso.

**P4 · Los quizzes dejan menos rastro que los retos viejos.**
`quiz_attempts` (migración 0045) es una tabla agregada — PK `(user_id, module_id)` con contador,
`passed`, `best_score`, `best_max`. **No guarda las respuestas ni un registro por intento.**
Las pruebas tipo quiz, que son el corazón de lo que se enseña a diseñar, son las que menos
evidencia dejan.

**P5 · Las preguntas se agregan por su texto.**
En `InstructorStats` la clave de agregación es el enunciado literal (`qMap[q.q]`). Si el
instructor corrige una tilde, el ítem se parte en dos y el histórico se rompe.
**Sin id estable por pregunta no hay análisis longitudinal.**

**P6 · (bonus) Las clases en vivo no alimentan nada.**
`live_answers` solo se lee durante la sesión para la barra de distribución
(`fetchAnswerCounts` en `src/lib/liveClient.js`). Al terminar, la evidencia se evapora.

---

## 3. El norte: análisis de ítems

Lo que un instructor debería poder abrir después de aplicar una prueba:

| Métrica | Qué responde | Estado |
|---|---|---|
| **Dificultad** (`p` = % de acierto) | ¿Qué tan duro fue el ítem? | Ya se calcula; falta nombrarlo bien y persistirlo |
| **Discriminación** (`D`) | ¿El ítem separa a quien sabe de quien no? | **No existe. Es el diferencial.** |
| **Análisis de distractores** | ¿Qué opción incorrecta atrajo a los mejores? | No existe (no se guarda la opción elegida en retos) |
| **Evolución intento 1 → 2** | ¿Aprendieron tras fallar? | Imposible hoy (P1) |

`D` clásico = (% de acierto del cuartil superior) − (% del cuartil inferior). Un ítem con `D`
negativo está mal construido: los que más saben lo fallan más. Ese es el hallazgo que ningún
competidor les va a dar y que además **es el contenido del propio curso de DCE**.

---

## 4. Fase 1 — Arreglar la captura (lo más importante y lo menos vistoso)

> Sin datos correctos cualquier tablero miente. Si se empieza por las gráficas, en tres meses
> habrá gráficas bonitas sobre datos parciales.

### 4.1 Migración `0048_analytics_capture.sql`

```sql
-- Contexto de curso y número de intento en cada registro
alter table public.challenge_attempts
  add column if not exists course_id  uuid references public.courses(id) on delete set null,
  add column if not exists module_id  uuid references public.course_modules(id) on delete set null,
  add column if not exists attempt_no int not null default 1;

create index if not exists idx_attempts_course on public.challenge_attempts(course_id, created_at desc);
create index if not exists idx_attempts_module on public.challenge_attempts(module_id, created_at desc);

-- Registro por intento de quiz (quiz_attempts sigue siendo el agregado)
create table if not exists public.quiz_attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  module_id   uuid not null references public.course_modules(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete set null,
  attempt_no  int  not null,
  item_id     text not null,        -- id estable de la pregunta (ver 4.3)
  item_index  int,                  -- posición en el quiz al momento de responder
  chosen      int,                  -- índice de la opción elegida (null = sin responder)
  correct     boolean not null,
  time_ms     int,
  created_at  timestamptz not null default now()
);

create index if not exists idx_qaa_module on public.quiz_attempt_answers(module_id, item_id);
create index if not exists idx_qaa_user   on public.quiz_attempt_answers(user_id, module_id);

alter table public.quiz_attempt_answers enable row level security;

-- El estudiante escribe y lee lo suyo; instructor/admin leen todo.
drop policy if exists qaa_insert_own on public.quiz_attempt_answers;
create policy qaa_insert_own on public.quiz_attempt_answers
  for insert with check (user_id = auth.uid());

drop policy if exists qaa_read on public.quiz_attempt_answers;
create policy qaa_read on public.quiz_attempt_answers
  for select using (user_id = auth.uid() or public.is_instructor() or public.is_admin());
```

> ⚠️ Verificar antes de correr: que `is_instructor()` / `is_admin()` existan con esos nombres
> (se usan en migraciones previas) y que no haya una constraint única en `challenge_attempts`
> que impida varios intentos (según `0001_init.sql` **no la hay**).

### 4.2 Guardar todos los intentos

En `recordAttempt` (`store.jsx`):

- **Quitar el `return` temprano** que descarta el segundo intento.
- Calcular `attempt_no` = intentos previos de ese reto + 1.
- Guardar `course_id: s.enrolledCourseId` y `module_id` cuando el reto venga de `course_modules`.
- Mantener `area` por compatibilidad con lo viejo, pero **dejar de usarla para segmentar**.

Impacto colateral a revisar: `InstructorStudentView` muestra `att.score/att.maxScore` asumiendo
un intento por reto. Con varios, debe mostrar el **mejor** o el **último** (decidir; sugerido:
último, con el mejor entre paréntesis).

### 4.3 Id estable por pregunta

El editor (`route-editor/QuizCreatorModal.jsx`) debe asignar un `id` a cada pregunta al crearla
y conservarlo al editar el texto:

```js
// al agregar una pregunta nueva
{ id: crypto.randomUUID().slice(0, 8), question: '', options: [], correct: 0 }
```

Para lo ya existente: al abrir un quiz sin ids, generarlos y guardar. La agregación usa
`item_id = q.id ?? hash(q.question)` como puente durante la transición.

### 4.4 Guardar respuestas de quiz

Donde hoy se llama `recordQuizAttempt` (challenges.jsx), insertar además una fila por pregunta en
`quiz_attempt_answers` con la opción elegida. **Esto es lo que habilita el análisis de
distractores**, que es la mitad del valor del punto 3.

---

## 5. Fase 2 — Leer agregado en el servidor ✅ (`0049_analytics_rpcs.sql`)

Hoy se traen 300 filas al navegador y se calcula ahí. No escala y ya está truncando.

**Implementado.** `0049` agrega cinco funciones (todas `security definer`, todas exigen
instructor/admin y acotan los estudiantes con `analytics_visible_students()`, mismo criterio
de institución que `0029`):

| Función | Para qué |
|---|---|
| `analytics_visible_students()` | Alcance: qué estudiantes puede agregar quien llama |
| `analytics_module_answers(module)` | Respuestas normalizadas — une `quiz_attempt_answers` con el legado de `challenge_attempts.questions` |
| `item_analysis(module, min_n)` | Dificultad, D, punto-biserial, distractores y recuperación |
| `analytics_course_modules(course)` | Qué retos del curso tienen datos, con n y rango de fechas |
| `analytics_raw_answers(module)` | Filas crudas por estudiante/ítem para exportar |

Decisiones que importan:
- **Todo se calcula sobre el PRIMER intento.** Mezclar reintentos infla la dificultad y
  destruye la discriminación (quien repite ya vio la respuesta). La evolución 1→2 se
  reporta aparte en `retry_recovery`.
- Se añadió la **correlación punto-biserial corregida** (el total excluye el propio ítem)
  además de `D`: con muestras chicas es más estable que la resta de cuartiles.
- `D` y `r_pb` vuelven **`NULL`** bajo `min_n` (10 por defecto) — nunca un `0` que parezca
  un hallazgo.
- El legado de `challenge_attempts` solo se usa si el módulo aún no tiene datos del formato
  nuevo, para no contar dos veces el mismo intento. Da dificultad y discriminación, pero no
  distractores (no se guardaba la opción elegida).
- ⚠️ Las columnas de `RETURNS TABLE` son parámetros OUT visibles en el cuerpo: toda
  referencia a `student_id`/`item_id`/`correct`… va **calificada**, o la función falla por
  ambigüedad. Al editar estas RPC, mantener esa disciplina.

RPC original sugerida en el plan:

```sql
-- Análisis de ítems de un módulo: dificultad, discriminación y distractores
create or replace function public.item_analysis(p_module_id uuid)
returns table (
  item_id text, item_text text, n int,
  p_value numeric,          -- dificultad (0..1)
  discrimination numeric,   -- D = p(cuartil alto) - p(cuartil bajo)
  distractors jsonb         -- [{opcion, n, pct, pct_cuartil_alto}]
) language sql security definer set search_path = public as $$ ... $$;
```

Reglas:
- Solo instructor/admin, y acotado a su institución (mismo criterio que `0029`).
- Devolver también `n` para poder ocultar métricas con muestra insuficiente (< 10 respuestas
  la discriminación no significa nada — **mostrarlo como "muestra insuficiente", no como 0**).

---

## 6. Fase 3 — Pantalla de análisis de ítems ✅ (`src/pages/InstructorItemAnalysis.jsx`)

**Implementada** como página propia (`instructor-items`), en el sidebar de instructor y de
admin como "Análisis de ítems". Selector colegio → curso → reto; los cursos incluyen los
**forks por colegio**, porque los intentos de esos estudiantes caen en los `module_id` del
fork, no del curso original. Los 5 puntos de abajo están cubiertos, incluida la cabecera con
la muestra y el "muestra insuficiente" en vez de un número inventado.

Diseño original:

1. **Selector**: curso → módulo (quiz/reto). Ya no por área.
2. **Tabla de ítems** ordenada por discriminación ascendente (lo peor primero), con:
   `dificultad`, `D`, `n`, y semáforo — rojo si `D < 0.1`, ámbar `0.1–0.2`, verde `> 0.2`.
3. **Detalle de ítem**: enunciado, cada opción con % de elección y **cuántos del cuartil alto la
   eligieron**. Ahí se ve el distractor que está funcionando como trampa legítima o como error
   de redacción.
4. **Evolución intento 1 → 2** por ítem (habilitado por 4.2).
5. Cabecera honesta: "calculado sobre N intentos entre <fecha> y <fecha>". Nunca volver a mostrar
   una métrica sin decir sobre qué muestra se calculó.

---

## 7. Fase 4 — Exportación ✅ (parcial)

`xlsx` **ya está en el bundle** (`vendor-xlsx`, se usa para importar usuarios). Reutilizarlo:

- ✅ Respuestas crudas por estudiante/ítem (para quien quiera hacer su propio análisis).
- ✅ Tabla de análisis de ítems.
- ⬜ Resultados de una clase en vivo — depende de la Fase 5.

Ambos botones viven en la cabecera de la pantalla de análisis y cargan `xlsx` con
`await import('xlsx')`, así que no engordan el chunk de la página.

---

## 8. Fase 5 — Sumar las clases en vivo

`live_answers` ya guarda respuesta, tiempo y puntaje por participante y pregunta. Es la misma
pregunta respondida por 30 personas a la vez: **la mejor muestra para calcular discriminación**.

- RPC de informe posterior a la sesión (solo el host).
- Alimentar la misma pantalla de análisis de ítems, marcando el origen (`en vivo` / `autodirigido`).
- Requiere resolver el puente de identidad: en el PIN anónimo no hay `profiles`, pero
  `join_live_session` **ya guarda `auth.uid()` cuando la persona está autenticada** — hoy el
  frontend no lo aprovecha.

---

## 9. Riesgos y decisiones abiertas

| Riesgo | Nota |
|---|---|
| **Volumen** | Guardar todos los intentos + una fila por respuesta multiplica las filas. Con los volúmenes actuales no es problema; revisar a los 6 meses y definir retención. |
| **Muestra pequeña** | La discriminación con < 10 respuestas es ruido. Decidir el umbral y **ocultar**, no mostrar un número sin sentido. |
| **Privacidad** | El análisis por ítem es agregado; el detalle por estudiante ya existe y está bajo RLS. Definir si el instructor puede ver quién eligió cada distractor (útil pedagógicamente, sensible si se expone mal). |
| **`area` heredada** | No borrarla todavía: hay datos históricos. Dejar de usarla para segmentar y marcarla como obsoleta en `CLAUDE.md`. |
| **Retención de PII en vivo** | `live_participants` acumula nombre y correo por sesión sin política de borrado. Decidir plazo. |

---

## 10. Checklist de verificación (al implementar)

- [ ] Un reto respondido dos veces genera **dos** filas en `challenge_attempts` con `attempt_no` 1 y 2.
- [ ] Las filas nuevas traen `course_id` y `module_id` poblados.
- [ ] Editar el texto de una pregunta **no** parte su histórico (mismo `item_id`).
- [ ] Un quiz de 5 preguntas genera 5 filas en `quiz_attempt_answers` con la opción elegida.
- [ ] La pantalla dice sobre cuántos intentos y en qué rango de fechas calculó.
- [ ] Un ítem con `n < umbral` muestra "muestra insuficiente", no `D = 0`.
- [ ] El instructor solo ve datos de su institución (probar con dos instituciones).
- [ ] El curso de DCE en producción sigue funcionando igual (no depende de nada de esto).

---

## 11. Estado de las migraciones

Al 2026-07-28:

- **`0046_avatar_config.sql`** — corrida.
- **`0047_live_session_cleanup.sql`** — corrida.
- **`0048_analytics_capture.sql`** — corrida (verificado contra la base: existen
  `quiz_attempt_answers` y las columnas nuevas de `challenge_attempts`).
- **`0049_analytics_rpcs.sql`** — ⬜ **pendiente de ejecutar.** Hasta que se corra, la pantalla
  de análisis de ítems abre pero cada consulta devuelve error de función inexistente.
  Esta migración es **solo de lectura** (crea funciones, no toca datos), así que a diferencia
  de `0048` desplegar el frontend antes no rompe nada: la pantalla simplemente no muestra datos.

---

## 12. Orden recomendado

1. ✅ Fase 1 (captura) — sin esto lo demás miente.
2. ✅ Fase 2 (lectura agregada) — sin esto no escala.
3. ✅ Fase 3 (pantalla) — el valor visible.
4. ✅ Fase 4 (exportación) — barato, muy pedido. *(falta el export de clase en vivo)*
5. ⬜ Fase 5 (clases en vivo) — cierra el círculo.

**Lo que sigue, en orden:**
1. Correr `0049` y probar la pantalla con un reto que ya tenga respuestas.
2. Fase 5: informe posterior a la clase en vivo. `live_answers` ya guarda respuesta, tiempo y
   puntaje: son 30 personas respondiendo la misma pregunta a la vez, la mejor muestra posible
   para discriminación. Falta el puente de identidad (§8) y decidir el borrado de PII de
   `live_participants` (§9).
3. Pendiente menor de la Fase 2: `sessionData.js` sigue trayendo 300 filas de toda la
   plataforma para `InstructorStats`. Esa pantalla no se tocó; ahora que existe la agregación
   en servidor, migrarla es el siguiente paso natural.
