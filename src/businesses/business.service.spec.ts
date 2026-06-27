import { PrismaService } from '@/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { BusinessValidator } from './validators/business.validator';

describe('BusinessesService', () => {
  let service: BusinessesService;
  const prismaMock = {
    booking: { findMany: jest.fn() },
    business: { findUnique: jest.fn() },
  };

  const businessValidatorMock = {
    validateExisting: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: BusinessValidator,
          useValue: businessValidatorMock,
        },
      ],
    }).compile();

    service = module.get(BusinessesService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      name: 'Barbershop',
      timezone: 'Europe/Berlin',
    };

    const user = {
      id: 1,
      role: 'USER',
    };

    const business = {
      id: 1,
      name: dto.name,
      timezone: dto.timezone,
      ownerId: user.id,
    };

    it('should create a business', async () => {
      businessValidatorMock.validateExisting.mockResolvedValue(undefined);

      jest.spyOn(service as any, 'updateRole').mockResolvedValue(undefined);

      jest
        .spyOn(service as any, 'createBusinessRecord')
        .mockResolvedValue(business);

      const result = await service.create(dto, user.id);

      expect(businessValidatorMock.validateExisting).toHaveBeenCalledWith(
        dto.name,
        user.id,
      );

      expect(service['updateRole']).toHaveBeenCalledWith(user.id);

      expect(service['createBusinessRecord']).toHaveBeenCalledWith(
        dto.name,
        dto.timezone,
        user.id,
      );

      expect(result).toEqual({
        business,
      });
    });

    it('should not create business if business name is repeated ', async () => {
      businessValidatorMock.validateExisting.mockRejectedValue(
        new BadRequestException(
          'A business already exists with the given name',
        ),
      );

      const updateRoleSpy = jest
        .spyOn(service as any, 'updateRole')
        .mockResolvedValue(undefined);

      const createBusinessSpy = jest
        .spyOn(service as any, 'createBusinessRecord')
        .mockResolvedValue({} as any);

      await expect(service.create(dto, user.id)).rejects.toThrow(
        'A business already exists with the given name',
      );
      expect(updateRoleSpy).not.toHaveBeenCalled();
      expect(createBusinessSpy).not.toHaveBeenCalled();
    });
  });

  describe('getBookings', () => {
    it('should return bookings for a business', async () => {
      const bookings = [
        { id: 1, businessId: 1 },
        { id: 2, businessId: 1 },
      ];

      prismaMock.business.findUnique.mockResolvedValue({
        id: 1,
        timezone: 'Europe/Paris',
      });

      prismaMock.booking.findMany.mockResolvedValue(bookings);

      const result = await service.getBookings(1, '2026-06-15');

      expect(prismaMock.business.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      const call = prismaMock.booking.findMany.mock.calls[0][0];
      expect(call.where.businessId).toBe(1);
      expect(call).toEqual({
        where: {
          businessId: 1,
          startTime: expect.any(Object),
        },
      });
      expect(result).toEqual({ bookings });
    });
  });
});
