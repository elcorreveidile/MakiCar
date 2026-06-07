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

      <div className="border-t border-linea pt-3">
        <p className="text-gris text-[10px] mb-2">
          Categoría de facturación (entra en vigor en enero de 2027 — gratis durante 2026)
        </p>
        <label className="flex items-center gap-2 text-blanco text-[13px] mb-2.5">
          <input type="checkbox" name="es_profesional" className="accent-violeta w-4 h-4" />
          Conductor profesional (25 €/mes o 200 €/año)
        </label>
        <p className="text-gris text-[11px] mb-1.5">Si no se marca, se factura como no profesional (12 €/mes o 120 €/año).</p>
        <select
          name="facturacion"
          defaultValue="mensual"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
        >
          <option value="mensual">Facturación mensual</option>
          <option value="anual">Facturación anual</option>
        </select>
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
