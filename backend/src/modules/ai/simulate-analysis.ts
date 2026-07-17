import { VehiculoContext } from './prompts/vehicle-analysis.prompt';
import {
  buildContentValidationBlock,
  SequenceContentContext,
  shouldSkipVehicleIdentity,
  ValidacionContenido,
} from './sequence-content';

export interface VehicleAnalysisResult {
  piezas: Record<
    string,
    {
      estado: string;
      tipoDano: string;
      confianza: number;
      observacion: string;
    }
  >;
  resumenGeneral: string;
  alertas: string[];
  placaDetectada: string | null;
  coincideModelo: boolean;
  motivoNoCoincide: string | null;
  validacionContenido?: ValidacionContenido;
  verificacionVehiculo?: {
    resultado: 'mismo' | 'otro' | 'incierto';
    confianza: number;
    motivo: string;
    placaDetectada: string | null;
    coincidePlaca: boolean | null;
    marcaDetectada?: string | null;
    modeloDetectado?: string | null;
    colorDetectado?: string | null;
    carroceriaDetectada?: string | null;
    serialDetectado?: string | null;
    coincideSerial?: boolean | null;
  };
  vehicleFingerprint?: {
    marca: string;
    modelo: string;
    color: string | null;
    carroceria: string;
  };
  _simulado?: boolean;
}

const ZONE_PROFILES: Record<string, Record<string, number>> = {
  front: { B: 0.55, R: 0.3, M: 0.12, NE: 0.03 },
  'front-right': { B: 0.6, R: 0.25, M: 0.12, NE: 0.03 },
  'front-left': { B: 0.6, R: 0.25, M: 0.12, NE: 0.03 },
  'rear-right': { B: 0.62, R: 0.25, M: 0.1, NE: 0.03 },
  'rear-left': { B: 0.62, R: 0.25, M: 0.1, NE: 0.03 },
  rear: { B: 0.58, R: 0.28, M: 0.11, NE: 0.03 },
  interior: { B: 0.75, R: 0.18, M: 0.05, NE: 0.02 },
  dashboard: { B: 0.82, R: 0.12, M: 0.04, NE: 0.02 },
  serial: { B: 0.9, R: 0.06, M: 0.03, NE: 0.01 },
  trunk: { B: 0.7, R: 0.2, M: 0.07, NE: 0.03 },
  damages: { B: 0.3, R: 0.4, M: 0.25, NE: 0.05 },
  roof: { B: 0.65, R: 0.22, M: 0.1, NE: 0.03 },
};

const DAMAGE_BY_ESTADO: Record<string, string[]> = {
  B: ['Sin daño'],
  R: ['Rayón / Raspón', 'Abolladura', 'Descascarado de pintura', 'Grieta / Fisura'],
  M: ['Pieza rota / Fractura', 'Oxidación / Corrosión', 'Cristal quebrado / Astillado', 'Deformación estructural', 'Grieta / Fisura'],
  NE: ['Pieza faltante'],
};

const OBSERVATIONS: Record<string, string[]> = {
  B: ['Sin daño aparente', 'Buen estado general', 'Sin observaciones', 'Pieza en óptimas condiciones'],
  R: ['Presenta daño superficial', 'Requiere atención menor', 'Daño leve visible', 'Desgaste por uso normal'],
  M: ['Daño severo — requiere reposición', 'Pieza comprometida estructuralmente', 'Daño grave detectado'],
  NE: ['No presente en el vehículo', 'Pieza no aplica a este modelo'],
};

function weightedRandom(profile: Record<string, number>): string {
  const r = Math.random();
  let acc = 0;
  for (const [estado, prob] of Object.entries(profile)) {
    acc += prob;
    if (r <= acc) return estado;
  }
  return 'B';
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function simulateVehicleAnalysis(
  piezas: string[],
  diagramZone: string,
  contentCtx?: SequenceContentContext,
): VehicleAnalysisResult {
  const profile = ZONE_PROFILES[diagramZone] || ZONE_PROFILES.front;
  const result: VehicleAnalysisResult['piezas'] = {};

  for (const pieza of piezas) {
    const estado = weightedRandom(profile);
    const tipoDano = pick(DAMAGE_BY_ESTADO[estado]);
    result[pieza] = {
      estado,
      tipoDano,
      confianza:
        estado === 'B'
          ? 0.88 + Math.random() * 0.1
          : 0.72 + Math.random() * 0.18,
      observacion: pick(OBSERVATIONS[estado]),
    };
  }

  const malos = Object.values(result).filter((p) => p.estado === 'M').length;
  const regulares = Object.values(result).filter((p) => p.estado === 'R').length;

  const nombre = contentCtx?.nombre || 'Secuencia';

  return {
    piezas: result,
    resumenGeneral:
      malos > 0
        ? `${malos} pieza(s) con daño grave, ${regulares} con daño moderado`
        : regulares > 0
          ? `${regulares} pieza(s) con daño moderado detectado`
          : 'Zona en buen estado general',
    alertas:
      malos > 1
        ? ['Múltiples piezas con daño grave — evaluar asegurabilidad']
        : [],
    placaDetectada: null,
    coincideModelo: true,
    motivoNoCoincide: null,
    validacionContenido: {
      esCorrecta: true,
      confianza: 0.9,
      elementoDetectado: nombre,
      motivo: 'Contenido coherente con la secuencia solicitada',
    },
    verificacionVehiculo: {
      resultado: 'mismo',
      confianza: 0.92,
      motivo: shouldSkipVehicleIdentity(diagramZone)
        ? 'Validación por contenido de secuencia'
        : 'Vehículo coherente con el registro de la inspección',
      placaDetectada: null,
      coincidePlaca: null,
    },
    _simulado: true,
  };
}

export function isDemoImage(imageData: string): boolean {
  return imageData?.includes('unsplash.com') ?? false;
}
