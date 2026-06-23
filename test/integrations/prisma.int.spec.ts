import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma.service';

describe('Prisma Integration', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = moduleRef.get(PrismaService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1`;

    expect(result).toBeDefined();
  });
});
