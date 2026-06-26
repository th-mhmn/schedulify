import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsTimeZone, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Acme Inc' })
  @MinLength(4)
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Asia/Baku' })
  @IsNotEmpty()
  @IsTimeZone()
  timezone: string;
}
