'use client';
import { actualizarPerfil } from './actions';

interface Props {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  guardado: boolean;
}

export default function ProfileForm({ nombre, telefono, direccion, guardado }: Props) {
  return (
    <form action={actualizarPerfil} className="flex flex-col gap-3.5">
      {guardado && (
        <div className="bg-[rgba(43,182,164,.12)] border border-[rgba(43,182,164,.3)] text-ruta text-sm rounded-xl px-4 py-3">
          Cambios guardados correctamente.
        </div>
      )}

      <div>
        <label className="block text-gris text-xs mb-1.5">Nombre</label>
        <input
          name="nombre"
          type="text"
          defaultValue={nombre}
          required
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Teléfono</label>
        <input
          name="telefono"
          type="tel"
          defaultValue={telefono ?? ''}
          placeholder="Ej: +34 600 000 000"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Dirección habitual de recogida</label>
        <input
          name="direccion"
          type="text"
          defaultValue={direccion ?? ''}
          placeholder="Ej: Calle Mayor 5, Granada"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] active:scale-[.98] transition-transform mt-1"
      >
        Guardar cambios
      </button>
    </form>
  );
}
