import { Endpoint } from '@/_core/decorators/endpoint.decorator';
import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Endpoint({
    summary: 'Get all services',
    successStatus: 200,
    successDescription: 'List of services',
  })
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Endpoint({
    summary: 'Get service by id',
    params: [{ name: 'id', type: Number, example: 1 }],
    successStatus: 200,
    successDescription: 'Service found',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(+id);
  }

  @Endpoint({
    summary: 'Update service',
    params: [{ name: 'id', type: Number, example: 1 }],
    requestDto: UpdateServiceDto,
    successDescription: 'Service updated',
    successStatus: 200,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(+id, updateServiceDto);
  }

  @Endpoint({
    summary: 'Delete service',
    successStatus: 200,
    successDescription: 'Service deleted',
    params: [{ name: 'id', type: Number, example: 1 }],
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(+id);
  }
}
