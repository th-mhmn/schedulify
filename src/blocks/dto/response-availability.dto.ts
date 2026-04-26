import { WorkingHoursDto } from '@/working-hours/dto/response-working-hours.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { Booking } from '@/bookings/dto/response-booking.dto';
import { formatUtcToHour } from '@/_core/utils/date';

class Block {
  @Expose()
  @Transform(({ obj }) => formatUtcToHour(obj.startTime))
  startTime: string;

  @Expose()
  @Transform(({ obj }) => formatUtcToHour(obj.endTime))
  endTime: string;

  @Expose()
  reason?: string;
}

class ReservedDto {
  @Expose()
  @Type(() => Block)
  blocks: Block[];

  @Expose()
  @Type(() => Booking)
  bookings: Booking[];
}

export class ResponseAvailabilityDto {
  @Expose()
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto[];

  @Expose()
  @Type(() => ReservedDto)
  reserved: ReservedDto;

  @Expose()
  candidates: string[];
}
