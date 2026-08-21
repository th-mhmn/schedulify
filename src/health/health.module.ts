import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '../prisma.service';
import { HealthController } from './health.controller';

@Module({
  // imports: [TerminusModule, HttpModule, ConfigModule],
  imports: [TerminusModule],
  // providers: [PrismaService, RedisProvider, RedisHealthIndicator],
  providers: [PrismaService],
  controllers: [HealthController],
})
export class HealthModule {}
