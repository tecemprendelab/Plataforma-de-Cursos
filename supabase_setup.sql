-- ============================================================
--  supabase_setup.sql
--  Ejecutar en el SQL Editor de Supabase para habilitar
--  la galería de plantillas SVG de certificados.
-- ============================================================

-- 1. Tabla de metadata de plantillas
CREATE TABLE IF NOT EXISTS svg_templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  file_name     text        NOT NULL,
  style         text        NOT NULL DEFAULT 'Personalizado',
  course        text        NOT NULL DEFAULT 'Todos los programas',
  tags          text[]      NOT NULL DEFAULT '{}',
  colors        text[]      NOT NULL DEFAULT '{}',
  name_id       text        NOT NULL DEFAULT 'recipient_name',
  date_id       text        NOT NULL DEFAULT 'issue_date',
  storage_path  text,
  is_builtin    boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS svg_templates_name_idx ON svg_templates(name);

-- 2. RLS: permitir lectura pública, escritura solo autenticados
ALTER TABLE svg_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Lectura pública de plantillas"
  ON svg_templates FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Solo usuarios autenticados insertan"
  ON svg_templates FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Solo usuarios autenticados eliminan sus plantillas"
  ON svg_templates FOR DELETE
  TO authenticated USING (true);

-- 3. Bucket de Storage (ejecutar desde el Dashboard de Supabase
--    Storage > New bucket, o usar la API):
--
--    Nombre:  certificate-templates
--    Público: sí (para que los SVG sean accesibles sin autenticación)
--
--    O con SQL (requiere extensión storage habilitada):
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'certificate-templates',
  'certificate-templates',
  true,
  ARRAY['image/svg+xml', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Política de storage: lectura pública
CREATE POLICY IF NOT EXISTS "SVG públicos para lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-templates');

CREATE POLICY IF NOT EXISTS "Autenticados suben SVG"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificate-templates');

CREATE POLICY IF NOT EXISTS "Autenticados eliminan SVG"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificate-templates');
