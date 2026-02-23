import { Injectable } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { PrismaService } from '@/prisma.service';
import { Prisma } from '@/generated/prisma/client';

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

  findAll() {
    return `This action returns all businesses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} business`;
  }

  update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }

  remove(id: number) {
    return `This action removes a #${id} business`;
  }
}
