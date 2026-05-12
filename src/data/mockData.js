// Mock data for La Mundial - Auto Casco Demo
// Realistic seed data for users, vehicles, policies, inspections.

export const ROLES = {
  ADMIN: 'admin',
  PERITO: 'perito',
  ASEGURADO: 'asegurado',
  INTERMEDIARIO: 'intermediario',
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  perito: 'Perito',
  asegurado: 'Asegurado',
  intermediario: 'Intermediario',
}

export const DEMO_USERS = [
  {
    id: 'u-001',
    name: 'Miguel Azualde',
    email: 'miguel.azualde@lamundial.com',
    role: ROLES.PERITO,
    avatar: 'MA',
    title: 'Gerente de Automóvil',
    color: 'bg-primary-container',
  },
  {
    id: 'u-002',
    name: 'Joelmis Materano',
    email: 'joelmis.materano@exelixitech.com',
    role: ROLES.PERITO,
    avatar: 'JM',
    title: 'Coordinador de Procesos',
    color: 'bg-tertiary-container',
  },
  {
    id: 'u-003',
    name: 'Carolina Rivas',
    email: 'carolina.rivas@gmail.com',
    role: ROLES.ASEGURADO,
    avatar: 'CR',
    title: 'Asegurada',
    color: 'bg-secondary-container',
  },
  {
    id: 'u-004',
    name: 'Rodrigo Pérez',
    email: 'rodrigo.perez@gmail.com',
    role: ROLES.ASEGURADO,
    avatar: 'RP',
    title: 'Asegurado',
    color: 'bg-success',
  },
  {
    id: 'u-005',
    name: 'Admin Sistema',
    email: 'admin@lamundial.com',
    role: ROLES.ADMIN,
    avatar: 'AS',
    title: 'Administrador',
    color: 'bg-primary',
  },
]

export const VEHICLES = [
  {
    id: 'veh-001',
    placa: 'XYZ-1234',
    marca: 'Toyota',
    modelo: 'RAV4',
    version: 'XLE Premium',
    anio: 2023,
    color: 'Blanco Perla',
    tipo: 'Particular',
    serial: 'JTMRWRFV5LD069871',
    chasis: 'JTMRWRFV5LD069871',
    puestos: 5,
    kilometraje: 18450,
    image:
      'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1400&q=80',
    ownerId: 'u-003',
  },
  {
    id: 'veh-002',
    placa: 'ABC-7821',
    marca: 'Honda',
    modelo: 'Civic',
    version: 'Sport Touring',
    anio: 2022,
    color: 'Gris Plata',
    tipo: 'Particular',
    serial: '2HGFE2F58NH501234',
    chasis: '2HGFE2F58NH501234',
    puestos: 5,
    kilometraje: 32100,
    image:
      'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1400&q=80',
    ownerId: 'u-004',
  },
  {
    id: 'veh-003',
    placa: 'DEF-4490',
    marca: 'Ford',
    modelo: 'Explorer',
    version: 'Limited',
    anio: 2024,
    color: 'Negro Ónix',
    tipo: 'Particular',
    serial: '1FM5K8D88RGA12345',
    chasis: '1FM5K8D88RGA12345',
    puestos: 7,
    kilometraje: 5800,
    image:
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=80',
    ownerId: 'u-003',
  },
]

