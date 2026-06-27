import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db';
import { expectSuccessResponse } from '../helpers/response';

describe('Services E2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userResponse;
  let cookie: string;
  let businessRes;
  let businessId;

  const user = {
    email: 'user@test.com',
    password: 'Password123!',
  };

  const business = { name: 'Business', timezone: 'UTC' };

  const service = {
    name: 'service',
    durationMinutes: 60,
    priceCents: 400,
  };

  beforeAll(async () => {
    process.env.ENV_FILE = '.env.e2e';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.use(cookieParser());

    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    userResponse = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(user);

    cookie = userResponse.headers['set-cookie'];

    businessRes = await request(app.getHttpServer())
      .post('/businesses')
      .set('Cookie', cookie)
      .send(business);

    businessId = businessRes.body.data.business.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create Service', () => {
    it('should create service for business', async () => {
      const serviceRes = await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .set('Cookie', cookie)
        .send(service);

      expect(serviceRes.status).toBe(201);
      expectSuccessResponse(serviceRes.body, {
        service: {
          ...service,
          id: expect.any(Number),
        },
      });
    });
    it('should return 401 if cookie is not provided', async () => {
      const serviceRes = await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .send(service);

      expect(serviceRes.status).toBe(401);
    });
    it('should return 400 if service duration is not divisible by 5', async () => {
      const serviceRes = await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .set('Cookie', cookie)
        .send({ ...service, durationMinutes: 23 });

      expect(serviceRes.status).toBe(400);
    });
    it('should return 400 if price is less than 0', async () => {
      const serviceRes = await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .set('Cookie', cookie)
        .send({ ...service, priceCents: -1 });

      expect(serviceRes.status).toBe(400);
    });
    it('should return 400 if service name is duplicate', async () => {
      await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .set('Cookie', cookie)
        .send(service);

      const serviceRes = await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .set('Cookie', cookie)
        .send(service);

      expect(serviceRes.status).toBe(400);
      expect(serviceRes.body.message).toContain(
        'service already exists with the given name',
      );
    });
    it('should return 403 if user creates service for other business', async () => {
      // ? User1 tries to add service to User2's business

      const user2Response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ ...user, email: 'user2@test.com' });

      const cookie_user2 = user2Response.headers['set-cookie'];

      const business2Res = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie_user2)
        .send(business);

      const business2Id = business2Res.body.data.business.id;

      const serviceRes = await request(app.getHttpServer())
        .post(`/businesses/${business2Id}/services`)
        .set('Cookie', cookie)
        .send(service);

      expect(serviceRes.status).toBe(403);
      expect(serviceRes.body.message).toContain(
        'You can only access your own resources',
      );
    });
  });
  describe('List Services', () => {
    it('should return services of a business', async () => {
      await request(app.getHttpServer())
        .post(`/businesses/${businessId}/services`)
        .set('Cookie', cookie)
        .send(service);

      const servicesRes = await request(app.getHttpServer()).get(
        `/businesses/${businessId}/services`,
      );

      const { services } = servicesRes.body.data;
      expect(services).toHaveLength(1);
      expect(services[0]).toMatchObject(service);
    });
    it('should return 404 if business not found', async () => {
      const servicesRes = await request(app.getHttpServer()).get(
        `/businesses/${businessId + 1}/services`,
      );
      expect(servicesRes.status).toBe(404);
      expect(servicesRes.body.message).toContain('business not found');
    });
  });
});
