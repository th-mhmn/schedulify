import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueue {
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
      },
    );
  }
}
