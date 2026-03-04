import { getHours } from '@/_core/utils/getHour';
import { Booking } from '@/generated/prisma/client';
import { WorkingHoursDto } from '@/working-hours/dto/response-working-hours.dto';
import { Expose, Transform, Type } from 'class-transformer';

class Block {
  @Expose()
  @Transform(({ obj }) => getHours(obj.startTime))
  startTime: string;

  @Expose()
  @Transform(({ obj }) => getHours(obj.endTime))
  endTime: string;

  @Expose()
  reason?: string;
}

class ReservedDto {
  @Expose()
  @Type(() => Block)
  blocks: Block[];

  @Expose()
  bookings: Booking[];
}

export class ResponseAvailabilityDto {
  @Expose()
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto[];

  @Expose()
  @Type(() => ReservedDto)
  reserved: ReservedDto;
}
