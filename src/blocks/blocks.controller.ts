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
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Blocks')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @ApiOperation({ summary: 'Delete an availability block' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Block deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Block not found' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @TransformDTO(ResponseBlockDto)
  @Roles('BUSINESS_OWNER')
  @Delete(':id')
  async deleteBlock(@Param('id', ParseIntPipe) id: number) {
    return this.blocksService.delete(id);
  }
}
