import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateBusinessDto, user: IUserPayload) {
    const { name, timezone } = dto;

    await this.businessValidator.validateExisting(name);

    await this.updateRole(user.id, user.role);

    const business = await this.createBusinessRecord(name, timezone, user.id);

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
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: user.id },
    });

    return { businesses };
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

  private async updateRole(id: number, role: string) {
    if (role === 'BUSINESS_OWNER') return;
    await this.prisma.user.update({
      where: { id },
      data: { role: 'BUSINESS_OWNER' },
    });
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
