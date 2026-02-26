import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function parseIso(value: string): Date | null {
  // Date.parse is ISO-aware in JS engines. If it returns NaN, it’s invalid.
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}

export function IsIsoDateTimeWithResolution(
  resolutionMinutes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsIsoDateTimeWithResolution',
      target: object.constructor,
      propertyName,
      constraints: [resolutionMinutes],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [resolution] = args.constraints as [number];
          if (typeof value !== 'string') return false;

          const date = parseIso(value);
          if (!date) return false;

          // Use the timestamp to avoid timezone/offset parsing pitfalls.
          // 5-minute resolution means timestamp divisible by 5*60*1000.
          const ms = date.getTime();
          return ms % (resolution * 60_000) === 0;
        },
        defaultMessage(args: ValidationArguments) {
          const [resolution] = args.constraints as [number];
          return `${args.property} must be a valid ISO datetime and aligned to ${resolution}-minute intervals`;
        },
      },
    });
  };
}
