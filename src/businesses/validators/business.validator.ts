import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class BusinessValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateExisting(name: string, ownerId: number) {
    const existingByName = await this.prisma.business.findFirst({
      where: { name, ownerId },
    });
    if (existingByName)
      throw new BadRequestException(
        'A business already exists with the given name',
      );
  }
}
