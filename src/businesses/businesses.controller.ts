import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { Endpoint } from '@/_core/decorators/endpoint.decorator';
import { Roles } from '@/_core/decorators/roles.decorator';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { BlocksService } from '@/blocks/blocks.service';
import { AvailabilityBlockDto } from '@/blocks/dto/add-availability-block.dto';
import { ResponseAvailabilityDto } from '@/blocks/dto/response-availability.dto';
import { ResponseBlockDto } from '@/blocks/dto/response-block.dto';
import { ResponseOwnerBookingsDto } from '@/bookings/dto/response-booking.dto';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import {
  ResponseCreateServiceDto,
  ResponseServiceDto,
} from '@/services/dto/response-service.dto';
import { WorkingHoursDto } from '@/working-hours/dto/response-working-hours.dto';
import { WeekScheduleDto } from '@/working-hours/dto/working-hours.dto';
import { WorkingHoursService } from '@/working-hours/working-hours.service';
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
import { ApiTags } from '@nestjs/swagger';
import { ServicesService } from './../services/services.service';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { DateQueryDto } from './dto/date-query-dto';
import {
  ResponseBusinessDto,
  ResponseBusinessesDto,
} from './dto/response-business.dto';
import { TimeRangeQueryDto } from './dto/time-range-query.dto';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly servicesService: ServicesService,
    private readonly workingHourService: WorkingHoursService,
    private readonly blocksService: BlocksService,
  ) {}
  @Endpoint({
    summary: 'Create a business',
    auth: true,
    responseDto: ResponseBusinessDto,
  })
  @TransformDTO(ResponseBusinessDto)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser() user: IUserPayload,
  ) {
    return this.businessesService.create(createBusinessDto, user.id);
  }

  @Endpoint({
    summary: 'Get businesses owned by current user',
    auth: true,
    responseDto: ResponseBusinessesDto,
  })
  @TransformDTO(ResponseBusinessesDto)
  @Get('my')
  @UseGuards(JwtAuthGuard)
  myBusinesses(@CurrentUser() user: IUserPayload) {
    return this.businessesService.getUserBusinesses(user);
  }

  @Endpoint({
    summary: 'Get a business by id',
    params: [{ name: 'id', type: Number, example: 1 }],
    notFoundDescription: 'Business not found',
    responseDto: ResponseBusinessDto,
  })
  @TransformDTO(ResponseBusinessDto)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.findOne(id);
  }

  @Endpoint({
    summary: 'Create a service for a business',
    auth: true,
    params: [{ name: 'id', type: Number, example: 1 }],
    requestDto: CreateServiceDto,
    responseDto: ResponseCreateServiceDto,
    requireOwnership: true,
  })
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

  @Endpoint({
    summary: 'Get services of a business',
    responseDto: ResponseServiceDto,
    params: [{ name: 'id', type: Number, example: 1 }],
  })
  @Get(':id/services')
  @TransformDTO(ResponseServiceDto)
  getServices(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findByBusinessId(id);
  }

  @Endpoint({
    summary: 'Set business working hours',
    auth: true,
    requireOwnership: true,
    params: [{ name: 'id', type: Number, example: 1 }],
    requestDto: WeekScheduleDto,
    responseDto: WorkingHoursDto,
  })
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

  @Endpoint({
    summary: 'Get business working hours',
    params: [{ name: 'id', type: Number, example: 1 }],
    responseDto: WorkingHoursDto,
  })
  @TransformDTO(WorkingHoursDto)
  @Get(':id/working-hours')
  getWorkingHours(@Param('id', ParseIntPipe) id: number) {
    return this.workingHourService.getWeeklySchedule(id);
  }

  @Endpoint({
    summary: 'Add availability block',
    auth: true,
    requireOwnership: true,
    requestDto: AvailabilityBlockDto,
    responseDto: ResponseBlockDto,
  })
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

  @Endpoint({
    summary: 'Get bookings of a business',
    auth: true,
    params: [{ name: 'id', type: Number, example: 1 }],
    query: [{ name: 'date', example: '2026-05-25' }],
    responseDto: ResponseOwnerBookingsDto,
  })
  @Get(':id/bookings')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @TransformDTO(ResponseOwnerBookingsDto)
  getBookings(
    @Param('id', ParseIntPipe) businessId: number,
    @Query() query: DateQueryDto,
  ) {
    return this.businessesService.getBookings(businessId, query.date);
  }

  @Endpoint({
    summary: 'Get business availability blocks',
    params: [{ name: 'id', type: Number, example: 1 }],
    query: [
      { name: 'startDate', required: true },
      { name: 'endDate', required: true },
    ],
    auth: true,
    responseDto: ResponseBlockDto,
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @Get(':id/blocks')
  @TransformDTO(ResponseBlockDto)
  getBlocks(@Query() query: TimeRangeQueryDto) {
    return this.blocksService.get(query);
  }

  @Endpoint({
    summary: 'Get service availability',
    params: [
      { name: 'id', type: Number, example: 1 },
      { name: 'serviceId', type: Number, example: 1 },
    ],
    query: [{ name: 'date', example: '2026-05-25' }],
    responseDto: ResponseAvailabilityDto,
  })
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
}
