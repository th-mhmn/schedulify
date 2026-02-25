import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const HH_MM_STRICT_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function IsTimeWithResolution(
  resolutionMinutes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsTimeWithResolution',
      target: object.constructor,
      propertyName,
      constraints: [resolutionMinutes],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [resolution] = args.constraints as [number];
          if (typeof value !== 'string') return false;
          if (!HH_MM_STRICT_24H.test(value)) return false;

          const minutes = Number(value.split(':')[1]);
          return minutes % resolution === 0;
        },
        defaultMessage(args: ValidationArguments) {
          const [resolution] = args.constraints as [number];
          return `${args.property} must be HH:mm (24h) and aligned to ${resolution}-minute intervals`;
        },
      },
    });
  };
}
