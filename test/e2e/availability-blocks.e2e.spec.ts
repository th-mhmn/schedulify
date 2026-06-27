import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db';
import { expectSuccessResponse } from '../helpers/response';

describe('Availability Block E2E', () => {
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

  const block = {
    startTime: '2026-06-28T13:00:00.000Z',
    endTime: '2026-06-28T13:30:00.000Z',
    reason: 'lunch',
  };

  const dailySchedule = {
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '18:00',
  };

  async function setBlock(body: any, cookie: string, business_id?: number) {
    return await request(app.getHttpServer())
      .post(`/businesses/${business_id || businessId}/blocks`)
      .set('Cookie', cookie)
      .send(body);
  }

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

    await request(app.getHttpServer())
      .put(`/businesses/${businessId}/working-hours`)
      .set('Cookie', cookie)
      .send({ days: [dailySchedule] });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create Block', () => {
    it('should create block successfully', async () => {
      const res = await setBlock(block, cookie);
      expect(res.status).toBe(201);
      expectSuccessResponse(res.body, {
        block: {
          ...block,
          id: expect.any(Number),
        },
      });
    });
    it('should create blocks if two blocks are back to back', async () => {
      await setBlock(block, cookie);
      const block2 = {
        startTime: '2026-06-28T13:30:00.000Z',
        endTime: '2026-06-28T13:40:00.000Z',
      };
      const res = await setBlock(block2, cookie);

      expect(res.status).toBe(201);
      expectSuccessResponse(res.body, {
        block: {
          ...block2,
          id: expect.any(Number),
        },
      });
    });
    it('should return 400 if time is not a valid ISO', async () => {
      const res = await setBlock(
        { ...block, startTime: '2026-06-28T13:02:00.000Z' },
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'must be a valid ISO datetime and aligned to 5-minute intervals',
      );
    });
    it('should return 400 if time is not divisible by 5', async () => {
      const res = await setBlock({ ...block, startTime: 'xyz' }, cookie);
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'must be a valid ISO datetime and aligned to 5-minute intervals',
      );
    });
    it('should return 401 if cookie is not provided', async () => {
      const res = await setBlock(block, '');
      expect(res.status).toBe(401);
      expect(res.body.message.toLowerCase()).toContain('unauthorized');
    });
    it('should return 403 if user add block for other business', async () => {
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

      const res = await request(app.getHttpServer())
        .post(`/businesses/${business2Id}/blocks`)
        .set('Cookie', cookie)
        .send(block);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain(
        'You can only access your own resources',
      );
    });
    it('should return 409 if blocks overlap', async () => {
      await setBlock(block, cookie);
      const res = await setBlock(
        {
          startTime: '2026-06-28T12:00:00.000Z',
          endTime: '2026-06-28T13:40:00.000Z',
        },
        cookie,
      );
      expect(res.status).toBe(409);
      expect(res.body.message).toContain(
        'Blocks are overlapping on this time-span',
      );
    });
  });
  describe('Get Blocks', () => {
    it('should return blocks for the business', async () => {
      await setBlock(block, cookie);
      const blocksRes = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/blocks`)
        .set('Cookie', cookie)
        .query({ from: block.startTime, to: block.endTime });
      expect(blocksRes.status).toBe(200);
      expect(blocksRes.body.message).toBe('Success');
      const { blocks } = blocksRes.body.data;
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toMatchObject(block);
    });
    it('should return 400 if from and to queries are not provided', async () => {
      const blocksRes = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/blocks`)
        .set('Cookie', cookie);
      expect(blocksRes.status).toBe(400);
      expect(blocksRes.body.message[0]).toContain(
        'must be ISO and in 5-minute steps',
      );
    });
    it('should return 400 if blocks timespan is outside business working hours', async () => {
      // ? startTime < Working Hours Start
      const block1Res = await setBlock(
        {
          startTime: '2026-06-28T07:30:00.000Z',
          endTime: '2026-06-28T08:30:00.000Z',
        },
        cookie,
      );
      expect(block1Res.status).toBe(400);
      expect(block1Res.body.message).toContain(
        'block timespan is outside working hours',
      );

      // ? endTime > Working Hours Start
      const block2Res = await setBlock(
        {
          startTime: '2026-06-28T17:30:00.000Z',
          endTime: '2026-06-28T18:30:00.000Z',
        },
        cookie,
      );
      expect(block2Res.status).toBe(400);
      expect(block2Res.body.message).toContain(
        'block timespan is outside working hours',
      );

      // ? both endTime & startTime outside working hours
      const block3Res = await setBlock(
        {
          startTime: '2026-06-28T04:30:00.000Z',
          endTime: '2026-06-28T05:30:00.000Z',
        },
        cookie,
      );
      expect(block3Res.status).toBe(400);
      expect(block3Res.body.message).toContain(
        'block timespan is outside working hours',
      );
    });
  });
});
