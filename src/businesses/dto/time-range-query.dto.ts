import { IsIsoDateTimeWithResolution } from '@/_core/decorators/is-iso-datetime-with-resolution.decorator';
import { IsOptional, IsString } from 'class-validator';

export class TimeRangeQueryDto {
  @IsOptional()
  @IsString()
  @IsIsoDateTimeWithResolution(5, {
    message: 'from must be ISO and in 5-minute steps',
  })
  from?: string;

  @IsOptional()
  @IsString()
  @IsIsoDateTimeWithResolution(5, {
    message: 'to must be ISO and in 5-minute steps',
  })
  to?: string;
}
