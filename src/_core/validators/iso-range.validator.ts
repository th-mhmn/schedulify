import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function parseIsoMs(value: string): number | null {
  const ms = Date.parse(value);
  return isNaN(ms) ? null : ms;
}

@ValidatorConstraint({ name: 'IsoRangeValidator', async: false })
export class IsoRangeValidator implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startTime?: string; endTime?: string };

    if (!obj.startTime || !obj.endTime) return true;

    const startMs = parseIsoMs(obj.startTime);
    const endMs = parseIsoMs(obj.endTime);

    if (startMs === null || endMs === null) return true;

    return startMs < endMs;
  }

  defaultMessage(): string {
    return 'startTime must be earlier than endTime';
  }
}

export function IsValidIsoRange(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      target: constructor,
      propertyName: '',
      options: validationOptions,
      constraints: [],
      validator: IsoRangeValidator,
    });
  };
}
