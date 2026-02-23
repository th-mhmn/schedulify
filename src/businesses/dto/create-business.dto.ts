import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsTimeZone } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Acme Inc' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Asia/Baku' })
  @IsNotEmpty()
  @IsTimeZone()
  timezone: string;
}
