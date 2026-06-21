import { IsIsoDateTimeWithResolution } from '@/_core/decorators/is-iso-datetime-with-resolution.decorator';
import { IsValidIsoRange } from '@/_core/validators/iso-range.validator';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@IsValidIsoRange({ message: 'startTime must be earlier than endTime' })
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
}
