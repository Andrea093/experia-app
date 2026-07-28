-- ============================================================
-- 0049: Análisis de ítems en el servidor (Fase 2 del plan de analítica)
--
-- Hasta ahora la estadística se calculaba en el navegador sobre 300 filas
-- traídas de TODA la plataforma (sessionData.js): una muestra arbitraria
-- presentada como si fuera el total. Estas RPC agregan en la base, acotadas a
-- los estudiantes que el instructor puede ver, y devuelven el tamaño de la
-- muestra para que la pantalla nunca muestre una métrica sin decir sobre qué
-- se calculó.
--
-- Métricas (ver §3 del plan):
--   • dificultad p    = % de acierto en el PRIMER intento
--   • discriminación D = p(cuartil alto) − p(cuartil bajo)
--   • r_pb            = correlación punto-biserial ítem–total (corregida:
--                       el total excluye el propio ítem)
--   • distractores    = qué opción incorrecta eligió cada quién
--   • recuperación    = de los que fallaron en el intento 1, cuántos acertaron
--                       después
--
-- ⚠️ Todo se calcula sobre el PRIMER intento. Mezclar reintentos infla la
-- dificultad y destruye la discriminación (quien repite ya vio la respuesta).
-- La evolución entre intentos se reporta aparte, en `retry_recovery`.
--
-- Requiere 0048. Aditiva e idempotente.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- ── [1] Alcance: qué estudiantes puede agregar quien llama ──────────────────
-- Mismo criterio que 0029 para perfiles: el admin ve todo; el instructor ve su
-- institución (instructor_institutions, con el institution_id del perfil como
-- respaldo). Un instructor SIN institución asignada ve todo, igual que en la
-- política de perfiles de 0029 — no se endurece aquí para no cambiar en
-- silencio lo que hoy ve un tutor legítimamente configurado así.
create or replace function public.analytics_visible_students()
returns table (student_id uuid)
language sql stable security definer set search_path = public as $$
  with mine as (
    select ii.institution_id from public.instructor_institutions ii
     where ii.instructor_id = auth.uid()
    union
    select pr.institution_id from public.profiles pr
     where pr.id = auth.uid() and pr.institution_id is not null
  )
  select p.id
    from public.profiles p
   where public.is_admin()
      or (public.is_instructor()
          and (not exists (select 1 from mine)
               or p.institution_id in (select institution_id from mine)));
$$;

grant execute on function public.analytics_visible_students() to authenticated;

-- Texto de cada pregunta tal como está HOY en el módulo. El histórico se
-- agrupa por `item_id` (0048), así que corregir una tilde ya no parte el ítem:
-- solo cambia la etiqueta con la que se muestra.
create or replace function public.analytics_item_texts(p_module_id uuid)
returns table (item_id text, item_index int, item_text text, options jsonb)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(q->>'id', ''), 'legacy-' || (o.ord - 1)::text),
         (o.ord - 1)::int,
         q->>'question',
         coalesce(q->'options', '[]'::jsonb)
    from public.course_modules cm,
         lateral jsonb_array_elements(coalesce(cm.challenge_data->'questions', '[]'::jsonb))
           with ordinality as o(q, ord)
   where cm.id = p_module_id;
$$;

-- ── [2] Respuestas normalizadas de un módulo ────────────────────────────────
-- Dos orígenes:
--   • quiz_attempt_answers (0048) — una fila por ítem, CON la opción elegida.
--   • challenge_attempts.questions — el histórico y los retos que no son quiz
--     (dragdrop, matching, truefalse…). Trae acierto pero no la opción, así
--     que da dificultad y discriminación, no distractores.
-- El legado solo se usa si el módulo todavía no tiene datos del formato nuevo,
-- para no contar dos veces el mismo intento.
create or replace function public.analytics_module_answers(p_module_id uuid)
returns table (
  student_id uuid, attempt_no int, item_id text, item_index int,
  chosen int, correct boolean, answered_at timestamptz
)
language sql stable security definer set search_path = public as $$
  -- ⚠️ Las columnas de RETURNS TABLE son parámetros OUT visibles dentro del
  -- cuerpo: cualquier referencia SIN calificar a student_id / item_id / correct…
  -- sería ambigua y la función falla. Todo va calificado a propósito.
  with visible as (select v.student_id as sid from public.analytics_visible_students() v),
  qaa as (
    select a.user_id, a.attempt_no, a.item_id, a.item_index, a.chosen, a.correct, a.created_at
      from public.quiz_attempt_answers a
     where a.module_id = p_module_id
       and a.user_id in (select vv.sid from visible vv)
  ),
  legacy as (
    select ca.student_id, ca.attempt_no,
           'legacy-' || (o.ord - 1)::text, (o.ord - 1)::int,
           null::int, coalesce((o.q->>'correct')::boolean, false), ca.created_at
      from public.challenge_attempts ca,
           lateral jsonb_array_elements(coalesce(ca.questions, '[]'::jsonb))
             with ordinality as o(q, ord)
     where ca.module_id = p_module_id
       and ca.student_id in (select vv.sid from visible vv)
       and not exists (select 1 from qaa)
  )
  select * from qaa
  union all
  select * from legacy;
