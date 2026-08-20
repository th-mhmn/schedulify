import { Endpoint } from '@/_core/decorators/endpoint.decorator';
import { Roles } from '@/_core/decorators/roles.decorator';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { ResponseBlockDto } from './dto/response-block.dto';

@ApiTags('Blocks')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}
  @Endpoint({
    summary: 'Delete an availability block',
    auth: true,
    params: [{ name: 'id', type: Number, example: 2 }],
    successStatus: 204,
    successDescription: 'Block deleted successfully',
    requireOwnership: true,
    notFoundDescription: 'Block not found',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @TransformDTO(ResponseBlockDto)
  @Roles('BUSINESS_OWNER')
  @Delete(':id')
  async deleteBlock(@Param('id', ParseIntPipe) id: number) {
    return this.blocksService.delete(id);
  }
}
