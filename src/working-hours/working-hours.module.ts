import { Module } from '@nestjs/common';
import { WorkingHoursService } from './working-hours.service';
import { WorkingHoursController } from './working-hours.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [WorkingHoursController],
  providers: [WorkingHoursService, PrismaService],
})
export class WorkingHoursModule {}
