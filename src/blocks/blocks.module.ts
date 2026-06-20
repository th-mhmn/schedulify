import { PrismaService } from '@/prisma.service';
import { Module } from '@nestjs/common';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { BlocksOverlapService } from './validators/blocks-overlap.validator';

@Module({
  controllers: [BlocksController],
  providers: [BlocksService, PrismaService, BlocksOverlapService],
  exports: [BlocksService],
})
export class BlocksModule {}
