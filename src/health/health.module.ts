import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { RedisProvider } from '../_core/providers/redis.provider';
import { PrismaService } from '../prisma.service';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [TerminusModule, HttpModule, ConfigModule],
  providers: [PrismaService, RedisProvider, RedisHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
