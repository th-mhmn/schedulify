import { IsIsoDateTimeWithResolution } from '@/_core/decorators/is-iso-datetime-with-resolution.decorator';
import { TimeRangeValidator } from '@/_core/validators/time-range.validator';
import { IsInt, IsPositive, Validate } from 'class-validator';

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

  @Validate(TimeRangeValidator)
  _timeRangeCheck: true;
}
