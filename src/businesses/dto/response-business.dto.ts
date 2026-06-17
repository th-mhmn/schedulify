import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

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
  @ApiProperty({ type: () => BusinessDto })
  @Expose()
  @Type(() => BusinessDto)
  business: BusinessDto;
}

export class ResponseSingleBusinessDto {
  @ApiProperty({ type: () => BusinessDto })
  @Expose()
  @Type(() => BusinessDto)
  business: BusinessDto;
}

export class ResponseBusinessesDto {
  @ApiProperty({ type: () => BusinessDto, isArray: true })
  @Expose()
  @Type(() => BusinessDto)
  businesses: BusinessDto[];
}
