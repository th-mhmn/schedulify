import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserPayloadDto } from '@/users/dto/user-payload.dto';
import { ServiceDto } from '@/services/dto/response-service.dto';

export class OwnerDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'owner@acme.com' })
  @Expose()
  email: string;
}

export class BusinessDto {
  @ApiProperty({ example: 10 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Acme Inc' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Asia/Baku' })
  @Expose()
  timezone: string;

  @ApiProperty({ type: () => OwnerDto })
  @Expose()
  @Type(() => OwnerDto)
  owner: OwnerDto;

  @Expose()
  @ApiProperty({ type: () => ServiceDto })
  @Type(() => ServiceDto)
  services?: ServiceDto[];

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-02-23T10:20:30.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-02-23T10:20:30.000Z',
  })
  @Expose()
  updatedAt: Date;
}

export class ResponseBusinessDto {
  @ApiProperty({ type: () => UserPayloadDto })
  @Expose()
  @Type(() => UserPayloadDto)
  user: UserPayloadDto;

  @ApiProperty({ type: () => BusinessDto })
  @Expose()
  @Type(() => BusinessDto)
  business: BusinessDto;
}

export class ResponseBusinessesDto {
  @ApiProperty({ type: () => UserPayloadDto })
  @Expose()
  @Type(() => UserPayloadDto)
  user: UserPayloadDto;

  @ApiProperty({ type: () => BusinessDto, isArray: true })
  @Expose()
  @Type(() => BusinessDto)
  businesses: BusinessDto[];
}
