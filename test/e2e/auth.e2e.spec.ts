import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { expectSuccessResponse } from '../helpers/response';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.ENV_FILE = '.env.e2e';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.use(cookieParser());

    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Sign Up', () => {
    it('should register successfully', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(dto);

      expect(response.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email: dto.email },
      });

      expect(user).toBeTruthy();
      expect(user?.role).toBe('USER');
      expect(user?.passwordHash).not.toBe(dto.password);
    });
    it('should return 400 if email is duplicated', async () => {
      const email = 'owner@test.com';
      const password = 'Password123!';

      await prisma.user.create({
        data: {
          email,
          passwordHash: 'hashed',
          role: 'USER',
        },
      });

      request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email,
          password,
        })
        .expect(400);
    });
    it('should return 400 if dto is invalid', async () => {
      request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: 'email.com',
          password: '123',
        })
        .expect(400);

      request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: 'email@mail.com',
        })
        .expect(400);
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer()).post('/auth/sign-up').send(dto);

      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(dto);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.status).toBe(200);
    });
    it('should return 401 if password is wrong', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer()).post('/auth/sign-up').send(dto);

      request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: dto.email, password: '123' })
        .expect(401);
    });
    it('should return 401 when email is unknown', async () => {
      request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'unknown@test.com', password: '123' })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 if cookie header is not provided', async () => {
      request(app.getHttpServer()).post('/businesses').expect(401);
    });
    it('should pass if cookie is valid', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer()).post('/auth/sign-up').send(dto);

      const signInRes = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(dto);

      const cookie = signInRes.headers['set-cookie'];

      const businessRes = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send({ name: 'Business-1', timezone: 'UTC' });

      expect(businessRes.status).toBe(201);
    });
  });

  describe('Sign Out', () => {
    it('should return 401 after logout', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer()).post('/auth/sign-up').send(dto);

      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(dto);

      const cookie = response.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/auth/sign-out')
        .set('Cookie', cookie);

      request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .expect(401);
    });
  });

  describe('Profile', () => {
    it('should return user data', async () => {
      const dto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      const signUpRes = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(dto);

      const cookie = signUpRes.headers['set-cookie'];

      const profileRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookie);

      expect(profileRes.status).toBe(200);
      expectSuccessResponse(profileRes.body, {
        id: expect.any(Number),
        email: dto.email,
        role: 'USER',
      });
    });
  });
});
