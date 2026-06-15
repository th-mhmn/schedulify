import { Business, Service } from '@/generated/prisma/client';
import { BookingAvailabilityService } from './booking-conflict.validator';

describe('BookingAvailabilityService', () => {
  let service: BookingAvailabilityService;

  const servicesService = {
    checkReserved: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BookingAvailabilityService(servicesService as any);
  });

  describe('validate', () => {
    const business = {
      timezone: 'Europe/Paris',
    } as Business;

    const bookingService = {
      durationMinutes: 30,
    } as Service;

    const startTime = '2026-06-15T10:00:00';

    it('should allow booking when slot is available', async () => {
      servicesService.checkReserved.mockResolvedValue(null);

      await expect(
        service.validate(business, startTime, bookingService),
      ).resolves.not.toThrow();

      expect(servicesService.checkReserved).toHaveBeenCalledWith(
        'Europe/Paris',
        startTime,
        30,
      );
    });

    it('should reject booking when slot is blocked', async () => {
      servicesService.checkReserved.mockResolvedValue({
        blocks: [{}],
      });

      await expect(
        service.validate(business, startTime, bookingService),
      ).rejects.toThrow(
        'The owner has blocked this time span for reservations',
      );
    });

    it('should reject booking when slot is already reserved', async () => {
      servicesService.checkReserved.mockResolvedValue({
        blocks: [],
      });

      await expect(
        service.validate(business, startTime, bookingService),
      ).rejects.toThrow(
        'There is another reservation already booked on this time',
      );
    });
  });
});
