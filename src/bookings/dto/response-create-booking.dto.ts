import { ApiProperty } from '@nestjs/swagger';
import { ResponseBookingDto } from './response-booking.dto';

export class ResponseCreateBookingDto {
  @ApiProperty({ type: ResponseBookingDto })
  booking: ResponseBookingDto;
}
