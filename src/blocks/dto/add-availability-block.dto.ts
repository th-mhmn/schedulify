import { IsIsoDateTimeWithResolution } from '@/_core/decorators/is-iso-datetime-with-resolution.decorator';
import { IsoRangeValidator } from '@/_core/validators/iso-range.validator';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';

export class AvailabilityBlockDto {
  @IsString()
  @IsIsoDateTimeWithResolution(5, {
    message:
      'startsAt must be a valid ISO datetime and aligned to 5-minute intervals',
  })
  startTime: string;

  @IsString()
  @IsIsoDateTimeWithResolution(5, {
    message:
      'endsAt must be a valid ISO datetime and aligned to 5-minute intervals',
  })
  endTime: string;

  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @IsOptional()
  reason: string;

  @Validate(IsoRangeValidator)
  _rangeCheck: true;
}
