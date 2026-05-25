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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Create a booking' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateBookingDto })
  @ApiCreatedResponse({ type: ResponseBookingDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post()
  @TransformDTO(ResponseBookingDto)
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: IUserPayload,
  ) {
    return this.bookingsService.create(createBookingDto, user.id);
  }

  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: ResponseUserBookingsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @TransformDTO(ResponseUserBookingsDto)
  findUserBookings(@CurrentUser() user: IUserPayload) {
    return this.bookingsService.findUserBookings(user.id);
  }

  @ApiOperation({ summary: 'Get all bookings' })
  @ApiOkResponse({ description: 'List of bookings' })
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @ApiOperation({ summary: 'Get booking by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Booking found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update booking' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateBookingDto })
  @ApiOkResponse({ description: 'Booking updated' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(+id, updateBookingDto);
  }

  @ApiOperation({ summary: 'Delete booking' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Booking deleted' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(+id);
  }
}
