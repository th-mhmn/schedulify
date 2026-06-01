import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaService } from '@/prisma.service';
import { ServicesService } from '@/services/services.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService, ServicesService],
})
export class BookingsModule {}
