import { AppModule } from '@/app.module';
import { BusinessesService } from '@/businesses/businesses.service';
import { CreateBusinessDto } from '@/businesses/dto/create-business.dto';
import { Business, User } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('BusinessesService Integration', () => {
  let module: TestingModule;
  let service: BusinessesService;
  let prisma: PrismaService;

  let userTest: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get(BusinessesService);
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

    userTest = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        passwordHash: 'hashed',
        role: 'USER',
      },
    });
  });

  describe('create', () => {
    it('should create business', async () => {
      const dto: CreateBusinessDto = {
        name: 'Barbershop',
        timezone: 'UTC',
      };

      await service.create(dto, userTest.id);

      const business = await prisma.business.findFirst({
        where: { ownerId: userTest.id },
      });

      expect(business).toBeDefined();
      expect(business?.ownerId).toBe(userTest.id);
    });

    it('should throw if a business with the same name exists ', async () => {
      const dto: CreateBusinessDto = {
        name: 'Barbershop',
        timezone: 'UTC',
      };
      await service.create(dto, userTest.id);
      await expect(service.create(dto, userTest.id)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should update user role to BUSINESS_OWNER after adding a business', async () => {
      const dto: CreateBusinessDto = {
        name: 'Barbershop',
        timezone: 'UTC',
      };

      await service.create(dto, userTest.id);

      const owner = await prisma.user.findUnique({
        where: { id: userTest.id },
      });
      expect(owner!.role).toEqual('BUSINESS_OWNER');
    });
  });

  describe('getUserBusinesses', () => {
    it('should return isolated array of user businesses', async () => {
      const dto: CreateBusinessDto = {
        name: 'Barbershop',
        timezone: 'UTC',
      };
      await service.create(dto, userTest.id);

      const { businesses } = await service.getUserBusinesses(userTest.id);
      const business: Business = businesses[0];

      expect(businesses).toHaveLength(1);
      expect(business.ownerId).toBe(userTest.id);
      expect(business.name).toBe(dto.name);
      expect(business.timezone).toBe(dto.timezone);
    });
    it('should return empty array if user has no business', async () => {
      const { businesses } = await service.getUserBusinesses(userTest.id);
      expect(businesses).toEqual(expect.any(Array));
      expect(businesses).toHaveLength(0);
    });
  });

  describe('getBookings', () => {
    it('should return bookings of a business', async () => {
      const business = await prisma.business.create({
        data: {
          name: 'Barbershop',
          timezone: 'UTC',
          owner: { connect: { id: userTest.id } },
        },
      });

      const serviceRecord = await prisma.service.create({
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
          startTime: '09:00',
          endTime: '18:00',
        },
      });

      const customerTest = await prisma.user.create({
        data: {
          email: 'customer@test.com',
          passwordHash: 'hashed',
          role: 'USER',
        },
      });

      await prisma.booking.create({
        data: {
          userId: customerTest.id,
          businessId: business.id,
          serviceId: serviceRecord.id,
          startTime: '2026-06-15T12:00:00.000Z',
          endTime: '2026-06-15T13:00:00.000Z',
        },
      });

      const { bookings } = await service.getBookings(business.id, '2026-06-15');
      expect(bookings).toEqual(expect.any(Array));
      expect(bookings).toHaveLength(1);

      const booking = bookings[0];
      expect(booking.userId).toBe(customerTest.id);
      expect(booking.businessId).toBe(business.id);
    });
    it('should throw if business not found', () => {
      expect(service.getBookings(12, '2026-06-15')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
