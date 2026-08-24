# Agente IA de planes de estudio — EN PAUSA

> **Estado: pausado el 2026-08-21.** La infraestructura de base de datos quedó
> aplicada y verificada en producción. Falta el corpus y el pipeline de ingesta.
> Este documento es el punto de retome: no hace falta reconstruir el contexto.

Feature: un agente que genera planes de estudio (pensums) personalizados dentro
de Experia, fundamentados en normativa colombiana (Ley 115, Decreto 1075 Libro 2
Parte 3, Decreto 1850, DBA, EBC) y con cada afirmación citada y verificable.

Arquitectura decidida: LangGraph (retrieval → generación → validación), LiteLLM
para routing multi-proveedor, pgvector en el mismo proyecto Supabase, y cuatro
anillos de contención de alucinaciones. **No hay fine-tuning**: el "entrenamiento"
es corpus + prompt + evals.

---

## 1. Qué quedó APLICADO en producción ✅

Verificado el 2026-08-20 con el diagnóstico de `scripts/verificar_0055_0057.sql`
(bloque `[0]`): **18/18 chequeos en OK**.

| Migración | Qué dejó |
|---|---|
| `0055_habilitar_pgvector.sql` | Extensión `vector` en el schema `extensions` |
| `0056_corpus_normativo.sql` | Schema `corpus` + tabla `normativo` (vacía) + índice HNSW + RPC `buscar_corpus` |
| `0057_planes_estudio.sql` | `institution_academic_profiles` + `planes_estudio` + `validar_citas_plan` |

Las tres son aditivas: no tocan ninguna tabla preexistente.

**Punto de retorno:** `scripts/rollback_0055_0057.sql` (destructivo, leer antes).
Existe porque el proyecto está en plan free y no hubo backup al aplicarlas.

---

## 2. Qué quedó ESCRITO y PROBADO pero SIN APLICAR ⏳

Ambas pasan el arnés local (`scripts/test-migraciones/`), pero **nadie las ha
corrido en el SQL Editor**:

- **`0058_bucket_corpus_normativo.sql`** — bucket privado `corpus-normativo`
  (solo PDF, 50 MB, lectura para autenticados, escritura solo `service_role`).
  Sin esto no se pueden subir los documentos.
- **`0059_efectividad_conteos_no_superan_total.sql`** — *no es del agente*, pero
  quedó pendiente en la misma sesión: impide que A+B+C+D de una pregunta supere
  el total de estudiantes de su sección en `clone_effectiveness`. Hoy esa regla
  solo vive en el navegador y se puede saltar. Incluye un `select` final que
  lista las filas ya guardadas que la violan.

Al aplicar `0058`, correr después el bloque `[0]` de
`scripts/verificar_0055_0057.sql` — tiene los chequeos 19–21 para el bucket.

---

## 3. Qué NO existe todavía ⬜

1. **Los PDF en el bucket.** Inventario listo en
   `scripts/data/inventario-corpus.csv` (21 documentos, con la ruta de destino
   ya definida). La columna `url_oficial` está vacía a propósito: hay que
   verificar en la fuente que cada documento sea la versión vigente.
   Instrucciones de subida en `scripts/data/INVENTARIO-CORPUS.md`.
2. **El script de ingesta** (extracción → troceado → embeddings → carga).
   No hay una sola línea escrita.
3. **El grafo LangGraph y la Edge Function** que lo expone.
4. **El golden dataset** de retrieval (25 consultas) y el de salidas (10–15
   pensums reales anonimizados, con consentimiento — Ley 1581).

---

## 4. Decisiones abiertas — resolver ANTES de retomar

**a) Node o Python para el pipeline de ingesta.**
El plan original asumía PyMuPDF, pero **Python no está instalado en la máquina
de desarrollo**. Recomendación: Node, porque el resto del repo ya lo es y evita
mantener un segundo runtime.

**b) Confirmar el modelo de embeddings.**
Está asumido voyage-3 (1024 dims), grabado en la columna `vector(1024)` y en el
índice HNSW. Cambiarlo después obliga a re-embeber todo el corpus y migrar la
columna.

> ⚠️ **Este es el momento barato para cambiarlo.** Con el corpus vacío, probar
> otro modelo de embeddings cuesta minutos. Con 30.000 fragmentos cargados es
> una operación que hay que planear. Si hay alguna duda sobre voyage-3,
> resolverla ahora — no después.

**c) Llaves que hacen falta y no están puestas:** la de Voyage AI (embeddings) y
la `service_role` de Supabase para el script de carga. Ambas solo en variables
de entorno del backend, nunca en el frontend.

---

## 5. Cómo retomar

```bash
# 1. Confirmar que lo aplicado sigue sano (arnés local, no toca Supabase)
cd "scripts/test-migraciones"
npm install
node run.mjs              # corpus + multi-tenant: 41 chequeos
node run-efectividad.mjs  # regla de 0059: 12 chequeos
```

Después: aplicar `0058` en el SQL Editor → subir los tres documentos **P0** al
bucket → escribir el script de ingesta.

**La CLI de Supabase no sirve en este repo.** No hay `supabase/config.toml`, así
que `supabase db diff --linked` y `db push` fallan con *"Cannot find project
ref"* pese a existir `.temp/linked-project.json`. Las migraciones se corren a
mano en el SQL Editor; el arnés PGlite es lo que permite probarlas antes.

---

## 6. Cosas que se olvidan y cuestan caro

- **El conocimiento va al corpus, nunca al prompt.** Si los documentos se pegan
  en la conversación, no hay cita verificable, `validar_citas_plan` no puede
  comprobar nada y se cae el modelo entero de contención.
- **La calidad depende del troceado, no del modelo.** Si el `Recall@8` no llega
  al 90 %, la corrección va al chunking (Fase 3), no al modelo de embeddings ni
  al generador. Es la trampa más común.
- **`buscar_corpus` es `security invoker`.** Llamarla con el JWT del docente
  aplica RLS; con `service_role` la bypasea. Para retrieval, usar el JWT.
- **Nunca probar con datos reales de menores** (Ley 1581). Datos sintéticos en
  desarrollo, como en `scripts/test-migraciones/seed.sql`.

---

## 7. Mapa de archivos

| Archivo | Qué es |
|---|---|
| `supabase/migrations/0055`–`0059` | Las migraciones (0055–0057 aplicadas; 0058–0059 no) |
| `scripts/verificar_0055_0057.sql` | Diagnóstico de 21 chequeos para correr en el SQL Editor |
| `scripts/rollback_0055_0057.sql` | Deshacer (destructivo) |
| `scripts/test-migraciones/` | Arnés PGlite: aplica y prueba las migraciones sin tocar Supabase |
| `scripts/data/inventario-corpus.csv` | Los 21 documentos con su ruta de destino |
| `scripts/data/INVENTARIO-CORPUS.md` | Cómo y dónde subir los PDF |
