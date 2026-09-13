import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {

    const gym = await prisma.gym.upsert({
        where: {slug: 'demo-gym'},
        update:{},
        create:{ name:'Demo Gym', slug:'demo-gym'},
    })
    console.log(`Gimnasio demo listo: ${gym.id}`);
    
  // Crea el gimnasio 'demo-gym' si no existe, y no falles si ya existe.
  // Pista: prisma.gym.upsert({ where: { slug: ... }, update: {}, create: { ... } })
  // Imprime el id del gimnasio con console.log: lo vas a necesitar en L03.
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());