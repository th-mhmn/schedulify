import { PrismaService } from '@/prisma.service';
import { Test } from '@nestjs/testing';
import { BusinessValidator } from './business.validator';

describe('businessValidator', () => {
  let service: BusinessValidator;

  const prismaMock = {
    business: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BusinessValidator,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(BusinessValidator);

    jest.clearAllMocks();
  });
  describe('validateExisting', () => {
    const business = { id: 1, name: 'Haircut' };
    it('should pass if no business with the given name exists', async () => {
      prismaMock.business.findFirst.mockResolvedValue(null);
      await expect(
        service.validateExisting(business.name),
      ).resolves.toBeUndefined();
      expect(prismaMock.business.findFirst).toHaveBeenCalledWith({
        where: { name: business.name },
      });
    });
    it('should throw BadRequestException if business exists with the given name', async () => {
      prismaMock.business.findFirst.mockResolvedValue(business);
      await expect(service.validateExisting(business.name)).rejects.toThrow(
        'A business already exists with the given name',
      );
      expect(prismaMock.business.findFirst).toHaveBeenCalledWith({
        where: { name: business.name },
      });
    });
  });
});
