import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationQueue } from './notification.queue';
import { NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';

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
