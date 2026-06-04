import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from './notification.service';
import { BookingCreatedJob } from './jobs/booking-created.job';

@Processor('notifications')
export class NotificationWorker extends WorkerHost {
  constructor(private readonly notificationsService: NotificationService) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job<BookingCreatedJob>) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data.bookingId}...`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BookingCreatedJob>) {
    console.log(
      `Failed: Job ${job.id} of type ${job.name} with data ${job.data.bookingId} Failed`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BookingCreatedJob>) {
    console.log(
      `Job ${job.id} of type ${job.name} with data ${job.data.bookingId} Completed`,
    );
  }

  async process(job: Job<BookingCreatedJob>) {
    const { data, name } = job;

    await this.notificationsService.sendBookingCreatedNotification(
      data.bookingId,
    );
  }
}
