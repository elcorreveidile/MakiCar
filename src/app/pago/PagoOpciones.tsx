'use client';
import { useState } from 'react';

export default function PagoOpciones() {
  const [pago, setPago] = useState<'tarjeta' | 'efectivo'>('tarjeta');

  return (
    <div className="mb-4">
      {/* Selector */}
      <div className="flex gap-2.5 mb-3">
        {(['tarjeta', 'efectivo'] as const).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setPago(op)}
            className={`flex-1 border rounded-xl p-3 text-center transition-colors ${
              pago === op
                ? 'border-ambar bg-[rgba(255,182,39,.08)]'
                : 'border-linea'
            }`}
          >
            <div className="font-semibold text-[14px] mb-0.5 capitalize">{op}</div>
            <div className="text-[11px] text-gris leading-snug">
              {op === 'tarjeta' ? 'Pre-autoriza 15 € al reservar' : 'Pagas al conductor al subir'}
            </div>
          </button>
        ))}
      </div>

      {/* Nota según opción */}
      {pago === 'tarjeta' ? (
        <div className="bg-[rgba(255,182,39,.08)] border border-[rgba(255,182,39,.25)] text-[#ffd98a] text-xs rounded-xl px-3.5 py-3 mb-3 leading-relaxed">
          Se pre-autorizan <strong>15 €</strong> en tu tarjeta como señal. <strong>No se cobra ahora.</strong> Se liberan al confirmar o rechazar el viaje.
        </div>
      ) : (
        <div className="bg-[rgba(43,182,164,.08)] border border-[rgba(43,182,164,.25)] text-[#9fe7dc] text-xs rounded-xl px-3.5 py-3 mb-3 leading-relaxed">
          Tu plaza no queda garantizada hasta que el conductor la confirme. Pagas al subir.
        </div>
      )}

      <input type="hidden" name="forma_pago" value={pago} />
    </div>
  );
}
