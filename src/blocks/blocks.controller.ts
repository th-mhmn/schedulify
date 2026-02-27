import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { Roles } from '@/_core/decorators/roles.decorator';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { ResponseBlockDto } from './dto/response-block.dto';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @TransformDTO(ResponseBlockDto)
  @Roles('BUSINESS_OWNER')
  @Delete(':id')
  async deleteBlock(@Param('id', ParseIntPipe) id: number) {
    return this.blocksService.delete(id);
  }
}
