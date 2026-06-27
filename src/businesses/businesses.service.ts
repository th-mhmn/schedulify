import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
import { BusinessValidator } from './validators/business.validator';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessValidator: BusinessValidator,
  ) {}

  async create(dto: CreateBusinessDto, userId: number) {
    const { name, timezone } = dto;

    await this.businessValidator.validateExisting(name, userId);

    await this.updateRole(userId);

    const business = await this.createBusinessRecord(name, timezone, userId);

    return { business };
  }

  async find(
    businessWhereUniqueInput: Prisma.BusinessWhereUniqueInput,
  ): Promise<Business | null> {
    return await this.prisma.business.findUnique({
      where: businessWhereUniqueInput,
    });
  }

  async findManyBusinesses(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BusinessWhereUniqueInput;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
  }): Promise<Business[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return await this.prisma.business.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async getUserBusinesses(userId: number) {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
    });

    return { businesses };
  }

  async getBookings(businessId: number, date: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    const dayStart = DateTime.fromISO(date).setZone(business?.timezone);
    const dayEnd = dayStart.plus({ days: 1 });

    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        startTime: {
          gte: dayStart.toJSDate(),
          lt: dayEnd.toJSDate(),
        },
      },
    });

    return { bookings };
  }

  findAll() {
    return `This action returns all businesses`;
  }

  async findOne(id: number) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!business) throw new NotFoundException('Business not found');
    return { business };
  }

  update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }

  remove(id: number) {
    return `This action removes a #${id} business`;
  }

  private async updateRole(id: number) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { role: 'BUSINESS_OWNER' },
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  private async createBusinessRecord(
    name: string,
    timezone: string,
    userId: number,
  ) {
    const business = await this.prisma.$transaction(
      async (prisma) => {
        return await prisma.business.create({
          data: {
            name,
            timezone,
            owner: { connect: { id: userId } },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
    return business;
  }
}