export const POLICIES = [
  {
    id: 'POL-98765',
    numero: 'POL-98765',
    estado: 'Activa',
    plan: 'Premium',
    modalidad: 'Por Días',
    diasRestantes: 0,
    diasContratados: 30,
    vigenciaDesde: '2026-04-01',
    vigenciaHasta: '2026-05-31',
    prima: 750,
    saldo: 145.5,
    vehicleId: 'veh-001',
    holderId: 'u-003',
    coberturas: [
      { nombre: 'Responsabilidad Civil', limite: 25000 },
      { nombre: 'Daños a Terceros', limite: 50000 },
      { nombre: 'Robo Total', limite: 35000 },
      { nombre: 'Gastos Médicos', limite: 8000 },
    ],
  },
  {
    id: 'POL-12330',
    numero: 'POL-12330',
    estado: 'Inactiva',
    plan: 'Básico',
    modalidad: 'Por Saldo',
    diasRestantes: 0,
    diasContratados: 15,
    vigenciaDesde: '2026-02-10',
    vigenciaHasta: '2026-02-25',
    prima: 320,
    saldo: 12,
    vehicleId: 'veh-002',
    holderId: 'u-004',
    coberturas: [
      { nombre: 'Responsabilidad Civil', limite: 15000 },
      { nombre: 'Asistencia Vial 24/7', limite: 'Ilimitada' },
    ],
  },
  {
    id: 'POL-44001',
    numero: 'POL-44001',
    estado: 'Activa',
    plan: 'Premium',
    modalidad: 'Por Días',
    diasRestantes: 12,
    diasContratados: 30,
    vigenciaDesde: '2026-04-15',
    vigenciaHasta: '2026-05-15',
    prima: 1100,
    saldo: 220,
    vehicleId: 'veh-003',
    holderId: 'u-003',
    coberturas: [
      { nombre: 'Responsabilidad Civil', limite: 30000 },
      { nombre: 'Daños a Terceros', limite: 60000 },
      { nombre: 'Robo Total', limite: 45000 },
      { nombre: 'Gastos Médicos', limite: 10000 },
    ],
  },
]

export const PLANS = [
  {
    id: 'plan-basico',
    nombre: 'Plan Básico',
    descripcion: 'Protección esencial para el día a día.',
    precioDia: 15,
    icon: 'calendar_today',
    features: ['Responsabilidad Civil', 'Asistencia Vial 24/7'],
  },
  {
    id: 'plan-estandar',
    nombre: 'Plan Estándar',
    descripcion: 'Cobertura balanceada para uso regular.',
    precioDia: 20,
    icon: 'shield_with_house',
    features: [
      'Responsabilidad Civil',
      'Daños a Terceros',
      'Asistencia Vial',
      'Gastos Legales',
    ],
  },
  {
    id: 'plan-premium',
    nombre: 'Plan Premium',
    descripcion: 'Cobertura total para máxima tranquilidad.',
    precioDia: 25,
    icon: 'verified_user',
    recomendado: true,
    features: [
      'Daños a Terceros',
      'Robo Total',
      'Gastos Médicos',
      'Asistencia Premium 24/7',
      'Vehículo de Reemplazo',
    ],
  },
]

export const INSPECTION_STATUS = {
  EN_PROGRESO: 'En Progreso',
  PENDIENTE_VALIDACION: 'Pendiente de Validación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  PENDIENTE_CLIENTE: 'Pendiente Cliente',
}

export const INSPECTIONS = [
  {
    id: 'INS-2026-889',
    numero: 'INS-2026-889',
    estado: INSPECTION_STATUS.EN_PROGRESO,
    tipo: 'Auto-Gestionable (Cliente)',
    fechaCreacion: '2026-05-04T10:32:00',
    progreso: 45,
    vehicleId: 'veh-001',
    asignadoA: 'u-003',
    peritoId: null,
    ubicacion: { lat: 10.491, lng: -66.879, direccion: 'Caracas, Venezuela' },
    danios: 2,
  },
  {
    id: 'INS-2026-883',
    numero: 'INS-2026-883',
    estado: INSPECTION_STATUS.APROBADA,
    tipo: 'In-situ (Perito)',
    fechaCreacion: '2026-05-02T08:14:00',
    fechaCierre: '2026-05-02T11:45:00',
    progreso: 100,
    vehicleId: 'veh-002',
    asignadoA: 'u-004',
    peritoId: 'u-001',
    ubicacion: {
      lat: 10.481,
      lng: -66.864,
      direccion: 'Sucursal Caracas, Centro Lido',
    },
    danios: 0,
  },
  {
    id: 'INS-2026-880',
    numero: 'INS-2026-880',
    estado: INSPECTION_STATUS.PENDIENTE_VALIDACION,
    tipo: 'Asistida por Videollamada',
    fechaCreacion: '2026-05-01T14:22:00',
    progreso: 88,
    vehicleId: 'veh-003',
    asignadoA: 'u-003',
    peritoId: 'u-002',
    ubicacion: { lat: 10.503, lng: -66.892, direccion: 'Las Mercedes' },
    danios: 1,
  },
  {
    id: 'INS-2026-872',
    numero: 'INS-2026-872',
    estado: INSPECTION_STATUS.RECHAZADA,
    tipo: 'Auto-Gestionable (Cliente)',
    fechaCreacion: '2026-04-28T09:18:00',
    progreso: 100,
    vehicleId: 'veh-002',
    asignadoA: 'u-004',
    peritoId: 'u-001',
    ubicacion: { lat: 10.475, lng: -66.851, direccion: 'Chacao' },
    danios: 5,
    motivoRechazo: 'Fotos con baja calidad. Se requiere repetir captura.',
  },
]

