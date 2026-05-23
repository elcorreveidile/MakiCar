import { describe, it, expect } from 'vitest';
import { calcularPrecio, rutaDisponible } from './tarifas';
import type { EntradaTarifa } from './tarifas';

// Crea una fecha en hora local con hora y minuto exactos
function h(hora: number, minuto = 0): Date {
  const d = new Date(2025, 0, 15); // 15 enero 2025, hora local
  d.setHours(hora, minuto, 0, 0);
  return d;
}

const DIA   = h(12);  // mediodía → día
const NOCHE = h(23);  // 23:00 → noche

function tarifa(overrides: Partial<EntradaTarifa> & Pick<EntradaTarifa, 'origen' | 'destino'>) {
  return calcularPrecio({
    fechaHora: DIA,
    maleta: 'no',
    mascota: 'no',
    ...overrides,
  });
}

// ─── Tabla de tarifas: todos los tramos ────────────────────────────────────

describe('tabla de tarifas', () => {
  it('Granada → Málaga: día 15, noche 20', () => {
    expect(tarifa({ origen: 'Granada', destino: 'Málaga' }).precioBase).toBe(15);
    expect(tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: NOCHE }).precioBase).toBe(20);
  });

  it('Granada → Marbella: día 18, noche 22', () => {
    expect(tarifa({ origen: 'Granada', destino: 'Marbella' }).precioBase).toBe(18);
    expect(tarifa({ origen: 'Granada', destino: 'Marbella', fechaHora: NOCHE }).precioBase).toBe(22);
  });

  it('Granada → Estepona: día 20, noche 24', () => {
    expect(tarifa({ origen: 'Granada', destino: 'Estepona' }).precioBase).toBe(20);
    expect(tarifa({ origen: 'Granada', destino: 'Estepona', fechaHora: NOCHE }).precioBase).toBe(24);
  });

  it('Granada → Algeciras: día 25, noche 30', () => {
    expect(tarifa({ origen: 'Granada', destino: 'Algeciras' }).precioBase).toBe(25);
    expect(tarifa({ origen: 'Granada', destino: 'Algeciras', fechaHora: NOCHE }).precioBase).toBe(30);
  });

  it('Málaga → Marbella: día 10, noche 15', () => {
    expect(tarifa({ origen: 'Málaga', destino: 'Marbella' }).precioBase).toBe(10);
    expect(tarifa({ origen: 'Málaga', destino: 'Marbella', fechaHora: NOCHE }).precioBase).toBe(15);
  });

  it('Málaga → Estepona: día 13, noche 18', () => {
    expect(tarifa({ origen: 'Málaga', destino: 'Estepona' }).precioBase).toBe(13);
    expect(tarifa({ origen: 'Málaga', destino: 'Estepona', fechaHora: NOCHE }).precioBase).toBe(18);
  });

  it('Málaga → Algeciras: día 15, noche 20', () => {
    expect(tarifa({ origen: 'Málaga', destino: 'Algeciras' }).precioBase).toBe(15);
    expect(tarifa({ origen: 'Málaga', destino: 'Algeciras', fechaHora: NOCHE }).precioBase).toBe(20);
  });

  it('Marbella → Algeciras: día 12, noche 15', () => {
    expect(tarifa({ origen: 'Marbella', destino: 'Algeciras' }).precioBase).toBe(12);
    expect(tarifa({ origen: 'Marbella', destino: 'Algeciras', fechaHora: NOCHE }).precioBase).toBe(15);
  });

  it('Estepona → Algeciras: día 15, noche 18', () => {
    expect(tarifa({ origen: 'Estepona', destino: 'Algeciras' }).precioBase).toBe(15);
    expect(tarifa({ origen: 'Estepona', destino: 'Algeciras', fechaHora: NOCHE }).precioBase).toBe(18);
  });
});

// ─── Límites día/noche ─────────────────────────────────────────────────────

describe('límites día / noche', () => {
  // Tramo de referencia: Granada → Málaga (día 15, noche 20)
  it('20:59 → día (precio 15)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: h(20, 59) });
    expect(r.esNoche).toBe(false);
    expect(r.precioBase).toBe(15);
  });

  it('21:00 → noche (precio 20)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: h(21, 0) });
    expect(r.esNoche).toBe(true);
    expect(r.precioBase).toBe(20);
  });

  it('05:59 → noche (precio 20)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: h(5, 59) });
    expect(r.esNoche).toBe(true);
    expect(r.precioBase).toBe(20);
  });

  it('06:00 → noche (precio 20, inclusive)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: h(6, 0) });
    expect(r.esNoche).toBe(true);
    expect(r.precioBase).toBe(20);
  });

  it('06:01 → día (precio 15)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: h(6, 1) });
    expect(r.esNoche).toBe(false);
    expect(r.precioBase).toBe(15);
  });
});

// ─── Suplementos ───────────────────────────────────────────────────────────

