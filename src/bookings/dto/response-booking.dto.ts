import { Expose, Type } from 'class-transformer';

export class Booking {
  @Expose()
  id: number;

  @Expose()
  serviceId: number;

  @Expose()
  businessId: number;

  @Expose()
  startTime: string;

  @Expose()
  endTime: string;

  @Expose()
  status: string;
}

export class OwnerBooking extends Booking {
  @Expose()
  cancelledAt: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}

export class ResponseBookingDto {
  @Expose()
  @Type(() => Booking)
  booking: Booking;
}

export class ResponseUserBookingsDto {
  @Expose()
  @Type(() => Booking)
  bookings: Booking[];
}

export class ResponseOwnerBookingsDto {
  @Expose()
  @Type(() => OwnerBooking)
  bookings: OwnerBooking[];
}
