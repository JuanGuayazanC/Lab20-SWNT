-- EcoFlow: esquema inicial para Supabase (PostgreSQL)
-- Ejecutar una sola vez en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.instaladores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  direccion TEXT NOT NULL,
  potencia_kw NUMERIC(10,2) NOT NULL CHECK (potencia_kw > 0),
  estado TEXT NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente', 'En progreso', 'Completado')),
  fecha_inicio DATE,
  fecha_fin DATE,
  instalador_id UUID REFERENCES public.instaladores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS public.materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proyecto_materiales (
  proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materiales(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  PRIMARY KEY (proyecto_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_proyectos_instalador ON public.proyectos(instalador_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_materiales_material ON public.proyecto_materiales(material_id);

ALTER TABLE public.instaladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyecto_materiales ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', FALSE);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Policies are dropped first so the script can be safely re-applied.
DROP POLICY IF EXISTS "installer_select_own_profile" ON public.instaladores;
DROP POLICY IF EXISTS "admin_manage_installers" ON public.instaladores;
DROP POLICY IF EXISTS "installer_select_assigned_projects" ON public.proyectos;
DROP POLICY IF EXISTS "admin_manage_projects" ON public.proyectos;
DROP POLICY IF EXISTS "authenticated_read_materials" ON public.materiales;
DROP POLICY IF EXISTS "admin_manage_materials" ON public.materiales;
DROP POLICY IF EXISTS "installer_read_assigned_project_materials" ON public.proyecto_materiales;
DROP POLICY IF EXISTS "admin_manage_project_materials" ON public.proyecto_materiales;

CREATE POLICY "installer_select_own_profile"
ON public.instaladores FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "admin_manage_installers"
ON public.instaladores FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "installer_select_assigned_projects"
ON public.proyectos FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.instaladores i
    WHERE i.id = proyectos.instalador_id
      AND i.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "admin_manage_projects"
ON public.proyectos FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_read_materials"
ON public.materiales FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "admin_manage_materials"
ON public.materiales FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "installer_read_assigned_project_materials"
ON public.proyecto_materiales FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.proyectos p
    JOIN public.instaladores i ON i.id = p.instalador_id
    WHERE p.id = proyecto_materiales.proyecto_id
      AND i.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "admin_manage_project_materials"
ON public.proyecto_materiales FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Grant only the operations intended by the UI. RLS remains the final authorization layer.
GRANT SELECT ON public.instaladores TO authenticated;
GRANT ALL ON public.instaladores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyectos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyecto_materiales TO authenticated;

-- IMPORTANT: set admin role from a trusted SQL Editor session, replacing the email:
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- WHERE email = 'admin@tuempresa.com';
--
-- Link installers to their Auth users with an INSERT into public.instaladores.
