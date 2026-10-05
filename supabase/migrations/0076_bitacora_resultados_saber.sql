-- ============================================================
-- 0076_bitacora_resultados_saber.sql
-- GENERADO por scripts/build-bitacora.mjs — no editar a mano.
--
-- Módulo 3 ("Bitácora") de las rutas por asignatura: agrega la sección
-- `saber-results` con gráficas de cómo le va al colegio en la Prueba Saber
-- por COMPETENCIA y por COMPONENTE (frente al promedio nacional) y la
-- distribución en NIVELES de desempeño (src/components/SaberResults.jsx).
--
-- ⚠️ DATOS SINTÉTICOS de ejemplo (`synthetic: true`; la tarjeta lo dice).
--    Al tener los resultados reales del colegio, se reemplazan los números.
--
-- Qué hace, en cada curso de la asignatura (base + copias por colegio):
--   · toma el módulo de "order" 3 (debe ser una lección);
--   · retira el marcador "Pendiente" si lo tenía;
--   · AGREGA la sección al final, conservando todo lo demás.
-- Idempotente: si el módulo ya tiene la sección, lo informa y no la duplica.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0076_estado;
create temp table _0076_estado (asignatura text, estado text, detalle text);

do $$
declare
  f record; c record; m record;
begin
  for f in
    select * from (values
    ('Matemáticas', (select coalesce(parent_course_id, id) from public.courses where id = '88136e1a-4564-45bd-b514-0ad6690b182c'::uuid), $bmat${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Matemáticas","area":"Matemáticas","year":"2025","synthetic":true,"score":{"school":47,"national":50},"competencias":[{"name":"Interpretación y representación","school":58,"national":55},{"name":"Formulación y ejecución","school":44,"national":49},{"name":"Argumentación","school":37,"national":42}],"componentes":[{"name":"Numérico-variacional","school":52,"national":51},{"name":"Geométrico-métrico","school":41,"national":46},{"name":"Aleatorio","school":49,"national":50}],"niveles":[{"name":"Nivel 1","pct":19},{"name":"Nivel 2","pct":43},{"name":"Nivel 3","pct":31},{"name":"Nivel 4","pct":7}]}$bmat$::jsonb),
    ('Lenguaje', (select coalesce(parent_course_id, id) from public.courses where id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'::uuid), $blec${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Lectura Crítica","area":"Lectura Crítica","year":"2025","synthetic":true,"score":{"school":52,"national":53},"competencias":[{"name":"Identificar y entender contenidos locales","school":64,"national":62},{"name":"Comprender cómo se articulan las partes del texto","school":51,"national":53},{"name":"Reflexionar y evaluar el contenido","school":39,"national":45}],"componentes":[{"name":"Textos literarios (continuos)","school":56,"national":55},{"name":"Textos informativos (continuos)","school":50,"national":52},{"name":"Textos discontinuos","school":43,"national":49}],"niveles":[{"name":"Nivel 1","pct":12},{"name":"Nivel 2","pct":38},{"name":"Nivel 3","pct":41},{"name":"Nivel 4","pct":9}]}$blec$::jsonb),
    ('Biología', (select coalesce(parent_course_id, id) from public.courses where id = '4d2af3cd-767e-4e14-a364-23fd596ada10'::uuid), $bbio${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Naturales","area":"Ciencias Naturales","year":"2025","synthetic":true,"score":{"school":49,"national":50},"competencias":[{"name":"Uso comprensivo del conocimiento científico","school":55,"national":53},{"name":"Explicación de fenómenos","school":47,"national":49},{"name":"Indagación","school":40,"national":46}],"componentes":[{"name":"Biológico","school":54,"national":52},{"name":"Químico","school":45,"national":48},{"name":"Físico","school":42,"national":47},{"name":"Ciencia, tecnología y sociedad","school":50,"national":50}],"niveles":[{"name":"Nivel 1","pct":15},{"name":"Nivel 2","pct":44},{"name":"Nivel 3","pct":34},{"name":"Nivel 4","pct":7}],"focus":"Biológico"}$bbio$::jsonb),
    ('Física', (select id from public.courses where parent_course_id is null and name like '%Ciencias Naturales — Física' order by created_at limit 1), $bfis${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Naturales","area":"Ciencias Naturales","year":"2025","synthetic":true,"score":{"school":49,"national":50},"competencias":[{"name":"Uso comprensivo del conocimiento científico","school":55,"national":53},{"name":"Explicación de fenómenos","school":47,"national":49},{"name":"Indagación","school":40,"national":46}],"componentes":[{"name":"Biológico","school":54,"national":52},{"name":"Químico","school":45,"national":48},{"name":"Físico","school":42,"national":47},{"name":"Ciencia, tecnología y sociedad","school":50,"national":50}],"niveles":[{"name":"Nivel 1","pct":15},{"name":"Nivel 2","pct":44},{"name":"Nivel 3","pct":34},{"name":"Nivel 4","pct":7}],"focus":"Físico"}$bfis$::jsonb),
    ('Química', (select id from public.courses where parent_course_id is null and name like '%Ciencias Naturales — Química' order by created_at limit 1), $bqui${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Naturales","area":"Ciencias Naturales","year":"2025","synthetic":true,"score":{"school":49,"national":50},"competencias":[{"name":"Uso comprensivo del conocimiento científico","school":55,"national":53},{"name":"Explicación de fenómenos","school":47,"national":49},{"name":"Indagación","school":40,"national":46}],"componentes":[{"name":"Biológico","school":54,"national":52},{"name":"Químico","school":45,"national":48},{"name":"Físico","school":42,"national":47},{"name":"Ciencia, tecnología y sociedad","school":50,"national":50}],"niveles":[{"name":"Nivel 1","pct":15},{"name":"Nivel 2","pct":44},{"name":"Nivel 3","pct":34},{"name":"Nivel 4","pct":7}],"focus":"Químico"}$bqui$::jsonb),
    ('Ciencias Sociales', (select coalesce(parent_course_id, id) from public.courses where id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'::uuid), $bsoc${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Sociales y Ciudadanas","area":"Ciencias Sociales y Ciudadanas","year":"2025","synthetic":true,"score":{"school":46,"national":49},"competencias":[{"name":"Pensamiento social","school":53,"national":52},{"name":"Interpretación y análisis de perspectivas","school":45,"national":48},{"name":"Pensamiento reflexivo y sistémico","school":38,"national":44}],"componentes":[{"name":"Historia y cultura","school":51,"national":50},{"name":"Espacio, territorio, ambiente y población","school":44,"national":48},{"name":"Poder, economía y organizaciones sociales","school":41,"national":46}],"niveles":[{"name":"Nivel 1","pct":20},{"name":"Nivel 2","pct":42},{"name":"Nivel 3","pct":31},{"name":"Nivel 4","pct":7}]}$bsoc$::jsonb)
    ) as t(label, base_id, sec)
  loop
    if f.base_id is null then
      insert into _0076_estado values (f.label, 'CURSO NO ENCONTRADO', 'No existe en esta base de datos: no se cambió nada.');
      continue;
    end if;

    for c in
      select id, name from public.courses
       where id = f.base_id or parent_course_id = f.base_id
       order by parent_course_id nulls first, name
    loop
      select * into m from public.course_modules where course_id = c.id and "order" = 3;
      if m.id is null then
        insert into _0076_estado values (f.label, 'SIN MÓDULO 3', c.name);
      elsif m.type <> 'lesson' then
        insert into _0076_estado values (f.label, 'NO TOCADO', format('%s · %s: no es una lección (%s).', c.name, m.title, m.type));
      elsif m.content @> '[{"type":"saber-results"}]'::jsonb then
        insert into _0076_estado values (f.label, 'YA APLICADA', c.name || ' · ' || m.title);
      else
        update public.course_modules
           set content = coalesce((
                 select jsonb_agg(e order by i)
                   from jsonb_array_elements(coalesce(m.content, '[]'::jsonb)) with ordinality as t(e, i)
                  where coalesce(e->>'title', '') <> 'Pendiente'
               ), '[]'::jsonb) || jsonb_build_array(f.sec),
               updated_at = now()
         where id = m.id;
        insert into _0076_estado values (f.label, 'APLICADA', c.name || ' · ' || m.title);
      end if;
    end loop;
  end loop;
end $$;

select asignatura, estado, detalle from _0076_estado order by asignatura, estado, detalle;
