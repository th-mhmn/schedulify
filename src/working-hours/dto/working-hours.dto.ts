import { IsTimeWithResolution } from '@/_core/decorators/is-time-with-resolution.decorator';
import { NoDuplicateDayOfWeek } from '@/_core/decorators/no-duplicate-dayofweek.decorator';
import { TimeRangeValidator } from '@/_core/validators/time-range.validator';
import { Type } from 'class-transformer';
import {
  IsInt,
  Min,
  Max,
  Validate,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';

export class SingleDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsTimeWithResolution(5)
  startTime: string;

  @IsTimeWithResolution(5)
  endTime: string;

  @Validate(TimeRangeValidator)
  _timeRangeCheck: true;
}

export class WeekScheduleDto {
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => SingleDayDto)
  @NoDuplicateDayOfWeek()
  days: SingleDayDto[];
}
