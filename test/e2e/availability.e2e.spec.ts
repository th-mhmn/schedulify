import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db';

describe('Service Availability E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerCookie: string;
  let customerCookie: string;
  let businessId: number;
  let serviceId: number;

  const owner = {
    email: 'owner@test.com',
    password: 'Password123!',
  };
  const customer = {
    email: 'customer@test.com',
    password: 'Password123!',
  };
  const business = { name: 'Business', timezone: 'UTC' };
  const service = {
    name: 'service',
    durationMinutes: 60,
    priceCents: 400,
  };
  const weeklySchedule = [
    {
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '18:00',
    },
  ];
  const block = {
    startTime: '2026-06-22T11:00:00.000Z',
    endTime: '2026-06-22T11:30:00.000Z',
    reason: 'lunch',
  };

  async function sendBooking(body: any, cookie: string) {
    await request(app.getHttpServer())
      .post(`/bookings`)
      .set('Cookie', cookie)
      .set('Idempotency-Key', randomUUID())
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

    // * ------ Owner Setup ------

    const ownerResponse = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(owner);
    ownerCookie = ownerResponse.headers['set-cookie'];

    const businessRes = await request(app.getHttpServer())
      .post('/businesses')
      .set('Cookie', ownerCookie)
      .send(business);
    businessId = businessRes.body.data.business.id;

    await request(app.getHttpServer())
      .put(`/businesses/${businessId}/working-hours`)
      .set('Cookie', ownerCookie)
      .send({ days: weeklySchedule });

    const serviceRes = await request(app.getHttpServer())
      .post(`/businesses/${businessId}/services`)
      .set('Cookie', ownerCookie)
      .send(service);
    serviceId = serviceRes.body.data.service.id;

    // ? 11:00 - 11:30 is blocked
    await request(app.getHttpServer())
      .post(`/businesses/${businessId}/blocks`)
      .set('Cookie', ownerCookie)
      .send(block);

    // * ------ Customer Setup ------

    const customerResponse = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(customer);
    customerCookie = customerResponse.headers['set-cookie'];

    const bookingDto = {
      businessId,
      serviceId,
      startTime: '2026-06-22T09:00:00.000Z',
    };

    // ? 09:00 - 10:00 is reserved
    await sendBooking(bookingDto, customerCookie);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Get Availability', () => {
    it('should return slots available for reservation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/services/${serviceId}/availability`)
        .query({ date: '2026-06-22' });
      expect(res.status).toBe(200);
      expect(res.body.message.toLowerCase()).toContain('success');
      expect(res.body.data.slots).toBeDefined();
    });
    it('slots array should not contain timespan from reservations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/services/${serviceId}/availability`)
        .query({ date: '2026-06-22' });

      const slots: string[] = res.body.data.slots;
      // * From 09:00 until 10:00 is reserved
      expect(slots.includes('2026-06-22T09:05:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T09:30:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T09:55:00.000Z')).toBe(false);

      // * 10:00 is open for reservation
      expect(slots.includes('2026-06-22T10:00:00.000Z')).toBe(true);
    });
    it('slots array should not contain timespan from blocks', async () => {
      const res = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/services/${serviceId}/availability`)
        .query({ date: '2026-06-22' });

      const slots: string[] = res.body.data.slots;
      // * The owner has blocked reservations from 11:00 until 11:30
      expect(slots.includes('2026-06-22T11:00:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T11:15:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T11:25:00.000Z')).toBe(false);

      // * 11:30 is open for reservation
      expect(slots.includes('2026-06-22T11:30:00.000Z')).toBe(true);
    });
    it('should not return slots that cannot complete before closing time', async () => {
      const res = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/services/${serviceId}/availability`)
        .query({ date: '2026-06-22' });

      const slots: string[] = res.body.data.slots;
      // * Working hours close at 18:00, service duration is 60 minutes
      // * Last valid slot is 17:00 (17:00 + 60min = 18:00)
      expect(slots.includes('2026-06-22T17:00:00.000Z')).toBe(true);

      // * 17:05 would end at 18:05, past closing — must not appear
      expect(slots.includes('2026-06-22T17:05:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T17:30:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T17:55:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T18:00:00.000Z')).toBe(false);
    });
    it('should not return slots that cannot complete before blocked time', async () => {
      const res = await request(app.getHttpServer())
        .get(`/businesses/${businessId}/services/${serviceId}/availability`)
        .query({ date: '2026-06-22' });

      const slots: string[] = res.body.data.slots;
      // * Block hours start from 11:00, service duration is 60 minutes
      // * Last valid slot before block is 10:00 (10:00 + 60min = 11:00)
      expect(slots.includes('2026-06-22T10:00:00.000Z')).toBe(true);

      // * 10:05 would end at 11:05, inside blocks hours - must not appear
      expect(slots.includes('2026-06-22T10:05:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T10:25:00.000Z')).toBe(false);
      expect(slots.includes('2026-06-22T10:55:00.000Z')).toBe(false);
    });
  });
});
