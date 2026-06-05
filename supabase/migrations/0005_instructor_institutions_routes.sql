-- 0005: instructor_institutions + named route_configs

-- Tabla para asignar múltiples colegios a un instructor
CREATE TABLE IF NOT EXISTS public.instructor_institutions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id  uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, institution_id)
);

ALTER TABLE public.instructor_institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e instructores pueden leer sus asignaciones"
  ON public.instructor_institutions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin','instructor')
    )
  );

CREATE POLICY "Solo admins pueden gestionar asignaciones"
  ON public.instructor_institutions FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Agregar columnas a route_configs para nombre e institución
ALTER TABLE public.route_configs
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;

-- Rellenar nombre por defecto a las rutas existentes (usa el area como nombre inicial)
UPDATE public.route_configs SET name = area WHERE name IS NULL;
