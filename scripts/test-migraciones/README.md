# Pruebas de migraciones (0055–0057) sin tocar Supabase

Aplica las migraciones del agente de planes de estudio sobre un **Postgres real
con pgvector** que corre dentro de Node (PGlite = Postgres compilado a WASM), y
verifica RLS, aislamiento multi-tenant y la validación de citas.

Existe porque en este repo **no se puede usar la CLI de Supabase**: no hay
`supabase/config.toml`, así que `supabase db diff --linked` y `db push` fallan
con *"Cannot find project ref"* pese a existir `.temp/linked-project.json`. Las
migraciones se corren a mano en el SQL Editor (ver CLAUDE.md), y esto es lo que
permite probarlas **antes** de hacerlo.

## Correr

```bash
cd "scripts/test-migraciones"
npm install
node run.mjs
```

Sale con código 0 si todo pasa. Tarda ~10 s.

## Qué prueba

| Bloque | Qué comprueba |
|---|---|
| Aplicación | Las tres migraciones aplican sin error en orden |
| Idempotencia | Correrlas dos veces no rompe nada |
| Estructura | `vector` en `extensions`, índice HNSW, policies, grants, defaults de UUID |
| Aislamiento RLS | T1–T5: dos colegios, dos instructores, un estudiante y un admin — ninguno cruza al otro; el corpus es de solo lectura para todos |
| Validación de citas | T6: `validar_citas_plan` detecta la cita derogada y la inventada, y acepta la vigente |
| RPC | T7–T8: `buscar_corpus` responde y sus filtros de área/grado/tema funcionan |

Las dos ramas de pertenencia institucional están cubiertas a propósito: el
instructor A pertenece por `instructor_institutions` y el B por
`profiles.institution_id` — son las dos mitades del `OR` de las policies, y una
sola de ellas no probaría la otra.

## Qué NO prueba

- **Calidad del retrieval.** Los embeddings del seed son sintéticos; el
  `Recall@8 ≥ 90%` de la Fase 5 se mide contra el corpus real.
- **Diferencias entre PGlite y Supabase.** PGlite no trae GoTrue, PostgREST ni
  los roles de Supabase: `prelude.sql` los emula (roles `anon`/`authenticated`/
  `service_role`, `auth.users`, `auth.uid()`, `is_admin()`, `is_instructor()`,
  y los grants por defecto sobre `public` y `extensions`). Si Supabase cambia
  esos defaults, aquí no se notaría.

## Archivos

- `prelude.sql` — arnés: lo que Supabase ya trae + lo que crean `0001` y `0005`.
  **No es una migración**; nunca se aplica al proyecto real.
- `seed.sql` — datos sintéticos. Nunca datos reales de menores (Ley 1581).
- `run.mjs` — aplica y verifica.

---

# Segunda suite: `run-efectividad.mjs` (migración 0059)

```bash
node run-efectividad.mjs
```

Prueba la regla de que los conteos A+B+C+D de una pregunta no pueden superar el
total de estudiantes de su sección. Usa `prelude-clone.sql` (stub de
`clone_groups` / `clone_attendance` / `clone_effectiveness` según 0051 y 0054),
no el `prelude.sql` de la suite del corpus — son dominios distintos.

Cubre los dos lados de la regla: que el exceso se bloquee (insert y update, en
ambas secciones, nombrando la pregunta), y que lo legítimo siga pasando
(borradores a medias, preguntas no aplicadas, secciones sin total, basura no
numérica en el jsonb).
