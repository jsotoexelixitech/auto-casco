/**
 * Catálogos para el formulario de Salud Tradicional.
 * Basados en la documentación de la API Personas General V-1.2.2.
 */

export const TIPOS_CEDULA = [
  { value: 'V', label: 'V — Venezolano' },
  { value: 'E', label: 'E — Extranjero' },
  { value: 'J', label: 'J — Jurídico' },
  { value: 'G', label: 'G — Gubernamental' },
]

export const SEXOS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

export const ESTADOS_CIVILES = [
  { value: 'S', label: 'Soltero(a)' },
  { value: 'C', label: 'Casado(a)' },
  { value: 'V', label: 'Viudo(a)' },
  { value: 'D', label: 'Divorciado(a)' },
]

export const FRECUENCIAS = [
  { value: 'A', label: 'Anual',        desc: 'Un pago al año'              },
  { value: 'S', label: 'Semestral',    desc: 'Dos pagos al año'            },
  { value: 'C', label: 'Cuatrimestral',desc: 'Tres pagos al año'           },
  { value: 'T', label: 'Trimestral',   desc: 'Cuatro pagos al año'         },
  { value: 'M', label: 'Mensual',      desc: 'Pago cada mes — recomendado' },
]

export const PARENTESCOS = [
  { value: 1, label: 'Titular'       },
  { value: 2, label: 'Cónyuge'       },
  { value: 3, label: 'Hijo(a)'       },
  { value: 4, label: 'Abuelo(a)'     },
  { value: 5, label: 'Tío(a)'        },
  { value: 6, label: 'Padre/Madre'   },
  { value: 7, label: 'Hermano(a)'    },
]

export const PLANES_SALUD = [
  {
    id: 'plan-basico',
    code: 'BAS',
    nombre: 'Plan Básico',
    subtitulo: 'Cobertura esencial',
    primaMensual: 35,
    cobertura: 5000,
    color: 'neutral',
    icono: 'health_and_safety',
    beneficios: [
      'Consultas médicas generales',
      'Emergencias hospitalarias',
      'Medicamentos básicos',
    ],
  },
  {
    id: 'plan-clasico',
    code: 'CLA',
    nombre: 'Plan Clásico',
    subtitulo: 'Cobertura completa',
    primaMensual: 75,
    cobertura: 15000,
    color: 'info',
    icono: 'medical_services',
    beneficios: [
      'Consultas con especialistas',
      'Hospitalización privada',
      'Cirugías programadas',
      'Estudios diagnósticos',
    ],
    recomendado: true,
  },
  {
    id: 'plan-premium',
    code: 'PRE',
    nombre: 'Plan Premium',
    subtitulo: 'Cobertura premium',
    primaMensual: 145,
    cobertura: 50000,
    color: 'success',
    icono: 'workspace_premium',
    beneficios: [
      'Cobertura internacional',
      'Maternidad incluida',
      'Servicio dental y visual',
      'Atención domiciliaria 24/7',
      'Sin períodos de espera',
    ],
  },
]

/**
 * Lista mínima de estados/ciudades — demo.
 * En producción este catálogo viene del backend de La Mundial.
 */
export const ESTADOS_VENEZUELA = [
  { code: 'DC',  label: 'Distrito Capital',  ciudades: [
    { code: 'CAR', label: 'Caracas' },
    { code: 'EHP', label: 'El Hatillo' },
  ]},
  { code: 'MI',  label: 'Miranda', ciudades: [
    { code: 'GUA', label: 'Guarenas' },
    { code: 'GUT', label: 'Guatire' },
    { code: 'LST', label: 'Los Teques' },
    { code: 'CUA', label: 'Cúa' },
  ]},
  { code: 'AR',  label: 'Aragua', ciudades: [
    { code: 'MAR', label: 'Maracay' },
    { code: 'TUR', label: 'Turmero' },
    { code: 'CGT', label: 'Cagua' },
  ]},
  { code: 'CA',  label: 'Carabobo', ciudades: [
    { code: 'VAL', label: 'Valencia' },
    { code: 'NPA', label: 'Naguanagua' },
    { code: 'PCB', label: 'Puerto Cabello' },
  ]},
  { code: 'ZU',  label: 'Zulia', ciudades: [
    { code: 'MCB', label: 'Maracaibo' },
    { code: 'CBC', label: 'Cabimas' },
  ]},
  { code: 'LA',  label: 'Lara', ciudades: [
    { code: 'BTO', label: 'Barquisimeto' },
    { code: 'CRA', label: 'Cabudare' },
  ]},
]
