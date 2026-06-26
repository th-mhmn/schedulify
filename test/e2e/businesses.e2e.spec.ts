import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db';
import { expectSuccessResponse } from '../helpers/response';

describe('Businesses E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const user = {
    email: 'user@test.com',
    password: 'Password123!',
  };

  const business = { name: 'Business-1', timezone: 'UTC' };

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create Business', () => {
    it('should create business', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = response.headers['set-cookie'];

      const businessRes = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send(business);

      expect(businessRes.status).toBe(201);
      expectSuccessResponse(businessRes.body, {
        business: {
          ...business,
          id: expect.any(Number),
        },
      });
    });
    it('should set user role to BUSINESS_OWNER after adding a business', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = response.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send(business);

      const userRecord = await prisma.user.findUnique({
        where: { email: user.email },
      });

      expect(userRecord?.role).toBe('BUSINESS_OWNER');
    });
    it('should return 400 if business name is duplicate', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = userResponse.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send(business);

      const res = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send(business);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('business already exists');
    });
    it('should return 401 if cookie is not provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/businesses')
        .send(business);

      expect(res.status).toBe(401);
    });
    it('should return 400 if business name is too short', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = userResponse.headers['set-cookie'];

      const businessRes = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send({ timezone: 'UTC', name: 'xxx' });
      expect(businessRes.status).toBe(400);
      expect(businessRes.body.message[0]).toContain('must be longer');
    });
    it('should return 400 if business timezone is invalid', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = userResponse.headers['set-cookie'];

      const businessRes = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send({ name: 'business', timezone: 'xxx' });

      expect(businessRes.status).toBe(400);
      expect(businessRes.body.message[0]).toEqual(
        'timezone must be a valid IANA time-zone',
      );
    });
  });
  describe('Get Business', () => {
    it('should return user businesses', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = userResponse.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send(business);

      const businessesRes = await request(app.getHttpServer())
        .get('/businesses/my')
        .set('Cookie', cookie);
      const { businesses } = businessesRes.body.data;

      expect(businessesRes.status).toBe(200);
      expect(businesses).toHaveLength(1);
      expect(businesses[0].name).toBe(business.name);
    });
    it('should return single business by id', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(user);

      const cookie = userResponse.headers['set-cookie'];

      const businessRes = await request(app.getHttpServer())
        .post('/businesses')
        .set('Cookie', cookie)
        .send(business);

      const { id } = businessRes.body.data.business;

      const singleBusinessRes = await request(app.getHttpServer()).get(
        `/businesses/${id}`,
      );

      expectSuccessResponse(singleBusinessRes.body, {
        business: {
          ...business,
          id: expect.any(Number),
        },
      });
    });
  });
});
