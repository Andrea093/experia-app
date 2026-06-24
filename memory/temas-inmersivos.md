---
name: temas-inmersivos
description: Cómo funcionan los temas inmersivos por curso (detective, escape-room, lab, time-travel) y sus limitaciones
metadata:
  type: project
---

Experia tiene 4 temas inmersivos por curso, activados por la columna `courses.theme`:
`detective` (Lenguaje), `escape-room` (Matemáticas), `lab` (Ciencias Naturales),
`time-travel` (Ciencias Sociales). Cada uno tiene un componente `*Ambient.jsx` montado
en [app.jsx](src/app.jsx) que se renderiza solo si `theme` coincide. Celebración temática
en [ThemeCelebration.jsx](src/components/ThemeCelebration.jsx).

Los seeds viven en `supabase/migrations/0013`-`0016` y se corren **a mano** en el SQL Editor
de Supabase (Cloudflare solo despliega el frontend con git push; las migraciones NO son
automáticas). Plantilla canónica de seed correcta: **0013** (detective). Estado puesto en
producción en junio 2026: los 4 cursos activos con 9 módulos cada uno.

**Contrato real de `course_modules`** (definido en 0007 + 0011): id uuid auto, columnas
`"order"`, `is_enabled`, `area_id`, `challenge_type`, `challenge_data`. El frontend
([store.jsx](src/store/store.jsx) `dbModToAppMod`) espera formas específicas:
- dragdrop → `challenge_data.dragItems` = array de **strings** en orden correcto
- empathy → `empathyCards` = `[{id,text,correct}]`, correct ∈ `piensa|siente|dice|hace`
- matching → `matchPairs` = `[{id,concept,def}]`
- lecciones: NO existe sección `heading`; `steps`/`reveal` usan `t`/`d`; imágenes usan `url`

**Limitación conocida**: el reto `simulation` SIEMPRE renderiza un árbol genérico interno
(`SIM_TREE` en [challenges.jsx](src/pages/challenges.jsx)) — el store no reenvía el contenido
de simulación del DB, así que el contexto/pasos temáticos se guardan pero no se muestran.
Aplica a los 4 cursos. Arreglarlo requiere extender store.jsx + challenges.jsx.
