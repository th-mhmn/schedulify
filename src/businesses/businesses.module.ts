import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService, PrismaService],
})
export class BusinessesModule {}
