import { Business, Service } from '@/generated/prisma/client';
import { ServicesService } from '@/services/services.service';
import { ConflictException, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BookingAvailabilityService {
  private readonly logger = new Logger(BookingAvailabilityService.name, {
    timestamp: true,
  });

  constructor(private readonly servicesService: ServicesService) {}

  async validate(
    business: Business,
    startTime: string,
    service: Service,
  ): Promise<void> {
    const reserved = await this.servicesService.checkReserved(
      business?.timezone,
      startTime,
      service.durationMinutes,
    );
    if (!reserved) return;
    if (reserved.blocks.length > 0) {
      this.logger.warn(
        {
          businessId: business.id,
          serviceId: service.id,
          startTime,
        },
        'Booking rejected due to owner block',
      );
      throw new ConflictException(
        'The owner has blocked this time span for reservations',
      );
    }

    this.logger.warn(
      {
        businessId: business.id,
        serviceId: service.id,
        startTime,
      },
      'Booking rejected due to time conflict',
    );

    throw new ConflictException(
      'There is another reservation already booked on this time',
    );
  }
}
