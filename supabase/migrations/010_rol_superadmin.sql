-- Documenta el rol 'superadmin' y la función es_superadmin(): ya existen y se
-- usan en producción (panel /admin), pero se crearon directamente en el editor
-- SQL de Supabase sin migración asociada — esta la añade para que la base de
-- datos se pueda reconstruir desde cero (p. ej. en un entorno de staging).
--
-- CREATE OR REPLACE y el ALTER CONSTRAINT son idempotentes: ejecutarla sobre
-- la base de datos actual no cambia el comportamiento existente.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check CHECK (rol IN ('cliente', 'conductor', 'superadmin'));

CREATE OR REPLACE FUNCTION public.es_superadmin()
RETURNS bool
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'superadmin'
  );
$$;
