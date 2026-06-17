import { PrismaService } from '@/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { BusinessValidator } from './validators/business.validator';

describe('BusinessesService', () => {
  let service: BusinessesService;
  const prismaMock = {};

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

      const result = await service.create(dto, user as IUserPayload);

      expect(businessValidatorMock.validateExisting).toHaveBeenCalledWith(
        dto.name,
      );

      expect(service['updateRole']).toHaveBeenCalledWith(user.id, user.role);

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

      await expect(service.create(dto, user as IUserPayload)).rejects.toThrow(
        'A business already exists with the given name',
      );
      expect(updateRoleSpy).not.toHaveBeenCalled();
      expect(createBusinessSpy).not.toHaveBeenCalled();
    });
  });
});
