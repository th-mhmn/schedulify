import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db';
import { expectSuccessResponse } from '../helpers/response';

/* 
* Test Overview:
    ? Working Hours: Monday(0) 26-06-22, Tuesday(1) 26-06-23, Wednesday(2) 26-06-24 -> 09:00 - 18:00
    ? Blocks: Monday(0) 26-06-22 -> 13:00 - 13:30
*/

describe('Booking E2E', () => {
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
    {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
    },
    {
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '18:00',
    },
  ];
  const block = {
    // * Monday
    startTime: '2026-06-22T13:00:00.000Z',
    endTime: '2026-06-22T13:30:00.000Z',
    reason: 'lunch',
  };

  async function sendBooking(body: any, cookie: string) {
    return await request(app.getHttpServer())
      .post(`/bookings`)
      .set('Cookie', cookie)
      .set('Idempotency-Key', randomUUID())
      .send(body);
  }

  async function expectNoRecord(body: { data?: { booking?: { id: number } } }) {
    await expect(
      prisma.booking.findUnique({
        where: { id: body?.data?.booking?.id },
      }),
    ).rejects.toThrow();
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

    await request(app.getHttpServer())
      .post(`/businesses/${businessId}/blocks`)
      .set('Cookie', ownerCookie)
      .send(block);

    // * ------ Customer Setup ------

    const customerResponse = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(customer);
    customerCookie = customerResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create Booking', () => {
    describe('Happy Path', () => {
      it('should create booking successfully', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T09:00:00.000Z',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(201);
        expectSuccessResponse(res.body, {
          booking: {
            ...booking,
            id: expect.any(Number),
          },
        });
        const record = await prisma.booking.findUnique({
          where: { id: res.body.data.booking.id },
        });
        expect(record).toBeDefined();
      });
      it('should create booking successfully when input has timezone offset', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T12:00:00+03:00',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(201);
        expectSuccessResponse(res.body, {
          booking: {
            ...booking,
            startTime: '2026-06-22T09:00:00.000Z',
            id: expect.any(Number),
          },
        });
        const record = await prisma.booking.findUnique({
          where: { id: res.body.data.booking.id },
        });
        expect(record).toBeDefined();
      });
    });
    describe('Failures', () => {
      it('should return 400 if booking startTime is outside working hours', async () => {
        const booking = {
          businessId,
          serviceId,
          // * Before working start hour
          startTime: '2026-06-22T08:00:00.000Z',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(400);
        expect(res.body.message.toLowerCase()).toContain(
          'outside working hours',
        );

        const res2 = await sendBooking(
          {
            ...booking,
            // * After working end hour
            startTime: '2026-06-22T18:00:00.000Z',
          },
          customerCookie,
        );
        expect(res2.status).toBe(400);
        expect(res2.body.message.toLowerCase()).toContain(
          'outside working hours',
        );
        expectNoRecord(res2.body);
      });
      it('should return 400 if booking time exceeds working hours', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T17:30:00.000Z',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(400);
        expect(res.body.message.toLowerCase()).toContain(
          'outside working hours',
        );
      });
      it('should return 400 if it overlaps another booking', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T17:30:00.000Z',
        };
        await sendBooking(booking, customerCookie);
        const res = await sendBooking(
          // * booking 5 minutes after previous booking
          { ...booking, startTime: '2026-06-22T17:40:00.000Z' },
          customerCookie,
        );
        expect(res.status).toBe(400);
        expectNoRecord(res.body);
      });
      it('should return 400 if startTime is not a valid ISO', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(400);
        expect(res.body.message[0]).toContain(
          'must be a valid ISO datetime and aligned to 5-minute intervals',
        );
      });
      it('should return 401 if cookie is not provided', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T17:30:00.000Z',
        };
        const res = await sendBooking(booking, '');
        expect(res.status).toBe(401);
        expect(res.body.message.toLowerCase()).toContain('unauthorized');
      });
      it('should return 404 if is business not found', async () => {
        const booking = {
          businessId: businessId + 1,
          serviceId,
          startTime: '2026-06-22T08:00:00.000Z',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(404);
        expect(res.body.message.toLowerCase()).toContain('business not found');
      });
      it('should return 404 if service not found / does not belong to the business', async () => {
        const booking = {
          businessId,
          serviceId: serviceId + 1,
          startTime: '2026-06-22T08:00:00.000Z',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(404);
        expect(res.body.message.toLowerCase()).toContain('service not found');
      });
      it('should return 409 if it overlaps availability block', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T12:45:00.000Z',
        };
        const res = await sendBooking(booking, customerCookie);
        expect(res.status).toBe(409);
        expectNoRecord(res.body);
        expect(res.body.message.toLowerCase()).toContain(
          'owner has blocked this time span for reservations',
        );
      });
      it('should return 409 if owner tries to book a reservation for their own service', async () => {
        const booking = {
          businessId,
          serviceId,
          startTime: '2026-06-22T08:00:00.000Z',
        };
        const res = await sendBooking(booking, ownerCookie);
        expect(res.status).toBe(409);
        expect(res.body.message.toLowerCase()).toContain(
          'you cannot book a reservation for your own service',
        );
      });
    });
  });
});
