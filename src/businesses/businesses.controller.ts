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
import { ResponseServiceDto } from '@/services/dto/response-service.dto';
import { WorkingHoursService } from '@/working-hours/working-hours.service';
import { WeekScheduleDto } from '@/working-hours/dto/working-hours.dto';
import { ResponseWorkingHoursDto } from '@/working-hours/dto/response-working-hours.dto';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly servicesService: ServicesService,
    private readonly workingHourService: WorkingHoursService,
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

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('BUSINESS_OWNER')
  @Post(':id/services')
  @TransformDTO(ResponseServiceDto)
  createService(
    @Body() createServiceDto: CreateServiceDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.create(id, createServiceDto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @TransformDTO(ResponseWorkingHoursDto)
  @Put(':id/working-hours')
  @Roles('BUSINESS_OWNER')
  setWorkingHours(
    @Body() dto: WeekScheduleDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workingHourService.setWeeklySchedule(dto, id);
  }

  @TransformDTO(ResponseWorkingHoursDto)
  @Get(':id/working-hours')
  getWorkingHours(@Param('id', ParseIntPipe) id: number) {
    return this.workingHourService.getWeeklySchedule(id);
  }
}
