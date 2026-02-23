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
    }
    const data: Prisma.BusinessCreateInput = {
      name: dto.name,
      timezone: dto.timezone,
      owner: { connect: { id: user.id } },
    };
    const business = await this.prisma.business.create({
      data,
      include: { owner: true },
    });
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

  async getUserBusinesses(user: IUserPayload) {
    const businesses = await this.findManyBusinesses({
      where: { ownerId: user.id },
    });
    return businesses;
  }

  findAll() {
    return `This action returns all businesses`;
  }

  async findOne(id: number) {
    const business = await this.find({ id });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }

  remove(id: number) {
    return `This action removes a #${id} business`;
  }
}
