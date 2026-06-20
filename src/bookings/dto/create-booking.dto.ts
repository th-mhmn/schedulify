import { IsIsoDateTimeWithResolution } from '@/_core/decorators/is-iso-datetime-with-resolution.decorator';
import { IsValidTimeRange } from '@/_core/validators/time-range.validator';
import { IsInt, IsPositive } from 'class-validator';

@IsValidTimeRange({ message: 'startTime must be earlier than endTime' })
export class CreateBookingDto {
  @IsInt()
  @IsPositive()
  businessId: number;

  @IsInt()
  @IsPositive()
  serviceId: number;

  @IsIsoDateTimeWithResolution(5, {
    message:
      'startTime must be a valid ISO datetime and aligned to 5-minute intervals',
  })
  startTime: string;
}
