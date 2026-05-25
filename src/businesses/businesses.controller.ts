import { ServicesService } from './../services/services.service';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ResponseBusinessDto,
  ResponseBusinessesDto,
} from './dto/response-business.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { CreateBusinessDto } from './dto/create-business.dto';
import { BusinessesService } from './businesses.service';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import { RoleGuard } from '@/auth/guards/role.guard';
import { Roles } from '@/_core/decorators/roles.decorator';
import {
  ResponseCreateServiceDto,
  ResponseServiceDto,
} from '@/services/dto/response-service.dto';
import { WorkingHoursService } from '@/working-hours/working-hours.service';
import { WeekScheduleDto } from '@/working-hours/dto/working-hours.dto';
import { WorkingHoursDto } from '@/working-hours/dto/response-working-hours.dto';
import { AvailabilityBlockDto } from '@/blocks/dto/add-availability-block.dto';
import { BlocksService } from '@/blocks/blocks.service';
import { ResponseBlockDto } from '@/blocks/dto/response-block.dto';
import { TimeRangeQueryDto } from './dto/time-range-query.dto';
import { DateQueryDto } from './dto/date-query-dto';
import { ResponseAvailabilityDto } from '@/blocks/dto/response-availability.dto';
import { BookingsService } from '@/bookings/bookings.service';
import { ResponseOwnerBookingsDto } from '@/bookings/dto/response-booking.dto';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly servicesService: ServicesService,
    private readonly workingHourService: WorkingHoursService,
    private readonly blocksService: BlocksService,
    private readonly bookingsService: BookingsService,
  ) {}
  @ApiOperation({ summary: 'Create a business' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedResponse({ type: ResponseBusinessDto })
  @TransformDTO(ResponseBusinessDto)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser() user: IUserPayload,
  ) {
    return this.businessesService.create(createBusinessDto, user);
  }

  @ApiOperation({ summary: 'Get businesses owned by current user' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ type: ResponseBusinessesDto })
  @TransformDTO(ResponseBusinessesDto)
  @Get('my')
  @UseGuards(JwtAuthGuard)
  myBusinesses(@CurrentUser() user: IUserPayload) {
    return this.businessesService.getUserBusinesses(user);
  }

  @ApiOperation({ summary: 'Get a business by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiOkResponse({ type: ResponseBusinessDto }) // or a ResponseSingleBusinessDto without user
  @TransformDTO(ResponseBusinessDto) // if you return { user, business } here too
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a service for a business' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: CreateServiceDto })
  @ApiCreatedResponse({ type: ResponseCreateServiceDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @Post(':id/services')
  @TransformDTO(ResponseCreateServiceDto)
  createService(
    @Body() createServiceDto: CreateServiceDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.create(id, createServiceDto);
  }

  @ApiOperation({ summary: 'Get services of a business' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: ResponseServiceDto })
  @Get(':id/services')
  @TransformDTO(ResponseServiceDto)
  getServices(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findByBusinessId(id);
  }

  @ApiOperation({ summary: 'Set business working hours' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: WeekScheduleDto })
  @ApiOkResponse({ type: WorkingHoursDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @TransformDTO(WorkingHoursDto)
  @Put(':id/working-hours')
  @Roles('BUSINESS_OWNER')
  setWorkingHours(
    @Body() dto: WeekScheduleDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workingHourService.setWeeklySchedule(dto, id);
  }

  @ApiOperation({ summary: 'Get business working hours' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: WorkingHoursDto })
  @TransformDTO(WorkingHoursDto)
  @Get(':id/working-hours')
  getWorkingHours(@Param('id', ParseIntPipe) id: number) {
    return this.workingHourService.getWeeklySchedule(id);
  }

  @ApiOperation({ summary: 'Add availability block' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: AvailabilityBlockDto })
  @ApiCreatedResponse({ type: ResponseBlockDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @TransformDTO(ResponseBlockDto)
  @Post(':id/blocks')
  addAvailabilityBlocks(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AvailabilityBlockDto,
  ) {
    return this.blocksService.create(dto, id);
  }

  @ApiOperation({ summary: 'Get business availability blocks' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: ResponseBlockDto })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @Get(':id/blocks')
  @TransformDTO(ResponseBlockDto)
  getBlocks(@Query() query: TimeRangeQueryDto) {
    return this.blocksService.get(query);
  }

  @ApiOperation({ summary: 'Get service availability' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiParam({ name: 'serviceId', type: Number, example: 1 })
  @ApiQuery({ name: 'date', example: '2026-05-25' })
  @ApiOkResponse({ type: ResponseAvailabilityDto })
  @Get(':id/services/:serviceId/availability')
  @TransformDTO(ResponseAvailabilityDto)
  getAvailability(
    @Param('id', ParseIntPipe) businessId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query() query: DateQueryDto,
  ) {
    return this.servicesService.getAvailability(
      businessId,
      serviceId,
      query.date,
    );
  }

  @ApiOperation({ summary: 'Get bookings of a business' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiQuery({ name: 'date', example: '2026-05-25' })
  @ApiOkResponse({ type: ResponseOwnerBookingsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Get(':id/bookings')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @TransformDTO(ResponseOwnerBookingsDto)
  getBookings(
    @Param('id', ParseIntPipe) businessId: number,
    @Query() query: DateQueryDto,
  ) {
    return this.bookingsService.findByBusinessId(businessId, query.date);
  }
}
