'use client';
import { useRef } from 'react';
import { crearConductor } from './actions';

export default function NuevoConductorForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await crearConductor(fd);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <label className="block text-gris text-[10px] mb-1">Nombre completo</label>
        <input
          type="text"
          name="nombre"
          required
          placeholder="Nombre del conductor"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
        />
      </div>
      <div>
        <label className="block text-gris text-[10px] mb-1">Email</label>
        <input
          type="email"
          name="email"
          required
          placeholder="conductor@ejemplo.com"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
        />
      </div>
      <div>
        <label className="block text-gris text-[10px] mb-1">Teléfono (opcional)</label>
        <input
          type="tel"
          name="telefono"
          placeholder="+34 600 000 000"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-violeta text-noche font-bold rounded-xl py-2.5 text-[14px] active:scale-[.98] transition-transform"
      >
        Crear conductor
      </button>
    </form>
  );
}
