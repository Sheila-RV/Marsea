import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from './utils/bootstrap-app';

// Corre contra los datos que deja prisma/seed.ts (dos gimnasios completos:
// Iron Gym y Flex Studio). Este es el test más importante del proyecto:
// demuestra en vivo la regla de aislamiento multi-gimnasio, no solo la
// asume por cómo está escrito el código.
describe('Gym isolation (e2e)', () => {
  let app: INestApplication;

  let superAdminToken: string;
  let ironAdminToken: string;
  let flexAdminToken: string;
  let ironMemberToken: string;
  let disciplineIdInIronGym: string;

  async function login(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    return (response.body as { accessToken: string }).accessToken;
  }

  beforeAll(async () => {
    app = await createTestApp();

    superAdminToken = await login('super@gym-management.dev', 'SuperAdmin123!');
    ironAdminToken = await login('admin@iron-gym.dev', 'IronAdmin123!');
    flexAdminToken = await login('admin@flex-studio.dev', 'FlexAdmin123!');
    ironMemberToken = await login('member@iron-gym.dev', 'Member123!');

    const disciplinesResponse = await request(app.getHttpServer())
      .get('/api/disciplines')
      .set('Authorization', `Bearer ${ironAdminToken}`)
      .expect(200);

    const disciplines = disciplinesResponse.body as Array<{ id: string }>;
    disciplineIdInIronGym = disciplines[0].id;
  }, 30_000); // argon2 es deliberadamente lento; 4 logins seguidos superan el timeout por defecto de Jest

  afterAll(async () => {
    await app.close();
  });

  it('el admin de Iron Gym puede leer sus propias disciplinas', async () => {
    await request(app.getHttpServer())
      .get(`/api/disciplines/${disciplineIdInIronGym}`)
      .set('Authorization', `Bearer ${ironAdminToken}`)
      .expect(200);
  });

  it('el admin de Flex Studio recibe 404 al leer una disciplina de Iron Gym', async () => {
    await request(app.getHttpServer())
      .get(`/api/disciplines/${disciplineIdInIronGym}`)
      .set('Authorization', `Bearer ${flexAdminToken}`)
      .expect(404);
  });

  it('un MEMBER no puede crear una disciplina (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/disciplines')
      .set('Authorization', `Bearer ${ironMemberToken}`)
      .send({ name: `Intento-${randomUUID().slice(0, 8)}` })
      .expect(403);
  });

  it('un ADMIN no puede crear un gimnasio (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/gyms')
      .set('Authorization', `Bearer ${ironAdminToken}`)
      .send({
        name: 'Gimnasio No Autorizado',
        slug: `no-autorizado-${randomUUID().slice(0, 8)}`,
        adminEmail: `intento-${randomUUID().slice(0, 8)}@test.dev`,
        adminPassword: 'Password123!',
        adminFullName: 'Nadie',
      })
      .expect(403);
  });

  it('SUPER_ADMIN puede crear un gimnasio con su primer admin, sin exponer el hash', async () => {
    const suffix = randomUUID().slice(0, 8);

    const response = await request(app.getHttpServer())
      .post('/api/gyms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `Gimnasio Test ${suffix}`,
        slug: `gimnasio-test-${suffix}`,
        adminEmail: `admin-${suffix}@test.dev`,
        adminPassword: 'Password123!',
        adminFullName: 'Admin de prueba',
      })
      .expect(201);

    const body = response.body as {
      gym: { id: string };
      admin: { email: string; passwordHash?: string };
    };
    expect(body.gym.id).toEqual(expect.any(String));
    expect(body.admin.email).toBe(`admin-${suffix}@test.dev`);
    expect(body.admin.passwordHash).toBeUndefined();
  });

  it('regla central: un miembro con plan "Solo Spinning" solo ve clases de Spinning', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/class-sessions/available')
      .set('Authorization', `Bearer ${ironMemberToken}`)
      .expect(200);

    const disciplineNames = new Set(
      (response.body as Array<{ disciplineName: string }>).map(
        (session) => session.disciplineName,
      ),
    );

    expect(disciplineNames.size).toBeGreaterThan(0);
    expect([...disciplineNames]).toEqual(['Spinning']);
  });
});
