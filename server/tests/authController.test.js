const supertest = require('supertest');
const app = require('../src/app');
const { db, close } = require('../src/config/db');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  let server;
  let testUser;

  beforeAll(async () => {
    server = app.listen(4002);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('password123', salt);

    testUser = await db.one(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      ['test2fa@example.com', 'Test 2FA User', password_hash]
    );
  });

  afterAll(async () => {
    await db.none('DELETE FROM users WHERE email = $1', ['test2fa@example.com']);
    server.close();
  });

  it('should setup 2FA', async () => {
    const response = await supertest(server)
      .post('/api/auth/login')
      .send({ email: 'test2fa@example.com', password: 'password123' });

    const token = response.body.accessToken;

    const setupResponse = await supertest(server)
      .post('/api/auth/setup-2fa')
      .set('Authorization', `Bearer ${token}`);

    expect(setupResponse.status).toBe(200);
    expect(setupResponse.body.secret).toBeDefined();
    expect(setupResponse.body.qrCodeUrl).toBeDefined();
  });

  it('should verify 2FA', async () => {
    const response = await supertest(server)
      .post('/api/auth/login')
      .send({ email: 'test2fa@example.com', password: 'password123' });

    const token = response.body.accessToken;

    const setupResponse = await supertest(server)
      .post('/api/auth/setup-2fa')
      .set('Authorization', `Bearer ${token}`);

    const secret = setupResponse.body.secret;
    const speakeasy = require('speakeasy');
    const otp = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
    });

    const verifyResponse = await supertest(server)
      .post('/api/auth/verify-2fa')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: otp });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.success).toBe(true);
  });

  it('should disable 2FA', async () => {
    const response = await supertest(server)
      .post('/api/auth/login')
      .send({ email: 'test2fa@example.com', password: 'password123' });

    const token = response.body.accessToken;

    const disableResponse = await supertest(server)
      .post('/api/auth/disable-2fa')
      .set('Authorization', `Bearer ${token}`);

    expect(disableResponse.status).toBe(200);
    expect(disableResponse.body.success).toBe(true);
  });
});
