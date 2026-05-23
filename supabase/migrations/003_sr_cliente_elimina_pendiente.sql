-- Permite al cliente eliminar sus propias solicitudes especiales pendientes
-- Aplicar en: Supabase Dashboard → Database → Policies

CREATE POLICY "sr_cliente_elimina_pendiente"
  ON public.special_requests FOR DELETE
  USING (cliente_id = auth.uid() AND estado = 'pendiente');