describe('suplementos', () => {
  // Usamos Granada → Málaga día (precioBase = 15)

  it('sin suplementos → total = precioBase', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga' });
    expect(r.suplementos).toBe(0);
    expect(r.total).toBe(15);
  });

  it('maleta en maletero → +5 €', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', maleta: 'maletero' });
    expect(r.suplementos).toBe(5);
    expect(r.total).toBe(20);
  });

  it('maleta en asiento → suplemento = precioBase (15)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', maleta: 'asiento' });
    expect(r.suplementos).toBe(15);
    expect(r.total).toBe(30);
  });

  it('mascota a los pies → +5 €', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', mascota: 'pies' });
    expect(r.suplementos).toBe(5);
    expect(r.total).toBe(20);
  });

  it('mascota en asiento → suplemento = precioBase (15)', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', mascota: 'asiento' });
    expect(r.suplementos).toBe(15);
    expect(r.total).toBe(30);
  });

  it('maleta asiento + mascota asiento → suplementos = 2 × precioBase', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', maleta: 'asiento', mascota: 'asiento' });
    expect(r.suplementos).toBe(30); // 15 + 15
    expect(r.total).toBe(45);       // 15 + 30
  });

  it('maleta maletero + mascota pies → suplementos = 5 + 5 = 10', () => {
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', maleta: 'maletero', mascota: 'pies' });
    expect(r.suplementos).toBe(10);
    expect(r.total).toBe(25);
  });

  it('suplementos se calculan sobre precioBase noche', () => {
    // Granada → Málaga noche: precioBase = 20; maleta asiento → suplemento = 20
    const r = tarifa({ origen: 'Granada', destino: 'Málaga', fechaHora: NOCHE, maleta: 'asiento' });
    expect(r.precioBase).toBe(20);
    expect(r.suplementos).toBe(20);
    expect(r.total).toBe(40);
  });
});

// ─── Rutas inversas (vuelta) ────────────────────────────────────────────────

describe('rutas inversas: mismo precio en ambas direcciones', () => {
  it('Málaga → Granada: día 15, noche 20', () => {
    expect(tarifa({ origen: 'Málaga', destino: 'Granada' }).precioBase).toBe(15);
    expect(tarifa({ origen: 'Málaga', destino: 'Granada', fechaHora: NOCHE }).precioBase).toBe(20);
  });

  it('Marbella → Granada: día 18, noche 22', () => {
    expect(tarifa({ origen: 'Marbella', destino: 'Granada' }).precioBase).toBe(18);
    expect(tarifa({ origen: 'Marbella', destino: 'Granada', fechaHora: NOCHE }).precioBase).toBe(22);
  });

  it('Estepona → Granada: día 20, noche 24', () => {
    expect(tarifa({ origen: 'Estepona', destino: 'Granada' }).precioBase).toBe(20);
    expect(tarifa({ origen: 'Estepona', destino: 'Granada', fechaHora: NOCHE }).precioBase).toBe(24);
  });

  it('Algeciras → Granada: día 25, noche 30', () => {
    expect(tarifa({ origen: 'Algeciras', destino: 'Granada' }).precioBase).toBe(25);
    expect(tarifa({ origen: 'Algeciras', destino: 'Granada', fechaHora: NOCHE }).precioBase).toBe(30);
  });

  it('Marbella → Málaga: día 10, noche 15', () => {
    expect(tarifa({ origen: 'Marbella', destino: 'Málaga' }).precioBase).toBe(10);
    expect(tarifa({ origen: 'Marbella', destino: 'Málaga', fechaHora: NOCHE }).precioBase).toBe(15);
  });

  it('Estepona → Málaga: día 13, noche 18', () => {
    expect(tarifa({ origen: 'Estepona', destino: 'Málaga' }).precioBase).toBe(13);
    expect(tarifa({ origen: 'Estepona', destino: 'Málaga', fechaHora: NOCHE }).precioBase).toBe(18);
  });

  it('Algeciras → Málaga: día 15, noche 20', () => {
    expect(tarifa({ origen: 'Algeciras', destino: 'Málaga' }).precioBase).toBe(15);
    expect(tarifa({ origen: 'Algeciras', destino: 'Málaga', fechaHora: NOCHE }).precioBase).toBe(20);
  });

  it('Algeciras → Marbella: día 12, noche 15', () => {
    expect(tarifa({ origen: 'Algeciras', destino: 'Marbella' }).precioBase).toBe(12);
    expect(tarifa({ origen: 'Algeciras', destino: 'Marbella', fechaHora: NOCHE }).precioBase).toBe(15);
  });

  it('Algeciras → Estepona: día 15, noche 18', () => {
    expect(tarifa({ origen: 'Algeciras', destino: 'Estepona' }).precioBase).toBe(15);
    expect(tarifa({ origen: 'Algeciras', destino: 'Estepona', fechaHora: NOCHE }).precioBase).toBe(18);
  });
});

// ─── rutaDisponible ─────────────────────────────────────────────────────────

describe('rutaDisponible', () => {
  it('Granada → Málaga: disponible', () => expect(rutaDisponible('Granada', 'Málaga')).toBe(true));
  it('Málaga → Granada: disponible', () => expect(rutaDisponible('Málaga', 'Granada')).toBe(true));
  it('Marbella → Estepona: no disponible', () => expect(rutaDisponible('Marbella', 'Estepona')).toBe(false));
  it('Estepona → Marbella: no disponible', () => expect(rutaDisponible('Estepona', 'Marbella')).toBe(false));
  it('mismo punto: no disponible', () => expect(rutaDisponible('Granada', 'Granada')).toBe(false));
});

// ─── Errores ───────────────────────────────────────────────────────────────

describe('errores', () => {
  it('Marbella → Estepona: tramo sin servicio', () => {
    expect(() =>
      tarifa({ origen: 'Marbella', destino: 'Estepona' })
    ).toThrow('sin servicio');
  });

  it('Estepona → Marbella: tramo sin servicio (bidireccional)', () => {
    expect(() =>
      tarifa({ origen: 'Estepona', destino: 'Marbella' })
    ).toThrow('sin servicio');
  });

  it('origen igual al destino: Granada → Granada', () => {
    expect(() =>
      tarifa({ origen: 'Granada', destino: 'Granada' })
    ).toThrow('mismo punto');
  });

  it('parada no reconocida', () => {
    expect(() =>
      // @ts-expect-error probando runtime con tipos inválidos
      tarifa({ origen: 'Madrid', destino: 'Málaga' })
    ).toThrow('Parada no reconocida');
  });
});
