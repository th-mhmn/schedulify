import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const HH_MM_STRICT_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

@ValidatorConstraint({ name: 'TimeRangeValidator', async: false })
export class TimeRangeConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startTime?: string; endTime?: string };
    const { startTime, endTime } = obj;

    if (!startTime || !endTime) return true;
    if (!HH_MM_STRICT_24H.test(startTime) || !HH_MM_STRICT_24H.test(endTime))
      return true;

    return toMinutes(startTime) < toMinutes(endTime);
  }

  defaultMessage(): string {
    return 'startTime must be earlier than endTime';
  }
}

export function IsValidTimeRange(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      target: constructor,
      propertyName: '',
      options: validationOptions,
      constraints: [],
      validator: TimeRangeConstraint,
    });
  };
}
