'use client';
import { useState } from 'react';
import { eliminarConductor } from './actions';

export default function EliminarConductorButton({ conductorId, nombre }: { conductorId: string; nombre: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <div className="flex flex-col gap-2 w-full mt-1">
        <p className="text-[11px] text-gris">
          Se cancelarán todos sus viajes y reservas.{' '}
          <span className="text-blanco font-semibold">¿Eliminar a {nombre}?</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="flex-1 text-[12px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
          >
            Cancelar
          </button>
          <form action={eliminarConductor} className="flex-1">
            <input type="hidden" name="conductor_id" value={conductorId} />
            <button
              type="submit"
              className="w-full text-[12px] text-[#E5544B] border border-[rgba(229,84,75,.4)] bg-[rgba(229,84,75,.08)] rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
            >
              Sí, eliminar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="text-[12px] text-[#E5544B] border border-[rgba(229,84,75,.3)] rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
    >
      Eliminar
    </button>
  );
}
