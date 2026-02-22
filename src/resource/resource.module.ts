import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { ResourceService } from './resource.service';

@Global()
@Module({
  providers: [ResourceService, PrismaService],
  exports: [ResourceService],
})
export class ResourceModule {}
