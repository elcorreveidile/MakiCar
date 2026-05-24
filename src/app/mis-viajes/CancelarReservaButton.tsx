'use client';
import { useRef } from 'react';
import { cancelarReserva } from './actions';

interface Props {
  bookingId: string;
  fechaViaje: string | null;
  precioTotal: number;
}

export default function CancelarReservaButton({ bookingId, fechaViaje, precioTotal }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    if (fechaViaje) {
      const msUntil = new Date(fechaViaje).getTime() - Date.now();
      const menosDe24h = msUntil > 0 && msUntil < 24 * 60 * 60 * 1000;
      if (menosDe24h) {
        const penalizacion = Math.round(precioTotal / 2 * 100) / 100;
        const ok = window.confirm(
          `⚠️ Cancelación con menos de 24 h de antelación.\n\nEsta cancelación conlleva una penalización de ${penalizacion} € (la mitad del precio del viaje), que quedará registrada como deuda y se saldará en tu próximo viaje.\n\n¿Seguro que quieres cancelar?`
        );
        if (!ok) return;
      }
    }
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={cancelarReserva}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <button
        type="button"
        onClick={handleClick}
        className="text-[13px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
      >
        Cancelar reserva
      </button>
    </form>
  );
}