// Photo sequences per meeting minutes (2026-05-05)
// excludeVehicleTypes: sequences excluded for certain vehicle types
export const PHOTO_SEQUENCES = [
  {
    id: 'seq-frontal-placa',
    nombre: 'Frontal con Placa',
    descripcion: 'Secuencia panorámica de frente donde se visualice la placa delantera.',
    icon: 'directions_car',
    requierePlaca: true,
    excludeVehicleTypes: ['Moto', 'Remolque'],
    diagramZone: 'front',
    piezas: [
      'Capot',
      'Cocuyo Guard. Der',
      'Cocuyo Guard. Izq',
      'Parabrisas Del.',
      'Parach. Delant.',
      'Faro Derecho',
      'Faro Izquierdo',
      'Cocuyo Derec.',
      'Cocuyo Izquierd.',
      'Cocuyo Neblina D',
      'Cocuyo Neblina I',
      'Parrilla Central',
    ],
    piezasOpcionales: ['Mataburro'],
  },
  {
    id: 'seq-frontal-lat-der',
    nombre: 'Frontal + Lateral Derecho',
    descripcion: 'Secuencia panorámica del área delantera con el lateral derecho.',
    icon: 'turn_right',
    excludeVehicleTypes: ['Moto', 'Remolque'],
    diagramZone: 'front-right',
    piezas: [
      'Cocuyo Guard. Der',
      'Estribo Derecho',
      'Guardaf. D. Der',
      'Retrovisor Der',
      'Puerta D. Derecha',
      'Platina Pta. D.D.',
      'Tapicer. Pta. D.D.',
      'Vidrio Pta. D.D.',
    ],
    piezasOpcionales: ['Estribo Posapie Der'],
  },
  {
    id: 'seq-trasera-placa',
    nombre: 'Trasera con Placa',
    descripcion: 'Área trasera donde se visualice la placa trasera.',
    icon: 'directions_car',
    requierePlaca: true,
    diagramZone: 'rear',
    piezas: ['Placa Trasera', 'Parachoques Tras.', 'Maletero', 'Faros Tras.'],
  },
  {
    id: 'seq-trasera-lat-der',
    nombre: 'Trasera + Lateral Derecho',
    descripcion: 'Área trasera con el lateral derecho.',
    icon: 'turn_right',
    diagramZone: 'rear-right',
    piezas: ['Maletero', 'Faro Tras. Der.', 'Puerta Tras. Der.', 'Aro Tras. Der.'],
  },
  {
    id: 'seq-frontal-lat-izq',
    nombre: 'Frontal + Lateral Izquierdo',
    descripcion: 'Área delantera con el lateral izquierdo.',
    icon: 'turn_left',
    diagramZone: 'front-left',
    piezas: [
      'Capot',
      'Parabrisas Del.',
      'Faro Del. Izq.',
      'Espejo Izq.',
      'Puerta Del. Izq.',
    ],
  },
  {
    id: 'seq-trasera-lat-izq',
    nombre: 'Trasera + Lateral Izquierdo',
    descripcion: 'Área trasera con el lateral izquierdo.',
    icon: 'turn_left',
    diagramZone: 'rear-left',
    piezas: [
      'Maletero',
      'Faro Tras. Izq.',
      'Puerta Tras. Izq.',
      'Aro Tras. Izq.',
    ],
  },
  {
    id: 'seq-serial',
    nombre: 'Impronta / Serial',
    descripcion: 'Foto de la impronta (serial de carrocería) y serial troquelado.',
    icon: 'qr_code_2',
    diagramZone: 'serial',
    piezas: ['Serial Body (Impronta)', 'Serial Troquelado'],
  },
  {
    id: 'seq-seguridad',
    nombre: 'Sistemas de Seguridad',
    descripcion: 'Alarma, cinturones de seguridad y bolsas de aire.',
    icon: 'shield',
    diagramZone: 'interior',
    piezas: ['Alarma', 'Cinturones', 'Airbags'],
  },
  {
    id: 'seq-tablero',
    nombre: 'Check Panel',
    descripcion: 'Tablero indicando el kilometraje de recorrido.',
    icon: 'speed',
    diagramZone: 'dashboard',
    piezas: ['Tablero / Odómetro'],
  },
  {
    id: 'seq-interior',
    nombre: 'Tablero e Interior',
    descripcion: 'Tablero, asientos delanteros y traseros.',
    icon: 'event_seat',
    diagramZone: 'interior',
    piezas: ['Tablero', 'Asientos Delanteros', 'Asientos Traseros'],
  },
  {
    id: 'seq-repuesto',
    nombre: 'Caucho de Repuesto',
    descripcion: 'Caucho y rin de repuesto, gato, llave de gato y triángulo.',
    icon: 'build_circle',
    diagramZone: 'trunk',
    piezas: ['Caucho Repuesto', 'Gato', 'Llave de Gato', 'Triángulo'],
  },
  {
    id: 'seq-danios',
    nombre: 'Daños Iniciales',
    descripcion: 'Señalamiento de daños visibles al momento de la inspección.',
    icon: 'report',
    diagramZone: 'damages',
    piezas: ['Daños identificados'],
  },
]

