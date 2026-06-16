import { PrismaService } from '@/prisma.service';
import { Test } from '@nestjs/testing';
import { BlocksService } from './blocks.service';
import { AvailabilityBlockDto } from './dto/add-availability-block.dto';
import { BlocksOverlapService } from './validators/blocks-overlap.validator';

describe('BlocksService', () => {
  let service: BlocksService;

  const prismaMock = { availabilityBlock: { create: jest.fn() } };

  const blocksOverlapServiceMock = {
    validate: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: BlocksOverlapService,
          useValue: blocksOverlapServiceMock,
        },
      ],
    }).compile();

    service = module.get(BlocksService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should add a block', async () => {
      const startTime = '2026-06-15T10:00:00';
      const endTime = '2026-06-15T11:00:00';
      const reason = 'Lunch Time';

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      const businessId = 1;

      const block = {
        id: 1,
        startTime,
        endTime,
        reason,
      };
      jest.spyOn(service as any, 'createBlockRecord').mockResolvedValue(block);

      const dto = { startTime, endTime, reason };

      const result = await service.create(
        dto as AvailabilityBlockDto,
        businessId,
      );

      expect(blocksOverlapServiceMock.validate).toHaveBeenCalledWith(
        businessId,
        startDate,
        endDate,
      );

      expect(result).toEqual({
        block,
      });
    });

    it('should not create block if overlap validation fails', async () => {
      blocksOverlapServiceMock.validate.mockRejectedValue(new Error('overlap'));

      const dto = {
        startTime: '2026-06-15T10:00:00',
        endTime: '2026-06-15T11:00:00',
        reason: 'Lunch',
      };

      await expect(
        service.create(dto as AvailabilityBlockDto, 1),
      ).rejects.toThrow('overlap');
    });
  });
});
