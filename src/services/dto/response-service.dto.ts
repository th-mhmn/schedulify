import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ServiceDto {
  @Expose()
  @ApiProperty({ example: 10 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'x' })
  name: string;

  @Expose()
  @ApiProperty({ example: 10 })
  durationMinutes: number;

  @Expose()
  @ApiProperty({ example: 10 })
  priceCents: number;
}

export class ResponseCreateServiceDto {
  @Expose()
  @ApiProperty({ type: () => ServiceDto })
  @Type(() => ServiceDto)
  service: ServiceDto;
}

export class ResponseServiceDto {
  @Expose()
  @ApiProperty({ type: () => ServiceDto })
  @Type(() => ServiceDto)
  services: ServiceDto[];
}
