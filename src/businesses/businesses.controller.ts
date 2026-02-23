import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { ResponseBusinessDto } from './dto/response-business.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @TransformDTO(ResponseBusinessDto)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser() user: IUserPayload,
  ) {
    return this.businessesService.create(createBusinessDto, user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myBusinesses(@CurrentUser() user: IUserPayload) {
    return this.businessesService.getUserBusinesses(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessesService.findOne(id);
  }
}
