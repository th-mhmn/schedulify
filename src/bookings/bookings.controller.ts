import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { Endpoint } from '@/_core/decorators/endpoint.decorator';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  ResponseBookingDto,
  ResponseUserBookingsDto,
} from './dto/response-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Endpoint({
    summary: 'Create a booking',
    requestDto: CreateBookingDto,
    responseDto: ResponseBookingDto,
    auth: true,
    idempotent: true,
  })
  @TransformDTO(ResponseBookingDto)
  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: IUserPayload,
  ) {
    return this.bookingsService.create(createBookingDto, user.id);
  }

  @Endpoint({
    summary: 'Get current user bookings',
    responseDto: ResponseUserBookingsDto,
    auth: true,
  })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @TransformDTO(ResponseUserBookingsDto)
  findUserBookings(@CurrentUser() user: IUserPayload) {
    return this.bookingsService.findUserBookings(user.id);
  }

  @Endpoint({
    summary: 'Get all bookings',
    successStatus: 200,
    successDescription: 'List of bookings',
  })
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Endpoint({
    summary: 'Get booking by id',
    successStatus: 200,
    successDescription: 'Booking found',
    params: [{ name: 'id', type: Number, example: 1 }],
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Endpoint({
    summary: 'Update booking',
    params: [{ name: 'id', type: Number, example: 1 }],
    requestDto: UpdateBookingDto,
    successStatus: 200,
    successDescription: 'Booking updated',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(+id, updateBookingDto);
  }

  @Endpoint({
    summary: 'Delete booking',
    params: [{ name: 'id', type: Number, example: 1 }],
    successStatus: 200,
    successDescription: 'Booking deleted',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(+id);
  }
}
