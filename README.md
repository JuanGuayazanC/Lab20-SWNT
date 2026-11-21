# EcoFlow

Aplicación web interna para gestionar proyectos de instalación de paneles solares. Construida con React, TypeScript, Vite, Tailwind CSS y Supabase.

## Funcionalidades
- Inicio de sesión con Supabase Auth.
- Dashboard con indicadores de proyectos.
- Gestión de proyectos para administradores.
- Vista de proyectos asignados para instaladores.
- Catálogo e inventario de materiales.
- Control de acceso mediante Row Level Security (RLS).

## Requisitos
- Node.js 20 o superior.
- Proyecto de Supabase.

## Instalación
```bash
npm install
cp .env.example .env
# Completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o la clave heredada VITE_SUPABASE_ANON_KEY)
npm run dev
```

## Configuración de Supabase
1. Abre SQL Editor en el panel de Supabase.
2. Ejecuta el contenido de `supabase/schema.sql`.
3. En Authentication, crea los usuarios que utilizarán la aplicación.
4. Para dar rol de administrador a un usuario, ejecuta en SQL Editor (sustituye el correo):

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
WHERE email = 'admin@tuempresa.com';
```

5. Para habilitar un instalador, crea su perfil asociado al UUID del usuario autenticado:

```sql
INSERT INTO public.instaladores (user_id, nombre, email)
SELECT id, 'Nombre del instalador', email
FROM auth.users
WHERE email = 'instalador@tuempresa.com';
```

Los perfiles de instalador deben ser creados por un administrador. Los instaladores no pueden asignarse permisos ni perfiles por sí mismos.

## Tipos TypeScript desde Supabase
```bash
npx supabase gen types typescript --project-id TU_PROJECT_REF > src/types/database.ts
```

## Scripts
- `npm run dev`: servidor local.
- `npm run build`: comprobación TypeScript y compilación de producción.
- `npm run preview`: vista previa de producción.

## Seguridad
- Utiliza únicamente la clave pública publishable/anon en el navegador.
- Nunca incluyas `service_role` en variables `VITE_*`.
- La autorización real se aplica en PostgreSQL mediante RLS, no solo ocultando controles en React.
- Prueba las políticas con al menos dos instaladores distintos y una cuenta administradora antes de desplegar.

## Estado del proyecto
Esta es una base inicial funcional. La conexión requiere configurar las variables de entorno y ejecutar el esquema SQL en un proyecto Supabase propio.
