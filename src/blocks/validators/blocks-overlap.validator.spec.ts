import { PrismaService } from '@/prisma.service';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { BlocksOverlapService } from './blocks-overlap.validator';

describe('blocksOverlapValidator', () => {
  let service: BlocksOverlapService;

  const prismaMock = {
    availabilityBlock: { findFirst: jest.fn() },
    workingHours: {
      findFirst: jest.fn(),
    },
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
      start: DateTime.fromISO('2026-06-15T10:00:00'),
      end: DateTime.fromISO('2026-06-15T11:00:00'),
    };

    it('should pass if no blocks overlap', async () => {
      prismaMock.availabilityBlock.findFirst.mockResolvedValue(null);

      prismaMock.workingHours.findFirst.mockResolvedValue({
        businessId,
        startMinute: 9 * 60,
        endMinute: 17 * 60,
      });

      await expect(
        service.validate(businessId, date.start, date.end),
      ).resolves.toBeUndefined();

      expect(prismaMock.availabilityBlock.findFirst).toHaveBeenCalledWith({
        where: {
          businessId,
          endTime: { gt: date.start.toUTC().toJSDate() },
          startTime: { lt: date.end.toUTC().toJSDate() },
        },
      });
    });

    it('should throw Conflict Exception if blocks overlap', async () => {
      prismaMock.availabilityBlock.findFirst.mockResolvedValue({
        id: 1,
        businessId,
        start: DateTime.fromISO('2026-06-15T09:30:00'),
        end: DateTime.fromISO('2026-06-15T10:30:00'),
      });

      await expect(
        service.validate(businessId, date.start, date.end),
      ).rejects.toThrow('Blocks are overlapping on this time-span');
    });
  });
});
