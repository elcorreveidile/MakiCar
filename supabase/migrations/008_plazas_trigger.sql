-- Trigger que mantiene plazas_libres sincronizado automáticamente.
-- Se dispara en INSERT, UPDATE y DELETE sobre bookings y recalcula
-- plazas_libres = plazas_totales - reservas activas (pendiente|confirmada).

CREATE OR REPLACE FUNCTION public.sync_plazas_libres()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_id uuid;
BEGIN
  -- Determinar el trip_id afectado
  IF TG_OP = 'DELETE' THEN
    v_trip_id := OLD.trip_id;
  ELSE
    v_trip_id := NEW.trip_id;
  END IF;

  -- Solo actuar si hay un trip vinculado
  IF v_trip_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.trips
  SET plazas_libres = GREATEST(0,
    plazas_totales - (
      SELECT COALESCE(SUM(num_pasajeros), 0)
      FROM public.bookings
      WHERE trip_id = v_trip_id
        AND estado IN ('pendiente', 'confirmada')
    )
  )
  WHERE id = v_trip_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Eliminar trigger previo si existiera
DROP TRIGGER IF EXISTS trg_sync_plazas_libres ON public.bookings;

CREATE TRIGGER trg_sync_plazas_libres
  AFTER INSERT OR UPDATE OF estado, num_pasajeros OR DELETE
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_plazas_libres();

-- Sincronización inicial: corregir todos los viajes abiertos
UPDATE public.trips t
SET plazas_libres = GREATEST(0,
  t.plazas_totales - (
    SELECT COALESCE(SUM(b.num_pasajeros), 0)
    FROM public.bookings b
    WHERE b.trip_id = t.id
      AND b.estado IN ('pendiente', 'confirmada')
  )
)
WHERE t.estado = 'abierto';
