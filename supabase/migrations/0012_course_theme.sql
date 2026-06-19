-- 0012: Tema visual por curso + línea de personaje por módulo
-- Permite activar experiencias inmersivas (ej: 'detective') por curso

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS theme text DEFAULT NULL;

COMMENT ON COLUMN public.courses.theme IS
  'Tema visual inmersivo del curso. Valores: detective | null (estándar)';

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS character_line text DEFAULT NULL;

COMMENT ON COLUMN public.course_modules.character_line IS
  'Línea de diálogo del personaje compañero para este módulo (Vera Clío en tema detective)';
