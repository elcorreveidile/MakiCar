export const PARADAS = ['Granada', 'Málaga', 'Marbella', 'Estepona', 'Algeciras'] as const;
export type Parada = typeof PARADAS[number];

export type Maleta = 'no' | 'maletero' | 'asiento';
export type Mascota = 'no' | 'pies' | 'asiento';

export interface EntradaTarifa {
  origen: Parada;
  destino: Parada;
  fechaHora: Date;
  maleta: Maleta;
  mascota: Mascota;
}

export interface ResultadoTarifa {
  precioBase: number;
  esNoche: boolean;
  suplementos: number;
  total: number;
}

// [precio_día, precio_noche]
const TABLA: Record<string, [number, number]> = {
  'Granada-Málaga':     [15, 20],
  'Granada-Marbella':   [18, 22],
  'Granada-Estepona':   [20, 24],
  'Granada-Algeciras':  [25, 30],
  'Málaga-Marbella':    [10, 15],
  'Málaga-Estepona':    [13, 18],
  'Málaga-Algeciras':   [15, 20],
  'Marbella-Algeciras': [12, 15],
  'Estepona-Algeciras': [15, 18],
};

// Tramos bloqueados explícitamente aunque el orden de paradas sea correcto
const SIN_SERVICIO = new Set<string>(['Marbella-Estepona']);

function esHoraNoche(fecha: Date): boolean {
  const minutos = fecha.getHours() * 60 + fecha.getMinutes();
  // Noche: 21:00 (1260 min) hasta 06:00 (360 min), ambas inclusive
  return minutos >= 21 * 60 || minutos <= 6 * 60;
}

export function calcularPrecio(entrada: EntradaTarifa): ResultadoTarifa {
  const { origen, destino, fechaHora, maleta, mascota } = entrada;

  const idxOrigen  = PARADAS.indexOf(origen);
  const idxDestino = PARADAS.indexOf(destino);

  if (idxOrigen === -1)  throw new Error(`Parada no reconocida: "${origen}"`);
  if (idxDestino === -1) throw new Error(`Parada no reconocida: "${destino}"`);
  if (idxDestino <= idxOrigen) {
    throw new Error(
      `Destino inválido: "${destino}" no es posterior a "${origen}" en la ruta troncal`
    );
  }

  const clave = `${origen}-${destino}`;

  if (SIN_SERVICIO.has(clave)) {
    throw new Error(`Tramo sin servicio: ${origen} → ${destino}`);
  }

  if (!(clave in TABLA)) {
    throw new Error(`Tramo no disponible: ${origen} → ${destino}`);
  }

  const noche = esHoraNoche(fechaHora);
  const precioBase = noche ? TABLA[clave][1] : TABLA[clave][0];

  let suplementos = 0;
  if (maleta === 'maletero') suplementos += 5;
  else if (maleta === 'asiento') suplementos += precioBase;

  if (mascota === 'pies') suplementos += 5;
  else if (mascota === 'asiento') suplementos += precioBase;

  return { precioBase, esNoche: noche, suplementos, total: precioBase + suplementos };
}
