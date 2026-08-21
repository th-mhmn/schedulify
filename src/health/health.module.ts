import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisProvider } from '../_core/providers/redis.provider';
import { PrismaService } from '../prisma.service';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

@Module({
  // imports: [TerminusModule, HttpModule, ConfigModule],
  imports: [TerminusModule],
  providers: [PrismaService, RedisProvider, RedisHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
