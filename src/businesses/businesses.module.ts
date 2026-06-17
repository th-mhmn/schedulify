import { IsoRangeValidator } from '@/_core/validators/iso-range.validator';
import { TimeRangeValidator } from '@/_core/validators/time-range.validator';
import { BlocksService } from '@/blocks/blocks.service';
import { BookingsModule } from '@/bookings/bookings.module';
import { PrismaService } from '@/prisma.service';
import { ServicesService } from '@/services/services.service';
import { WorkingHoursService } from '@/working-hours/working-hours.service';
import { Module } from '@nestjs/common';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessValidator } from './validators/business.validator';

@Module({
  imports: [BookingsModule],
  controllers: [BusinessesController],
  providers: [
    BusinessesService,
    PrismaService,
    ServicesService,
    WorkingHoursService,
    TimeRangeValidator,
    IsoRangeValidator,
    BlocksService,
    BusinessValidator,
  ],
})
export class BusinessesModule {}
