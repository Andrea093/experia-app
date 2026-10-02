-- ============================================================
-- 0074_nombre_laboratorio_ciencias.sql
-- Devuelve el nombre original "Laboratorio de Ciencias Naturales" a los tres
-- cursos que creó/renombró 0073, conservando la materia al final para
-- distinguir los paneles:
--
--   Ciencias Naturales — Biología  →  Laboratorio de Ciencias Naturales — Biología
--   Ciencias Naturales — Física    →  Laboratorio de Ciencias Naturales — Física
--   Ciencias Naturales — Química   →  Laboratorio de Ciencias Naturales — Química
--
-- También renombra sus copias por colegio (ej. "… — Física — Versión 1") y el
-- título del certificado si lo tenían. SOLO nombres: no toca progreso,
-- módulos ni accesos.
-- Idempotente: si ya se corrió, no encuentra nada y lo informa.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0074_estado;
create temp table _0074_estado (estado text, detalle text);

do $$
declare
  v_n int;
  v_c int;
begin
  update public.courses
     set name = 'Laboratorio de ' || name
   where name like 'Ciencias Naturales — Biología%'
      or name like 'Ciencias Naturales — Física%'
      or name like 'Ciencias Naturales — Química%';
  get diagnostics v_n = row_count;

  update public.courses
     set certificate_title = 'Laboratorio de ' || certificate_title
   where certificate_title in ('Ciencias Naturales — Biología', 'Ciencias Naturales — Física', 'Ciencias Naturales — Química');
  get diagnostics v_c = row_count;

  insert into _0074_estado values (
    case when v_n = 0 then 'YA APLICADA' else 'APLICADA' end,
    format('%s curso(s)/copia(s) renombrados, %s título(s) de certificado.', v_n, v_c));
end $$;

insert into _0074_estado
select case when parent_course_id is null then 'Curso' else 'Copia por colegio' end, name
  from public.courses
 where name like 'Laboratorio de Ciencias Naturales — %'
 order by name;

select estado, detalle from _0074_estado;
