-- Email del conductor, mostrado en el panel admin sin necesidad de unir con auth.users
ALTER TABLE public.conductores ADD COLUMN IF NOT EXISTS email text;

NOTIFY pgrst, 'reload schema';
