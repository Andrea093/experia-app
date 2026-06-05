-- 0006: rutas de formación por colegio (clave única: area + institution_id)

-- Eliminar la constraint única anterior que solo era por area
ALTER TABLE public.route_configs DROP CONSTRAINT IF EXISTS route_configs_area_key;

-- Nueva constraint única: una ruta por (area, institution_id)
-- institution_id NULL = ruta global (sin colegio asignado)
ALTER TABLE public.route_configs
  ADD CONSTRAINT route_configs_area_institution_key
  UNIQUE (area, institution_id);
