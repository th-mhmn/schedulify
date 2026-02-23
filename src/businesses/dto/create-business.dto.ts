import { IsNotEmpty, IsString, IsTimeZone } from 'class-validator';

export class CreateBusinessDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsTimeZone()
  timezone: string;
}
