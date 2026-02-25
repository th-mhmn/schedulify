import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PrismaService } from '@/prisma.service';
import { ServicesService } from '@/services/services.service';
import { WorkingHoursService } from '@/working-hours/working-hours.service';
import { TimeRangeValidator } from '@/_core/validators/time-range.validator';

@Module({
  controllers: [BusinessesController],
  providers: [
    BusinessesService,
    PrismaService,
    ServicesService,
    WorkingHoursService,
    TimeRangeValidator,
  ],
})
export class BusinessesModule {}
