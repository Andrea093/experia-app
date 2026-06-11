-- 0010_certificates.sql
-- Tabla de certificados emitidos con UUID único de verificación pública.
-- RLS: cualquier persona puede leer por cert_uuid (página de verificación sin auth).
--       solo el dueño puede insertar.

CREATE TABLE IF NOT EXISTS certificates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID UNIQUE REFERENCES submissions(id) ON DELETE SET NULL,
  student_name  TEXT NOT NULL,
  area_id       TEXT,
  score         INT,
  max_score     INT,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cert_uuid     UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Verificación pública: cualquier visitante puede leer un certificado por su UUID
CREATE POLICY "certs_public_select"  ON certificates FOR SELECT USING (true);

-- Solo el estudiante dueño puede insertar su propio certificado
CREATE POLICY "certs_owner_insert"   ON certificates FOR INSERT
  WITH CHECK (user_id = auth.uid());
