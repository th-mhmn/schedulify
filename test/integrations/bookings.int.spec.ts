import { AppModule } from '@/app.module';
import { BookingsService } from '@/bookings/bookings.service';
import { CreateBookingDto } from '@/bookings/dto/create-booking.dto';
import { Business, Service, User } from '@/generated/prisma/client';
import { NotificationQueue } from '@/notifications/notification.queue';
import { PrismaService } from '@/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('BookingsService Integration', () => {
  let module: TestingModule;
  let service: BookingsService;
  let prisma: PrismaService;

  let owner: User;
  let customer: User;
  let business: Business;
  let bookingService: Service;

  let business_2: Business;
  let bookingService_2: Service;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NotificationQueue)
      .useValue({ enqueueBookingCreated: jest.fn() })
      .compile();

    service = module.get(BookingsService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.workingHours.deleteMany();
    await prisma.service.deleteMany();
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
    await prisma.availabilityBlock.deleteMany();

    owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        passwordHash: 'hashed',
        role: 'BUSINESS_OWNER',
      },
    });

    customer = await prisma.user.create({
      data: {
        email: 'customer@test.com',
        passwordHash: 'hashed',
        role: 'USER',
      },
    });

    business = await prisma.business.create({
      data: {
        name: 'Barbershop',
        timezone: 'UTC',
        owner: { connect: { id: owner.id } },
      },
    });

    bookingService = await prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Haircut',
        durationMinutes: 60,
        priceCents: 1000,
      },
    });

    await prisma.workingHours.create({
      data: {
        businessId: business.id,
        dayOfWeek: 0,
        startMinute: 9 * 60,
        endMinute: 18 * 60,
      },
    });
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const dto: CreateBookingDto = {
        businessId: business.id,
        serviceId: bookingService.id,
        startTime: '2026-06-15T09:00:00+00:00',
      };

      await service.create(dto, customer.id);

      const booking = await prisma.booking.findFirst({
        where: { userId: customer.id },
      });

      expect(booking).toBeDefined();
      expect(booking?.userId).toBe(customer.id);
      expect(booking?.businessId).toBe(business.id);
      expect(booking?.serviceId).toBe(bookingService.id);
    });
    describe('resources', () => {
      it('should throw when business does not exist', async () => {
        const dto: CreateBookingDto = {
          businessId: 213213,
          serviceId: bookingService.id,
          startTime: '2026-06-15T09:00:00+00:00',
        };

        await expect(service.create(dto, customer.id)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw when owner books their own business', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T09:00:00+00:00',
        };

        await expect(service.create(dto, owner.id)).rejects.toThrow(
          ConflictException,
        );
      });

      it('should throws if service belongs to another business', async () => {
        business_2 = await prisma.business.create({
          data: {
            name: 'Dentist',
            timezone: 'Europe/Paris',
            owner: { connect: { id: owner.id } },
          },
        });

        bookingService_2 = await prisma.service.create({
          data: {
            businessId: business_2.id,
            name: 'Bleach',
            durationMinutes: 20,
            priceCents: 2000,
          },
        });

        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService_2.id,
          startTime: '2026-06-15T09:00:00+00:00',
        };

        await expect(service.create(dto, customer.id)).rejects.toThrow(
          NotFoundException,
        );
      });

      it(`should throw when service doesn't exist `, async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: 21341,
          startTime: '2026-06-15T09:00:00+00:00',
        };

        await expect(service.create(dto, customer.id)).rejects.toThrow();
      });
    });
    describe('working hours', () => {
      it('should create booking exactly at opening time', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T09:00:00+00:00',
        };

        await service.create(dto, customer.id);

        const booking = await prisma.booking.findFirst({
          where: { userId: customer.id },
        });

        expect(booking).toBeDefined();
        expect(booking?.userId).toBe(customer.id);
        expect(booking?.businessId).toBe(business.id);
        expect(booking?.serviceId).toBe(bookingService.id);
      });

      it('should create booking exactly before closing time', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T17:00:00+00:00',
        };

        await service.create(dto, customer.id);

        const booking = await prisma.booking.findFirst({
          where: { userId: customer.id },
        });

        expect(booking).toBeDefined();
        expect(booking?.userId).toBe(customer.id);
        expect(booking?.businessId).toBe(business.id);
        expect(booking?.serviceId).toBe(bookingService.id);
      });

      it('should throw when time slot is outside working hours', async () => {
        const dto_before_opening: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T08:00:00+00:00',
        };
        const dto_after_closing: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T19:00:00+00:00',
        };

        await expect(
          service.create(dto_before_opening, customer.id),
        ).rejects.toThrow(ConflictException);
        await expect(
          service.create(dto_after_closing, customer.id),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw when booking would extend beyond closing', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T17:30:00+00:00',
        };

        await expect(service.create(dto, customer.id)).rejects.toThrow(
          ConflictException,
        );
      });
    });
    describe('closed day', () => {
      it('should throw when no working hours exist for day', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-16T09:00:00+00:00',
        };
        await expect(service.create(dto, customer.id)).rejects.toThrow(
          ConflictException,
        );
      });
    });
    describe('existing bookings', () => {
      it('should throw when slot already reserved', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T09:00:00+00:00',
        };
        await service.create(dto, customer.id);
        await expect(service.create(dto, customer.id)).rejects.toThrow(
          ConflictException,
        );
      });
    });
    describe('availability blocks', () => {
      it('should throw when owner blocked timespan', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T11:00:00+00:00',
        };

        await prisma.availabilityBlock.create({
          data: {
            startTime: new Date('2026-06-15T10:30:00+00:00'),
            endTime: new Date('2026-06-15T11:30:00+00:00'),
            reason: 'lunch',
            businessId: business.id,
          },
        });
        await expect(service.create(dto, customer.id)).rejects.toThrow(
          ConflictException,
        );
      });
    });
    describe('timezone', () => {
      it('should create booking when timezone is different but inside working hours', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T14:00:00+04:00',
        };
        await service.create(dto, customer.id);

        const booking = await prisma.booking.findFirst({
          where: { userId: customer.id },
        });

        expect(booking).toBeDefined();
        expect(booking?.userId).toBe(customer.id);
        expect(booking?.businessId).toBe(business.id);
        expect(booking?.serviceId).toBe(bookingService.id);
      });

      it('should create booking when timezone is different and outside working hours', async () => {
        const dto: CreateBookingDto = {
          businessId: business.id,
          serviceId: bookingService.id,
          startTime: '2026-06-15T10:00:00+04:00',
        };

        await expect(service.create(dto, customer.id)).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });

  describe('findUserBookings', () => {
    it('should return user bookings, does not return bookings from other users', async () => {
      const dto: CreateBookingDto = {
        businessId: business.id,
        serviceId: bookingService.id,
        startTime: '2026-06-15T09:00:00+00:00',
      };
      await service.create(dto, customer.id);
      const { bookings } = await service.findUserBookings(customer.id);
      expect(bookings).toHaveLength(1);
      expect(bookings[0].userId).toEqual(customer.id);
    });

    it('should return empty array if no bookings found', async () => {
      const { bookings } = await service.findUserBookings(customer.id);
      expect(bookings).toEqual([]);
    });
  });
});
