import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import {
  ResponseBookingDto,
  ResponseUserBookingsDto,
} from './dto/response-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @TransformDTO(ResponseBookingDto)
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: IUserPayload,
  ) {
    return this.bookingsService.create(createBookingDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @TransformDTO(ResponseUserBookingsDto)
  findUserBookings(@CurrentUser() user: IUserPayload) {
    return this.bookingsService.findUserBookings(user.id);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(+id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(+id);
  }
}
