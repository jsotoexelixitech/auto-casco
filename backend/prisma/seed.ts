/**
 * Seed inicial para Auto Casco
 * Crea los usuarios demo del frontend (DEMO_USERS) con password común: Demo1234!
 * Crea planes, vehículos y pólizas iniciales para que el frontend funcione.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo1234!';

const DEMO_USERS = [
  {
    legacyId: 'u-001',
    name: 'Miguel Azualde',
    email: 'miguel.azualde@lamundial.com',
    role: 'perito',
    avatar: 'MA',
    title: 'Gerente de Automóvil',
    color: 'bg-primary-container',
  },
  {
    legacyId: 'u-002',
    name: 'Joelmis Materano',
    email: 'joelmis.materano@exelixitech.com',
    role: 'perito',
    avatar: 'JM',
    title: 'Coordinador de Procesos',
    color: 'bg-tertiary-container',
  },
  {
    legacyId: 'u-003',
    name: 'Carolina Rivas',
    email: 'carolina.rivas@gmail.com',
    role: 'asegurado',
    avatar: 'CR',
    title: 'Asegurada',
    color: 'bg-secondary-container',
  },
  {
    legacyId: 'u-004',
    name: 'Rodrigo Pérez',
    email: 'rodrigo.perez@gmail.com',
    role: 'asegurado',
    avatar: 'RP',
    title: 'Asegurado',
    color: 'bg-success',
  },
  {
    legacyId: 'u-005',
    name: 'Admin Sistema',
    email: 'admin@lamundial.com',
    role: 'admin',
    avatar: 'AS',
    title: 'Administrador',
    color: 'bg-primary',
  },
];

const PLANS = [
  {
    legacyId: 'plan-basico',
    nombre: 'Básico',
    descripcion: 'Cobertura mínima para tranquilidad inmediata.',
    precioDia: 4.5,
    icon: 'shield',
    features: JSON.stringify([
      'Responsabilidad Civil',
      'Asistencia Vial 24/7',
      'Cobertura por daños a terceros',
    ]),
    recomendado: false,
  },
  {
    legacyId: 'plan-premium',
    nombre: 'Premium',
    descripcion: 'Protección integral para tu vehículo.',
    precioDia: 8.9,
    icon: 'verified_user',
    features: JSON.stringify([
      'Todo lo del Básico',
      'Robo Total y Parcial',
      'Daños propios',
      'Gastos médicos hasta $5,000',
    ]),
    recomendado: true,
  },
  {
    legacyId: 'plan-elite',
    nombre: 'Élite',
    descripcion: 'Cobertura premium con beneficios exclusivos.',
    precioDia: 14.5,
    icon: 'workspace_premium',
    features: JSON.stringify([
      'Todo lo del Premium',
      'Vehículo de reemplazo',
      'Cobertura internacional',
      'Concierge de siniestros',
    ]),
    recomendado: false,
  },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Usuarios ────────────────────────────────────────────────────────
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, rounds);

  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }
  console.log(`✅ ${DEMO_USERS.length} usuarios demo creados`);
  console.log(`   Password común: ${DEMO_PASSWORD}\n`);

  // ─── Planes ──────────────────────────────────────────────────────────
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { legacyId: p.legacyId },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${PLANS.length} planes creados\n`);

  // ─── Vehículo y póliza para Carolina (asegurado demo) ────────────────
  const carolina = await prisma.user.findUnique({
    where: { email: 'carolina.rivas@gmail.com' },
  });
  const planPremium = await prisma.plan.findUnique({
    where: { legacyId: 'plan-premium' },
  });

  if (carolina && planPremium) {
    const vehicle = await prisma.vehicle.upsert({
      where: { placa: 'XYZ-1234' },
      update: {},
      create: {
        legacyId: 'veh-001',
        placa: 'XYZ-1234',
        marca: 'Toyota',
        modelo: 'RAV4',
        version: 'XLE Premium',
        anio: 2023,
        color: 'Blanco Perla',
        tipo: 'Particular',
        serial: '1HGCM82633A123456',
        image:
          'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80',
        ownerId: carolina.id,
      },
    });

    await prisma.policy.upsert({
      where: { numero: 'POL-2026-001' },
      update: {},
      create: {
        legacyId: 'pol-001',
        numero: 'POL-2026-001',
        estado: 'Activa',
        modalidad: 'dias',
        diasContratados: 30,
        diasRestantes: 18,
        saldoDisponible: 0,
        vehicleId: vehicle.id,
        holderId: carolina.id,
        planId: planPremium.id,
      },
    });
    console.log('✅ Vehículo y póliza demo creados para Carolina Rivas\n');
  }

  console.log('🎉 Seed completado.\n');
  console.log('👤 Usuarios para probar login:');
  DEMO_USERS.forEach((u) => {
    console.log(`   ${u.email}  (${u.role})`);
  });
  console.log(`\n🔑 Password para todos: ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
