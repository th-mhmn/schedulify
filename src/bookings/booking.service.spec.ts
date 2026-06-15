import { NotificationQueue } from '@/notifications/notification.queue';
import { PrismaService } from '@/prisma.service';
import { ServicesService } from '@/services/services.service';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingAvailabilityService } from './validators/booking-conflict.validator';
import { BookingWorkingHoursValidator } from './validators/booking-working-hours.validator';

describe('BookingsService', () => {
  let service: BookingsService;

  const prismaMock = {
    booking: { findMany: jest.fn() },
    business: { findUnique: jest.fn() },
  };

  const workingHoursValidatorMock = {
    validate: jest.fn(),
  };

  const availabilityServiceMock = {
    validate: jest.fn(),
  };

  const notificationQueueMock = {
    enqueueBookingCreated: jest.fn(),
  };

  const servicesServiceMock = {
    checkReserved: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: BookingWorkingHoursValidator,
          useValue: workingHoursValidatorMock,
        },
        {
          provide: BookingAvailabilityService,
          useValue: availabilityServiceMock,
        },
        {
          provide: NotificationQueue,
          useValue: notificationQueueMock,
        },
        {
          provide: ServicesService,
          useValue: servicesServiceMock,
        },
      ],
    }).compile();

    service = module.get(BookingsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create booking and enqueue notification', async () => {
      const business = {
        id: 1,
        timezone: 'Europe/Paris',
      };

      const bookingService = {
        id: 1,
        durationMinutes: 30,
      };

      const bookingWindow = {
        startDate: DateTime.now(),
        endDate: DateTime.now().plus({ minutes: 30 }),
        dayOfWeek: 1,
      };

      const workingHours = {};

      const booking = {
        id: 123,
      };

      jest
        .spyOn(service as any, 'validateBusiness')
        .mockResolvedValue(business);

      jest
        .spyOn(service as any, 'validateService')
        .mockResolvedValue(bookingService);

      jest
        .spyOn(service as any, 'buildBookingWindow')
        .mockReturnValue(bookingWindow);

      jest
        .spyOn(service as any, 'getWorkingHours')
        .mockResolvedValue(workingHours);

      jest
        .spyOn(service as any, 'createBookingRecord')
        .mockResolvedValue(booking);

      const dto = {
        businessId: 1,
        serviceId: 1,
        startTime: '2026-06-15T10:00:00',
      };

      const result = await service.create(dto as CreateBookingDto, 42);

      expect(workingHoursValidatorMock.validate).toHaveBeenCalledWith(
        workingHours,
        bookingWindow,
      );

      expect(availabilityServiceMock.validate).toHaveBeenCalledWith(
        business,
        dto.startTime,
        bookingService,
      );

      expect(notificationQueueMock.enqueueBookingCreated).toHaveBeenCalledWith(
        123,
      );

      expect(result).toEqual({
        booking,
      });
    });
  });

  describe('findUserBookings', () => {
    it('should return bookings for a user', async () => {
      const userId = 42;

      const bookings = [
        { id: 1, userId },
        { id: 2, userId },
      ];

      prismaMock.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findUserBookings(userId);

      expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(result).toEqual({
        bookings,
      });
    });
  });

  describe('findBookingsByBusinessId', () => {
    it('should return bookings for a business', async () => {
      const bookings = [
        { id: 1, businessId: 1 },
        { id: 2, businessId: 1 },
      ];

      prismaMock.business.findUnique.mockResolvedValue({
        id: 1,
        timezone: 'Europe/Paris',
      });

      prismaMock.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findByBusinessId(1, '2026-06-15');

      expect(prismaMock.business.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      const call = prismaMock.booking.findMany.mock.calls[0][0];
      expect(call.where.businessId).toBe(1);
      expect(call.where.AND).toBeDefined();
      expect(call).toEqual({
        where: {
          businessId: 1,
          AND: {
            startTime: expect.any(Object),
            endTime: expect.any(Object),
          },
        },
      });
      expect(result).toEqual({ bookings });
    });
  });
});
