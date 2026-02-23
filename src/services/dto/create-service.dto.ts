import {
  IsDivisibleBy,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(5)
  @IsDivisibleBy(5)
  durationMinutes: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(0)
  priceCents: number;
}
