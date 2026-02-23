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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  myBusinesses(@CurrentUser() user: IUserPayload) {
    return this.businessesService.getUserBusinesses(user);
  }

  @Get()
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(+id, updateBusinessDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessesService.remove(+id);
  }
}
