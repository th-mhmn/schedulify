import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { PrismaService } from '@/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { Business } from './entities/business.entity';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBusinessDto, user: IUserPayload) {
    if (user.role === 'USER') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'BUSINESS_OWNER' },
      });
      user = { ...user, role: 'BUSINESS_OWNER' } as any;
    }

    const business = await this.prisma.business.create({
      data: {
        name: dto.name,
        timezone: dto.timezone,
        owner: { connect: { id: user.id } },
      },
      include: { owner: true },
    });

    return { user, business };
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

  async getUserBusinesses(user: IUserPayload) {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: user.id },
      include: { owner: true, services: true },
    });

    return { user, businesses };
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
}
