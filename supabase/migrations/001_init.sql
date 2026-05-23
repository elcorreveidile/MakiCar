-- ============================================================
-- MakiCar — Migración inicial
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tablas ──────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol                         text        NOT NULL DEFAULT 'cliente'
                                            CHECK (rol IN ('cliente', 'conductor')),
  nombre                      text        NOT NULL DEFAULT '',
  telefono                    text,
  direccion_habitual_recogida text,
  created_at                  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Perfil de cada usuario (cliente o conductor)';

CREATE TABLE public.conductores (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_servicio   text        NOT NULL,
  plazas_vehiculo   int         NOT NULL DEFAULT 4,
  stripe_account_id text,
  activo            bool        NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.conductores IS 'v1: una fila. Modelo preparado para multi-conductor';

CREATE TABLE public.trips (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id     uuid        NOT NULL REFERENCES public.conductores(id),
  fecha_hora       timestamptz NOT NULL,
  origen_cabecera  text        NOT NULL,
  destino_cabecera text        NOT NULL,
  plazas_totales   int         NOT NULL,
  plazas_libres    int         NOT NULL,
  estado           text        NOT NULL DEFAULT 'abierto'
                                 CHECK (estado IN ('abierto', 'cerrado')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bookings (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                  uuid          REFERENCES public.trips(id),  -- nullable para especiales
  conductor_id             uuid          NOT NULL REFERENCES public.conductores(id),
  cliente_id               uuid          NOT NULL REFERENCES public.profiles(id),
  origen                   text          NOT NULL,
  destino                  text          NOT NULL,
  direccion_recogida       text,
  direccion_destino        text,
  es_noche                 bool          NOT NULL,
  precio_base              numeric(10,2) NOT NULL,
  maleta                   text          NOT NULL DEFAULT 'no'
                                           CHECK (maleta IN ('no', 'maletero', 'asiento')),
  mascota                  text          NOT NULL DEFAULT 'no'
                                           CHECK (mascota IN ('no', 'pies', 'asiento')),
  suplementos              numeric(10,2) NOT NULL DEFAULT 0,
  precio_total             numeric(10,2) NOT NULL,
  forma_pago               text          NOT NULL
                                           CHECK (forma_pago IN ('efectivo', 'tarjeta')),
  stripe_payment_intent_id text,
  estado                   text          NOT NULL DEFAULT 'pendiente'
                                           CHECK (estado IN ('pendiente','confirmada','rechazada','completada','cancelada')),
  cancelada_at             timestamptz,
  penalizacion             numeric(10,2) NOT NULL DEFAULT 0,
  created_at               timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE public.deudas (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   uuid          NOT NULL REFERENCES public.profiles(id),
  conductor_id uuid          NOT NULL REFERENCES public.conductores(id),
  booking_id   uuid          NOT NULL REFERENCES public.bookings(id),
  importe      numeric(10,2) NOT NULL,
  saldada      bool          NOT NULL DEFAULT false,
  created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE public.special_requests (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id             uuid          NOT NULL REFERENCES public.conductores(id),
  cliente_id               uuid          NOT NULL REFERENCES public.profiles(id),
  origen_texto             text          NOT NULL,
  destino_texto            text          NOT NULL,
  fecha_hora               timestamptz   NOT NULL,
  num_pasajeros            int           NOT NULL DEFAULT 1,
  precio_propuesto         numeric(10,2),
  forma_pago               text          CHECK (forma_pago IN ('efectivo', 'tarjeta')),
  stripe_payment_intent_id text,
  estado                   text          NOT NULL DEFAULT 'pendiente'
                                           CHECK (estado IN ('pendiente','confirmada','rechazada','completada')),
  created_at               timestamptz   NOT NULL DEFAULT now()
);

-- ── Trigger: crear perfil al registrar usuario ───────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, rol, nombre)
  VALUES (
    new.id,
    'cliente',
    COALESCE(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Funciones helper para RLS ────────────────────────────────

-- ¿Es el usuario actual un conductor activo?
CREATE OR REPLACE FUNCTION public.es_conductor_activo()
RETURNS bool
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conductores
    WHERE profile_id = auth.uid() AND activo = true
  );
$$;

-- Devuelve el conductor_id del usuario actual (null si no es conductor)
CREATE OR REPLACE FUNCTION public.mi_conductor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.conductores
  WHERE profile_id = auth.uid() AND activo = true
  LIMIT 1;
$$;

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conductores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_requests ENABLE ROW LEVEL SECURITY;

-- profiles
-- Cada usuario ve y edita su propio perfil
CREATE POLICY "profiles_propio"
  ON public.profiles FOR ALL
  USING (id = auth.uid());

-- El conductor puede leer todos los perfiles (necesita ver datos de clientes)
CREATE POLICY "profiles_conductor_lee_todos"
  ON public.profiles FOR SELECT
  USING (public.es_conductor_activo());

-- conductores
-- Cualquier usuario autenticado puede leer la tabla conductores (para saber el conductor_id activo)
CREATE POLICY "conductores_leer"
  ON public.conductores FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo el propio conductor gestiona su fila
CREATE POLICY "conductores_gestionar_propio"
  ON public.conductores FOR ALL
  USING (profile_id = auth.uid());

-- trips
-- Cualquier autenticado puede ver viajes disponibles
CREATE POLICY "trips_leer"
  ON public.trips FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo el conductor propietario crea/edita/borra sus viajes
CREATE POLICY "trips_conductor_gestiona"
  ON public.trips FOR ALL
  USING (conductor_id = public.mi_conductor_id());

-- bookings
CREATE POLICY "bookings_cliente_lee_suyos"
  ON public.bookings FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "bookings_cliente_crea"
  ON public.bookings FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

-- Cliente puede cancelar solo reservas pendientes o confirmadas
CREATE POLICY "bookings_cliente_cancela"
  ON public.bookings FOR UPDATE
  USING (cliente_id = auth.uid() AND estado IN ('pendiente', 'confirmada'));

CREATE POLICY "bookings_conductor_lee"
  ON public.bookings FOR SELECT
  USING (conductor_id = public.mi_conductor_id());

CREATE POLICY "bookings_conductor_actualiza"
  ON public.bookings FOR UPDATE
  USING (conductor_id = public.mi_conductor_id());

-- deudas
CREATE POLICY "deudas_cliente_lee"
  ON public.deudas FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "deudas_conductor_gestiona"
  ON public.deudas FOR ALL
  USING (conductor_id = public.mi_conductor_id());

-- special_requests
CREATE POLICY "sr_cliente_lee"
  ON public.special_requests FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "sr_cliente_crea"
  ON public.special_requests FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "sr_conductor_gestiona"
  ON public.special_requests FOR ALL
  USING (conductor_id = public.mi_conductor_id());
