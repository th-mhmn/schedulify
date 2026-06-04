import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async sendBookingCreatedNotification(bookingId: string): Promise<void> {
    console.log(`Sending booking notification for booking ${bookingId}`);
  }
}
