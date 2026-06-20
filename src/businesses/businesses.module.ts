import { IsoRangeValidator } from '@/_core/validators/iso-range.validator';
import { TimeRangeValidator } from '@/_core/validators/time-range.validator';
import { BlocksModule } from '@/blocks/blocks.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { PrismaService } from '@/prisma.service';
import { ServicesModule } from '@/services/services.module';
import { WorkingHoursModule } from '@/working-hours/working-hours.module';
import { Module } from '@nestjs/common';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessValidator } from './validators/business.validator';

@Module({
  imports: [BookingsModule, ServicesModule, BlocksModule, WorkingHoursModule],
  controllers: [BusinessesController],
  providers: [
    BusinessesService,
    PrismaService,
    TimeRangeValidator,
    IsoRangeValidator,
    BusinessValidator,
  ],
  exports: [BusinessesService],
})
export class BusinessesModule {}
