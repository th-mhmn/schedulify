import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db';

// ? First Day of Week (index: 0) = Monday

describe('Working Hours E2E', () => {
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

  const dailySchedule = {
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '18:00',
  };

  async function setSchedule(body: any, cookie: string, business_id?: number) {
    return await request(app.getHttpServer())
      .put(`/businesses/${business_id || businessId}/working-hours`)
      .set('Cookie', cookie)
      .send({ days: body });
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create Weekly Schedule', () => {
    it('should create schedule successfully', async () => {
      // ? Schedule for this test: Monday & Thursday - 09:00 -> 18:00
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: 3 }],
        cookie,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Success');
      const schedule: (typeof dailySchedule)[] = res.body.data;
      expect(schedule[0].dayOfWeek).toBe('Monday');
      expect(schedule[0].startTime).toBe(dailySchedule.startTime);
      expect(schedule[0].endTime).toBe(dailySchedule.endTime);
      expect(schedule[1].dayOfWeek).toBe('Thursday');
    });
    it('should return 400 if hour format is not HH:MM', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, startTime: '233' }],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain('must be HH:mm');
    });
    it('should return 400 if starting time is later than ending time', async () => {
      const res = await setSchedule(
        [
          dailySchedule,
          { ...dailySchedule, startTime: '21:00', endTime: '20:00' },
        ],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'startTime must be earlier than endTime',
      );
    });
    it('should return 400 if starting time is equal to ending time', async () => {
      const res = await setSchedule(
        [
          dailySchedule,
          { ...dailySchedule, startTime: '21:00', endTime: '21:00' },
        ],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'startTime must be earlier than endTime',
      );
    });
    it('should return 400 if a day is scheduled twice at the same request', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule }],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain('dayOfWeek must be unique');
    });
    it('should return 400 if time minutes is not divisible by 5', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, startTime: '08:32' }],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'startTime must be HH:mm (24h) and aligned to 5-minute intervals',
      );
    });
    it('should return 400 if dayOfWeek is less than 0 ', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: -1 }],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'dayOfWeek must not be less than 0',
      );
    });
    it('should return 400 if dayOfWeek is greater than 6 ', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: 7 }],
        cookie,
      );
      expect(res.status).toBe(400);
      expect(res.body.message[0]).toContain(
        'dayOfWeek must not be greater than 6',
      );
    });
    it('should return 400 if business is not found', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: 3 }],
        cookie,
        businessId + 1,
      );
      expect(res.status).toBe(400);
    });
    it('should return 401 if cookie is not provided', async () => {
      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: -1 }],
        '',
      );
      expect(res.status).toBe(401);
    });
    it('should return 403 if user sets schedule for other business', async () => {
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

      const res = await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: 1 }],
        cookie,
        business2Id,
      );

      expect(res.status).toBe(403);
      expect(res.body.message).toContain(
        'You can only access your own resources',
      );
    });
  });
  describe('Read Schedule', () => {
    it('should return the weekly schedule', async () => {
      await setSchedule(
        [dailySchedule, { ...dailySchedule, dayOfWeek: 3 }],
        cookie,
      );

      const res = await request(app.getHttpServer()).get(
        `/businesses/${businessId}/working-hours`,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Success');
      const schedule: (typeof dailySchedule)[] = res.body.data;
      expect(schedule[0].dayOfWeek).toBe('Monday');
      expect(schedule[0].startTime).toBe(dailySchedule.startTime);
      expect(schedule[0].endTime).toBe(dailySchedule.endTime);
      expect(schedule[1].dayOfWeek).toBe('Thursday');
    });
  });
  describe('Update Weekly Schedule', () => {
    it('should update the schedule', async () => {
      const schedule1 = [dailySchedule, { ...dailySchedule, dayOfWeek: 3 }];
      const schedule2 = [{ ...dailySchedule, dayOfWeek: 6, endTime: '15:00' }];

      await setSchedule(schedule1, cookie);
      await setSchedule(schedule2, cookie);

      const res = await request(app.getHttpServer()).get(
        `/businesses/${businessId}/working-hours`,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Success');
      const schedule: (typeof dailySchedule)[] = res.body.data;
      expect(schedule[0].dayOfWeek).toBe('Sunday');
      expect(schedule[0].startTime).toBe(schedule2[0].startTime);
      expect(schedule[0].endTime).toBe(schedule2[0].endTime);
    });
  });
});