// Asegurabilidad rules per meeting minutes 2026-05-05:
// - (R + M) >= 15 → NO ASEGURABLE
// - R > 15 (solo regulares) → NO ASEGURABLE
// - All B → ASEGURABLE
// - R <= 15 and M == 0 → ASEGURABLE
export function calcularAsegurabilidad(photos) {
  let totalR = 0
  let totalM = 0
  PHOTO_SEQUENCES.forEach((s) => {
    const ph = photos[s.id]
    if (!ph) return
    Object.values(ph.piezas).forEach((p) => {
      if (p.estado === ESTADO_PIEZA.REGULAR) totalR++
      if (p.estado === ESTADO_PIEZA.MALO) totalM++
    })
  })
  const totalRM = totalR + totalM
  const asegurable = totalRM < 15 && totalR <= 15
  return { totalR, totalM, totalRM, asegurable }
}

export const ESTADO_PIEZA = {
  BUENO: 'B',
  REGULAR: 'R',
  MALO: 'M',
  NO_EXISTE: 'NE',
}

export const ESTADO_PIEZA_LABEL = {
  B: 'Bueno',
  R: 'Regular',
  M: 'Malo',
  NE: 'No existe',
}

export const ACTIVITY_FEED = [
  {
    id: 'act-1',
    type: 'inspection-start',
    title: 'Nueva inspección INS-2026-889',
    subtitle: 'Auto-gestionable iniciada por Carolina R.',
    when: 'Hace 5 min',
    icon: 'verified',
    tone: 'primary',
  },
  {
    id: 'act-2',
    type: 'policy-paused',
    title: 'Cobertura Pausada',
    subtitle: 'Automático por inactividad',
    when: 'Hoy 08:00 AM',
    icon: 'timer_off',
    tone: 'error',
  },
  {
    id: 'act-3',
    type: 'days-bought',
    title: 'Compra de 3 días',
    subtitle: 'Pago con saldo · POL-98765',
    when: 'Hace 4 días',
    icon: 'add_shopping_cart',
    tone: 'primary',
    amount: -15,
  },
  {
    id: 'act-4',
    type: 'topup',
    title: 'Recarga de Saldo',
    subtitle: 'Tarjeta **** 1234',
    when: 'Hace 1 semana',
    icon: 'account_balance_wallet',
    tone: 'accent',
    amount: 50,
  },
  {
    id: 'act-5',
    type: 'inspection-approved',
    title: 'Inspección INS-2026-883 aprobada',
    subtitle: 'Honda Civic 2022 · sin daños',
    when: 'Hace 2 días',
    icon: 'task_alt',
    tone: 'success',
  },
]