$$;

grant execute on function public.analytics_module_answers(uuid) to authenticated;

-- ── [3] Análisis de ítems ───────────────────────────────────────────────────
create or replace function public.item_analysis(p_module_id uuid, p_min_n int default 10)
returns table (
  item_id        text,
  item_index     int,
  item_text      text,
  n              int,        -- estudiantes con primer intento en este ítem
  p_value        numeric,    -- dificultad 0..1
  discrimination numeric,    -- D; null si n < p_min_n (muestra insuficiente)
  r_pb           numeric,    -- punto-biserial corregida; null si n < p_min_n
  distractors    jsonb,      -- [{chosen, text, n, pct, n_top, is_correct}]
  retry_n        int,        -- fallaron en el intento 1 y volvieron a intentar
  retry_recovery numeric,    -- de esos, cuántos acertaron después (0..1)
  has_choices    boolean     -- false = dato legado sin opción elegida
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_instructor() or public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  with answers as (select * from public.analytics_module_answers(p_module_id)),
  texts as (select * from public.analytics_item_texts(p_module_id)),
  correct_opt as (
    select coalesce(nullif(q->>'id', ''), 'legacy-' || (o.ord - 1)::text) as item_id,
           nullif(q->>'correct', '')::int as correct_index
      from public.course_modules cm,
           lateral jsonb_array_elements(coalesce(cm.challenge_data->'questions', '[]'::jsonb))
             with ordinality as o(q, ord)
     where cm.id = p_module_id
  ),
  -- Primer intento: la única base válida para dificultad y discriminación.
  first_att as (select * from answers a where a.attempt_no = 1),
  totals as (
    select f.student_id, sum(f.correct::int)::numeric as total
      from first_att f group by f.student_id
  ),
  -- Cuartiles por puntaje total. Con pocos estudiantes ntile deja cuartiles
  -- vacíos; por eso D se oculta bajo p_min_n en vez de devolver un 0 falso.
  ranked as (
    select t.student_id, t.total, ntile(4) over (order by t.total) as quartile
      from totals t
  ),
  joined as (
    select f.*, r.total, r.quartile
      from first_att f join ranked r on r.student_id = f.student_id
  ),
  per_item as (
    select j.item_id,
           min(j.item_index)                                        as item_index,
           count(*)::int                                            as n,
           avg(j.correct::int)::numeric                             as p_value,
           bool_or(j.chosen is not null)                            as has_choices,
           avg(j.correct::int) filter (where j.quartile = 4)        as p_top,
           avg(j.correct::int) filter (where j.quartile = 1)        as p_bottom,
           -- total corregido: se descuenta el propio ítem para que la
           -- correlación no se compare consigo misma.
           corr(j.correct::int::numeric, j.total - j.correct::int)  as r_pb
      from joined j group by j.item_id
  ),
  dist_real as (
    select d.item_id,
           jsonb_agg(jsonb_build_object(
             'chosen',     d.chosen,
             'text',       t.options->d.chosen,
             'n',          d.n,
             'pct',        round(d.n::numeric / nullif(d.item_n, 0), 4),
             'n_top',      d.n_top,
             'is_correct', (d.chosen = c.correct_index)
           ) order by d.n desc) as distractors
      from (
        select j.item_id, j.chosen,
               count(*)::int as n,
               count(*) filter (where j.quartile = 4)::int as n_top,
               sum(count(*)) over (partition by j.item_id) as item_n
          from joined j
         where j.chosen is not null
         group by j.item_id, j.chosen
      ) d
      left join texts t on t.item_id = d.item_id
      left join correct_opt c on c.item_id = d.item_id
     group by d.item_id
  ),
  -- Evolución 1 → 2: solo tiene sentido para quien falló la primera vez.
  failed_first as (select j.student_id, j.item_id from joined j where not j.correct),
  retry as (
    select ff.item_id,
           count(distinct ff.student_id)::int as retry_n,
           avg(case when ok.student_id is null then 0 else 1 end)::numeric as recovery
      from failed_first ff
      left join lateral (
        select distinct a.student_id from answers a
         where a.student_id = ff.student_id and a.item_id = ff.item_id
           and a.attempt_no > 1 and a.correct
      ) ok on true
     where exists (
       select 1 from answers a2
        where a2.student_id = ff.student_id and a2.item_id = ff.item_id and a2.attempt_no > 1
     )
     group by ff.item_id
  )
  select it.item_id,
         it.item_index,
         coalesce(t.item_text, t2.item_text, '(pregunta eliminada del módulo)'),
         it.n,
         round(it.p_value, 4),
         case when it.n >= p_min_n and it.p_top is not null and it.p_bottom is not null
              then round((it.p_top - it.p_bottom)::numeric, 4) end,
         -- corr() devuelve double precision y round(double, int) no existe.
         case when it.n >= p_min_n then round(it.r_pb::numeric, 4) end,
         coalesce(dr.distractors, '[]'::jsonb),
         coalesce(r.retry_n, 0),
         round(r.recovery, 4),
         it.has_choices
    from per_item it
    left join texts t      on t.item_id = it.item_id
    left join texts t2     on t2.item_index = it.item_index   -- respaldo para ids viejos
    left join dist_real dr on dr.item_id = it.item_id
    left join retry r      on r.item_id = it.item_id
   order by it.item_index;
end; $$;

grant execute on function public.item_analysis(uuid, int) to authenticated;

-- ── [4] Qué módulos de un curso tienen datos ────────────────────────────────
-- Alimenta el selector de la pantalla: solo módulos con intentos, con el
-- tamaño y el rango de fechas de la muestra.
create or replace function public.analytics_course_modules(p_course_id uuid)
returns table (
  module_id      uuid,
  title          text,
  module_order   int,
  challenge_type text,
  n_attempts     int,
  n_students     int,
  avg_pct        numeric,
  first_at       timestamptz,
  last_at        timestamptz,
  has_item_data  boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_instructor() or public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  with visible as (select student_id from public.analytics_visible_students()),
  att as (
    select ca.module_id, ca.student_id, ca.score, ca.max_score, ca.created_at
      from public.challenge_attempts ca
     where ca.course_id = p_course_id
       and ca.module_id is not null
       and ca.student_id in (select student_id from visible)
  )
  select cm.id,
         cm.title,
         cm."order",
         cm.challenge_type,
         count(*)::int,
         count(distinct a.student_id)::int,
         round(avg(a.score::numeric / nullif(a.max_score, 0)) * 100, 1),
         min(a.created_at),
         max(a.created_at),
         exists (select 1 from public.quiz_attempt_answers q where q.module_id = cm.id)
    from public.course_modules cm
    join att a on a.module_id = cm.id
   where cm.course_id = p_course_id
   group by cm.id, cm.title, cm."order", cm.challenge_type
   order by cm."order";
end; $$;

grant execute on function public.analytics_course_modules(uuid) to authenticated;

-- ── [5] Respuestas crudas (exportación) ─────────────────────────────────────
-- Una fila por estudiante/ítem/intento, con nombre y correo, para que un
-- coordinador haga su propio análisis. Respeta el mismo alcance por institución.
create or replace function public.analytics_raw_answers(p_module_id uuid)
returns table (
  student_name text, student_email text, attempt_no int,
  item_index int, item_id text, item_text text,
  chosen int, chosen_text text, correct boolean, answered_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_instructor() or public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  with answers as (select * from public.analytics_module_answers(p_module_id)),
  texts as (select * from public.analytics_item_texts(p_module_id))
  select p.name, p.email, a.attempt_no,
         a.item_index, a.item_id,
         coalesce(t.item_text, t2.item_text, ''),
         a.chosen,
         nullif(coalesce(t.options, t2.options)->>a.chosen, ''),
         a.correct, a.answered_at
    from answers a
    join public.profiles p on p.id = a.student_id
    left join texts t  on t.item_id = a.item_id
    left join texts t2 on t2.item_index = a.item_index
   order by p.name, a.attempt_no, a.item_index;
end; $$;

grant execute on function public.analytics_raw_answers(uuid) to authenticated;

comment on function public.item_analysis(uuid, int) is
  'Análisis de ítems de un módulo: dificultad, discriminación, punto-biserial y distractores. Todo sobre el PRIMER intento; la evolución entre intentos va en retry_recovery. D y r_pb se devuelven NULL bajo p_min_n estudiantes (muestra insuficiente).';
