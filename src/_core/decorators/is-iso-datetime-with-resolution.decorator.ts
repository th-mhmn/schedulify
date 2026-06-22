import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function parseIso(value: string): Date | null {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}

const HAS_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;

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

          if (!HAS_OFFSET.test(value)) {
            return false;
          }

          const date = parseIso(value);
          if (!date) return false;

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
