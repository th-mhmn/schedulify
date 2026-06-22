import { IsTimeWithResolution } from '@/_core/decorators/is-time-with-resolution.decorator';
import { NoDuplicateDayOfWeek } from '@/_core/decorators/no-duplicate-dayofweek.decorator';
import { IsValidTimeRange } from '@/_core/validators/time-range.validator';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

@IsValidTimeRange({ message: 'startTime must be earlier than endTime' })
export class SingleDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsTimeWithResolution(5)
  startTime: string;

  @IsTimeWithResolution(5)
  endTime: string;
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
