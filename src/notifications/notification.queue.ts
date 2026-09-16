import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueue {
  private readonly logger = new Logger(NotificationQueue.name, {
    timestamp: true,
  });
  constructor(
    @InjectQueue('notifications')
    private readonly queue: Queue,
  ) {}

  async enqueueBookingCreated(bookingId: number): Promise<void> {
    await this.queue.add(
      'booking-created',
      { bookingId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
    this.logger.log(
      {
        bookingId,
      },
      'Booking successfully added to notification queue',
    );
  }
}
