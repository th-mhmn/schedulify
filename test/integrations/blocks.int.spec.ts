import { AppModule } from '@/app.module';
import { BlocksService } from '@/blocks/blocks.service';
import { AvailabilityBlockDto } from '@/blocks/dto/add-availability-block.dto';
import { Business, Service, User } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('BlocksService Integration', () => {
  let module: TestingModule;
  let service: BlocksService;
  let prisma: PrismaService;

  let owner: User;
  let business: Business;
  let bookingService: Service;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get(BlocksService);
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
    it('should create availability block for the business', async () => {
      const dto: AvailabilityBlockDto = {
        startTime: '2026-06-15T12:00:00+00:00',
        endTime: '2026-06-15T13:00:00+00:00',
        reason: 'Lunch',
      };
      await service.create(dto, business.id);
      const block = await prisma.availabilityBlock.findFirst({
        where: { businessId: business.id },
      });
      expect(block).toBeDefined();
      expect(block?.businessId).toBe(business.id);
    });
    it('should throw when business not found', async () => {
      const dto: AvailabilityBlockDto = {
        startTime: '2026-06-15T12:00:00+00:00',
        endTime: '2026-06-15T13:00:00+00:00',
        reason: 'Lunch',
      };
      await expect(service.create(dto, business.id + 1)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should throw if block timespan overlaps', async () => {
      const dto: AvailabilityBlockDto = {
        startTime: '2026-06-15T12:00:00+00:00',
        endTime: '2026-06-15T13:00:00+00:00',
        reason: 'Lunch',
      };
      await service.create(dto, business.id);
      await expect(service.create(dto, business.id)).rejects.toThrow(
        ConflictException,
      );
    });
    it('should throw when block timespan is outside working hours', async () => {
      const dto: AvailabilityBlockDto = {
        startTime: '2026-06-15T17:45:00+00:00',
        endTime: '2026-06-15T18:30:00+00:00',
        reason: 'Breakfast',
      };
      await expect(service.create(dto, business.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  describe('get', () => {
    const from = '2026-06-15T12:00:00Z';
    const to = '2026-06-15T13:00:00Z';
    it('should return blocks belonging to the business', async () => {
      const dto: AvailabilityBlockDto = {
        startTime: from,
        endTime: to,
      };
      await service.create(dto, business.id);
      const { blocks } = await service.get(business.id, { from, to });
      expect(blocks).toBeDefined();
      expect(blocks).toHaveLength(1);

      const block = blocks[0];
      expect(block.businessId).toBe(business.id);
    });
    it('should return an empty array if there is no blocks', async () => {
      const { blocks } = await service.get(business.id, { from, to });
      expect(blocks).toBeDefined();
      expect(blocks).toHaveLength(0);
    });
  });
});
