import { formatUtcToHour } from '@/_core/utils/date';
import { Booking } from '@/bookings/dto/response-booking.dto';
import { Expose, Transform, Type } from 'class-transformer';

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
  slots: string[];
}
