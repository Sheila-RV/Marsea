import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/bootstrap-app';

// Usa las credenciales que deja prisma/seed.ts. Correr `npx prisma db seed`
// antes de `npm run test:e2e` si esto falla con 401 en el primer test.
const SEEDED_ADMIN_EMAIL = 'admin@iron-gym.dev';
const SEEDED_ADMIN_PASSWORD = 'IronAdmin123!';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login con credenciales correctas responde 200 con un accessToken', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: SEEDED_ADMIN_EMAIL, password: SEEDED_ADMIN_PASSWORD })
      .expect(200);

    const body = response.body as { accessToken: string };
    expect(typeof body.accessToken).toBe('string');
  });

  it('el accessToken permite acceder a /api/auth/me', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: SEEDED_ADMIN_EMAIL, password: SEEDED_ADMIN_PASSWORD });

    const { accessToken } = loginResponse.body as { accessToken: string };

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meBody = meResponse.body as { role: string; gymId: string };
    expect(meBody.role).toBe('ADMIN');
    expect(typeof meBody.gymId).toBe('string');
  });

  it('contraseña incorrecta responde 401 con el mismo mensaje que un email inexistente', async () => {
    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: SEEDED_ADMIN_EMAIL, password: 'incorrecta' })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nadie@nunca-existio.dev', password: 'lo-que-sea' })
      .expect(401);

    const wrongPasswordBody = wrongPassword.body as { message: string };
    const unknownEmailBody = unknownEmail.body as { message: string };
    expect(wrongPasswordBody.message).toBe(unknownEmailBody.message);
  });

  it('/api/auth/me sin token responde 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });
});
