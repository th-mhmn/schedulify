import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserPayloadDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'me@acme.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'BUSINESS_OWNER' })
  @Expose()
  role: string;
}