export const NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Nueva inspección requiere validación',
    body: 'INS-2026-880 — Ford Explorer 2024',
    when: 'Hace 12 min',
    unread: true,
    icon: 'rule',
  },
  {
    id: 'n2',
    title: 'Tu cobertura ha expirado',
    body: 'Compra días para reactivar tu protección',
    when: 'Hoy',
    unread: true,
    icon: 'timer_off',
  },
  {
    id: 'n3',
    title: 'Nuevo plan disponible',
    body: 'Plan Estándar con 20% off por lanzamiento',
    when: 'Ayer',
    unread: false,
    icon: 'campaign',
  },
]

export const SINIESTROS = [
  {
    id: 'SIN-2026-014',
    fecha: '2026-04-21',
    estado: 'En Análisis',
    tipo: 'Choque Frontal',
    vehicleId: 'veh-001',
    monto: 4200,
    avance: 65,
  },
  {
    id: 'SIN-2025-088',
    fecha: '2025-12-08',
    estado: 'Cerrado',
    tipo: 'Robo Parcial',
    vehicleId: 'veh-002',
    monto: 1850,
    avance: 100,
  },
  {
    id: 'SIN-2026-007',
    fecha: '2026-03-15',
    estado: 'Aprobado',
    tipo: 'Daños Laterales',
    vehicleId: 'veh-003',
    monto: 920,
    avance: 100,
  },
]

export const PAGOS = [
  {
    id: 'PAY-9081',
    fecha: '2026-05-04',
    concepto: 'Compra de 3 días — POL-98765',
    metodo: 'Saldo',
    monto: -15,
    estado: 'Completado',
  },
  {
    id: 'PAY-9072',
    fecha: '2026-05-01',
    concepto: 'Recarga de saldo',
    metodo: 'Tarjeta **** 1234',
    monto: 50,
    estado: 'Completado',
  },
  {
    id: 'PAY-9064',
    fecha: '2026-04-22',
    concepto: 'Pago prima POL-44001',
    metodo: 'Transferencia',
    monto: -220,
    estado: 'Completado',
  },
  {
    id: 'PAY-9050',
    fecha: '2026-04-12',
    concepto: 'Reembolso siniestro SIN-2025-088',
    metodo: 'Transferencia',
    monto: 320,
    estado: 'Completado',
  },
]

// Simulated OCR results for documents
export const OCR_TEMPLATES = {
  cedula: {
    tipo: 'Cédula de Identidad',
    documento: 'V-18.456.789',
    nombres: 'Carolina Sofía',
    apellidos: 'Rivas Méndez',
    fechaNacimiento: '1989-07-14',
    naturaleza: 'Persona Natural',
  },
  rif: {
    tipo: 'RIF',
    documento: 'J-12345678-9',
    razonSocial: 'Distribuidora Lido C.A.',
    naturaleza: 'Persona Jurídica',
  },
  carnet: {
    marca: 'Toyota',
    modelo: 'RAV4',
    tipo: 'Particular',
    serial: 'JTMRWRFV5LD069871',
    placa: 'XYZ-1234',
    color: 'Blanco Perla',
    anio: 2023,
    puestos: 5,
  },
}
