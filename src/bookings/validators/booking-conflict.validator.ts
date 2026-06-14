import { Business, Service } from '@/generated/prisma/client';
import { ServicesService } from '@/services/services.service';
import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class BookingAvailabilityService {
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
    if (reserved.blocks.length > 0)
      throw new ConflictException(
        'The owner has blocked this time span for reservations',
      );

    throw new ConflictException(
      'There is another reservation already booked on this time',
    );
  }
}
