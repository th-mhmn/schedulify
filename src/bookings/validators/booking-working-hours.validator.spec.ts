import { WorkingHours } from '@/generated/prisma/client';
import { ConflictException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BookingWindow } from '../types/booking-window.type';
import { BookingWorkingHoursValidator } from './booking-working-hours.validator';

describe('BookingWorkingHoursValidator', () => {
  let validator: BookingWorkingHoursValidator;

  beforeEach(() => {
    validator = new BookingWorkingHoursValidator();
  });

  describe('validate', () => {
    describe('when booking is inside working hours', () => {
      it('should not throw', () => {
        const workingHours = {
          startMinute: 9 * 60,
          endMinute: 17 * 60,
        } as WorkingHours;

        const bookingWindow = {
          startDate: DateTime.fromISO('2026-06-15T10:00:00'),
          endDate: DateTime.fromISO('2026-06-15T11:00:00'),
        } as BookingWindow;

        expect(() =>
          validator.validate(workingHours, bookingWindow),
        ).not.toThrow();
      });
    });

    describe('when booking starts before opening', () => {
      it('should throw ConflictException', () => {
        const workingHours = {
          startMinute: 9 * 60,
          endMinute: 17 * 60,
        } as WorkingHours;

        const bookingWindow = {
          startDate: DateTime.fromISO('2026-06-15T08:00:00'),
          endDate: DateTime.fromISO('2026-06-15T11:00:00'),
        } as BookingWindow;

        expect(() => validator.validate(workingHours, bookingWindow)).toThrow(
          ConflictException,
        );
      });
    });

    describe('when booking ends after closing', () => {
      it('should throw ConflictException', () => {
        const workingHours = {
          startMinute: 9 * 60,
          endMinute: 17 * 60,
        } as WorkingHours;

        const bookingWindow = {
          startDate: DateTime.fromISO('2026-06-15T16:00:00'),
          endDate: DateTime.fromISO('2026-06-15T17:30:00'),
        } as BookingWindow;

        expect(() => validator.validate(workingHours, bookingWindow)).toThrow(
          ConflictException,
        );
      });
    });

    describe('when booking exactly matches opening and closing hours', () => {
      it('should not throw', () => {
        const workingHours = {
          startMinute: 9 * 60,
          endMinute: 11 * 60,
        } as WorkingHours;

        const bookingWindow = {
          startDate: DateTime.fromISO('2026-06-15T09:00:00'),
          endDate: DateTime.fromISO('2026-06-15T11:00:00'),
        } as BookingWindow;

        expect(() =>
          validator.validate(workingHours, bookingWindow),
        ).not.toThrow();
      });
    });
  });
});
