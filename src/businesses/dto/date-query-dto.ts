import { IsDateString, IsISO8601 } from 'class-validator';

export class DateQueryDto {
  @IsDateString()
  @IsISO8601()
  date: string;
}
