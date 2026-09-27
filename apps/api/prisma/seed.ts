import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/common/password.util';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function qrCode(): string {
  return `qr_${randomUUID()}`;
}

// Construye una fecha relativa a "ahora": +offsetDays días, a la hora local
// hour:minute. Así el seed siempre deja clases de la semana en curso,
// corras el script el día que lo corras.
function relativeDate(offsetDays: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function seedGym(config: {
  gymName: string;
  gymSlug: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  memberEmail: string;
  memberPassword: string;
  memberFullName: string;
  disciplineNames: string[];
  memberPlanCoversFirstOnly: boolean;
}) {
  const gym = await prisma.gym.upsert({
    where: { slug: config.gymSlug },
    update: {},
    create: { name: config.gymName, slug: config.gymSlug },
  });

  const adminPasswordHash = await hashPassword(config.adminPassword);
  await prisma.user.upsert({
    where: { email: config.adminEmail },
    update: {},
    create: {
      email: config.adminEmail,
      passwordHash: adminPasswordHash,
      fullName: config.adminFullName,
      role: Role.ADMIN,
      gymId: gym.id,
      qrCode: qrCode(),
    },
  });

  const disciplines = [];
  for (const name of config.disciplineNames) {
    const discipline = await prisma.discipline.upsert({
      where: { gymId_name: { gymId: gym.id, name } },
      update: {},
      create: { gymId: gym.id, name, description: `Clases de ${name.toLowerCase()}` },
    });
    disciplines.push(discipline);
  }

  // Un plan completo (todas las disciplinas) y uno acotado (solo la primera),
  // para poder demostrar en vivo que un miembro con el plan acotado no ve
  // las clases de las demás disciplinas.
  const fullPlan = await prisma.plan.upsert({
    where: { gymId_name: { gymId: gym.id, name: 'Plan Full' } },
    update: {},
    create: {
      gymId: gym.id,
      name: 'Plan Full',
      price: 250,
      durationDays: 30,
      disciplines: {
        create: disciplines.map((d) => ({ disciplineId: d.id })),
      },
    },
  });

  const limitedPlanName = `Solo ${config.disciplineNames[0]}`;
  const limitedPlan = await prisma.plan.upsert({
    where: { gymId_name: { gymId: gym.id, name: limitedPlanName } },
    update: {},
    create: {
      gymId: gym.id,
      name: limitedPlanName,
      price: 120,
      durationDays: 30,
      disciplines: { create: [{ disciplineId: disciplines[0].id }] },
    },
  });

  const memberPasswordHash = await hashPassword(config.memberPassword);
  const member = await prisma.user.upsert({
    where: { email: config.memberEmail },
    update: {},
    create: {
      email: config.memberEmail,
      passwordHash: memberPasswordHash,
      fullName: config.memberFullName,
      role: Role.MEMBER,
      gymId: gym.id,
      qrCode: qrCode(),
    },
  });

  const planForMember = config.memberPlanCoversFirstOnly ? limitedPlan : fullPlan;
  const existingMembership = await prisma.membership.findFirst({
    where: { gymId: gym.id, userId: member.id, status: 'ACTIVE' },
  });

  if (!existingMembership) {
    const startDate = relativeDate(-1, 0);
    const endDate = relativeDate(29, 0);
    await prisma.membership.create({
      data: {
        gymId: gym.id,
        userId: member.id,
        planId: planForMember.id,
        startDate,
        endDate,
      },
    });
  }

  // Clases de la semana en curso: hoy, mañana y pasado, para cada disciplina.
  const sessionsCreated = [];
  for (const [index, discipline] of disciplines.entries()) {
    for (const dayOffset of [0, 1, 2]) {
      const startsAt = relativeDate(dayOffset, 7 + index, 0);
      const endsAt = relativeDate(dayOffset, 8 + index, 0);

      const existing = await prisma.classSession.findFirst({
        where: { gymId: gym.id, disciplineId: discipline.id, startsAt },
      });

      if (!existing) {
        const session = await prisma.classSession.create({
          data: {
            gymId: gym.id,
            disciplineId: discipline.id,
            instructorName: `Instructor ${discipline.name}`,
            startsAt,
            endsAt,
            capacity: 15,
          },
        });
        sessionsCreated.push(session);
      }
    }
  }

  // Reserva de demo: el miembro reserva la primera clase futura de una
  // disciplina que su plan sí cubre.
  const coveredDisciplineIds = config.memberPlanCoversFirstOnly
    ? [disciplines[0].id]
    : disciplines.map((d) => d.id);

  const bookableSession = await prisma.classSession.findFirst({
    where: {
      gymId: gym.id,
      disciplineId: { in: coveredDisciplineIds },
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: 'asc' },
  });

  if (bookableSession) {
    await prisma.booking.upsert({
      where: {
        userId_classSessionId: { userId: member.id, classSessionId: bookableSession.id },
      },
      update: {},
      create: { gymId: gym.id, userId: member.id, classSessionId: bookableSession.id },
    });
  }

  return { gym, admin: config.adminEmail, member: config.memberEmail };
}

async function main(): Promise<void> {
  const superAdminPasswordHash = await hashPassword('SuperAdmin123!');
  await prisma.user.upsert({
    where: { email: 'super@gym-management.dev' },
    update: {},
    create: {
      email: 'super@gym-management.dev',
      passwordHash: superAdminPasswordHash,
      fullName: 'Sheila (Super Admin)',
      role: Role.SUPER_ADMIN,
      gymId: null,
    },
  });

  const ironGym = await seedGym({
    gymName: 'Iron Gym',
    gymSlug: 'iron-gym',
    adminEmail: 'admin@iron-gym.dev',
    adminPassword: 'IronAdmin123!',
    adminFullName: 'Admin Iron Gym',
    memberEmail: 'member@iron-gym.dev',
    memberPassword: 'Member123!',
    memberFullName: 'Ana Torres',
    disciplineNames: ['Spinning', 'Yoga', 'Funcional'],
    memberPlanCoversFirstOnly: true, // solo ve Spinning: el caso de demo del plan del proyecto
  });

  const flexGym = await seedGym({
    gymName: 'Flex Studio',
    gymSlug: 'flex-studio',
    adminEmail: 'admin@flex-studio.dev',
    adminPassword: 'FlexAdmin123!',
    adminFullName: 'Admin Flex Studio',
    memberEmail: 'member@flex-studio.dev',
    memberPassword: 'Member123!',
    memberFullName: 'Bruno Salas',
    disciplineNames: ['Crossfit', 'Pilates'],
    memberPlanCoversFirstOnly: false, // ve ambas disciplinas: el otro extremo del caso de demo
  });

  console.log('\nSeed listo. Credenciales de desarrollo:\n');
  console.log('SUPER_ADMIN   super@gym-management.dev / SuperAdmin123!');
  console.log(`ADMIN  (${ironGym.gym.name})   ${ironGym.admin} / IronAdmin123!`);
  console.log(`MEMBER (${ironGym.gym.name}, solo Spinning)   ${ironGym.member} / Member123!`);
  console.log(`ADMIN  (${flexGym.gym.name})   ${flexGym.admin} / FlexAdmin123!`);
  console.log(`MEMBER (${flexGym.gym.name}, todas las disciplinas)   ${flexGym.member} / Member123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
