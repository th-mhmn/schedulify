import { PrismaService } from '@/prisma.service';
import { Test } from '@nestjs/testing';
import { BlocksOverlapService } from './blocks-overlap.validator';

describe('blocksOverlapValidator', () => {
  let service: BlocksOverlapService;

  const prismaMock = {
    availabilityBlock: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlocksOverlapService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(BlocksOverlapService);

    jest.clearAllMocks();
  });
  describe('validate', () => {
    const businessId = 1;
    const date = {
      start: new Date('2026-06-15T10:00:00'),
      end: new Date('2026-06-15T11:00:00'),
    };

    it('should pass if no blocks overlap', async () => {
      prismaMock.availabilityBlock.findFirst.mockResolvedValue(null);

      await expect(
        service.validate(businessId, date.start, date.end),
      ).resolves.toBeUndefined();

      expect(prismaMock.availabilityBlock.findFirst).toHaveBeenCalledWith({
        where: {
          businessId,
          endTime: { gt: date.start },
          startTime: { lt: date.end },
        },
      });
    });

    it('should throw Conflict Exception if blocks overlap', async () => {
      prismaMock.availabilityBlock.findFirst.mockResolvedValue({
        id: 1,
        businessId,
        startTime: new Date('2026-06-15T09:30:00'),
        endTime: new Date('2026-06-15T10:30:00'),
      });

      await expect(
        service.validate(businessId, date.start, date.end),
      ).rejects.toThrow('Blocks are overlapping on this time-span');
    });
  });
});
