import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';
import { NotificationQueue } from './notification.queue';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationService, NotificationWorker, NotificationQueue],
  exports: [NotificationQueue],
})
export class NotificationModule {}
