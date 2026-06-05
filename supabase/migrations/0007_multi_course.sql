-- ============================================================
-- 0007: Plataforma multi-ruta de formación
-- Estrategia: ADITIVA — no toca tablas existentes
-- ============================================================

-- ============ CURSOS ============
CREATE TABLE IF NOT EXISTS public.courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  cover_image   text,                    -- URL imagen portada
  color         text DEFAULT '#E8732C',  -- color de identidad
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============ MÓDULOS DE CURSO ============
CREATE TABLE IF NOT EXISTS public.course_modules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title         text NOT NULL,
  subtitle      text,
  description   text,
  type          text NOT NULL DEFAULT 'lesson'
                  CHECK (type IN ('lesson','challenge','evaluation')),
  challenge_type text,                  -- dragdrop | empathy | simulation | etc.
  "order"       int NOT NULL DEFAULT 0,
  is_enabled    boolean NOT NULL DEFAULT true,
  xp            int NOT NULL DEFAULT 100,
  content       jsonb DEFAULT '[]'::jsonb,      -- slides de lección
  attachments   jsonb DEFAULT '[]'::jsonb,      -- [{name, url, type, size}]
  challenge_data jsonb DEFAULT '{}'::jsonb,     -- config del reto (preguntas, etc.)
  requirements  text[] DEFAULT '{}',            -- IDs de módulos previos
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_modules_course_id_idx ON public.course_modules (course_id);
CREATE INDEX IF NOT EXISTS course_modules_order_idx     ON public.course_modules (course_id, "order");

-- ============ HABILITACIÓN DE CURSOS POR INSTITUCIÓN ============
CREATE TABLE IF NOT EXISTS public.institution_courses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  course_id      uuid NOT NULL REFERENCES public.courses(id)      ON DELETE CASCADE,
  is_active      boolean NOT NULL DEFAULT true,
  assigned_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, course_id)
);

-- ============ MATRÍCULAS (estudiante en curso) ============
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
  course_id      uuid NOT NULL REFERENCES public.courses(id)      ON DELETE CASCADE,
  institution_id uuid REFERENCES public.institutions(id)          ON DELETE SET NULL,
  enrolled_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

-- ============ PROGRESO POR CURSO (paralelo a la tabla progress existente) ============
CREATE TABLE IF NOT EXISTS public.course_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  xp          int NOT NULL DEFAULT 0,
  completed   text[] NOT NULL DEFAULT '{}',   -- IDs de course_modules
  badges      text[] NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- ============ RLS ============
ALTER TABLE public.courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress     ENABLE ROW LEVEL SECURITY;

-- courses: todos los usuarios autenticados leen; solo admins/instructores escriben
CREATE POLICY "read courses"
  ON public.courses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin instructor write courses"
  ON public.courses FOR ALL
  USING (public.is_admin() OR public.is_instructor())
  WITH CHECK (public.is_admin() OR public.is_instructor());

-- course_modules: igual
CREATE POLICY "read course_modules"
  ON public.course_modules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin instructor write course_modules"
  ON public.course_modules FOR ALL
  USING (public.is_admin() OR public.is_instructor())
  WITH CHECK (public.is_admin() OR public.is_instructor());

-- institution_courses: todos leen, solo admins escriben
CREATE POLICY "read institution_courses"
  ON public.institution_courses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write institution_courses"
  ON public.institution_courses FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- course_enrollments: estudiante lee los suyos; admin/instructor leen todos
CREATE POLICY "read own enrollment"
  ON public.course_enrollments FOR SELECT
  USING (student_id = auth.uid() OR public.is_instructor() OR public.is_admin());
CREATE POLICY "student enroll"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin manage enrollments"
  ON public.course_enrollments FOR ALL USING (public.is_admin());

-- course_progress: estudiante gestiona el suyo; instructores/admins leen
CREATE POLICY "own course progress"
  ON public.course_progress FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "instructor admin read course_progress"
  ON public.course_progress FOR SELECT
  USING (public.is_instructor() OR public.is_admin());

-- ============ SEED: Curso DCE existente ============
-- Se inserta con un ID fijo para poder referenciarlo desde el código durante la transición
INSERT INTO public.courses (id, name, description, color, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Diseño Centrado en Experiencias (DCE)',
  'Formación docente en metodología DCE: aprende a diseñar experiencias de aprendizaje centradas en el estudiante, aplicando empatía, co-creación y evaluación auténtica.',
  '#E8732C',
  true
)
ON CONFLICT (id) DO NOTHING;
