'use client';
import { useRef } from 'react';
import { eliminarConductor } from './actions';

export default function EliminarConductorButton({ conductorId, nombre }: { conductorId: string; nombre: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    const ok = window.confirm(
      `¿Eliminar al conductor "${nombre}"?\n\nSolo es posible si no tiene viajes ni reservas en el sistema. Esta acción no se puede deshacer.`
    );
    if (ok) formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={eliminarConductor}>
      <input type="hidden" name="conductor_id" value={conductorId} />
      <button
        type="button"
        onClick={handleClick}
        className="text-[12px] text-[#E5544B] border border-[rgba(229,84,75,.3)] rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
      >
        Eliminar
      </button>
    </form>
  );
}
