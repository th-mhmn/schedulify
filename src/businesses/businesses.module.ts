import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PrismaService } from '@/prisma.service';
import { ServicesModule } from '@/services/services.module';
import { ServicesService } from '@/services/services.service';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService, PrismaService, ServicesService],
})
export class BusinessesModule {}
