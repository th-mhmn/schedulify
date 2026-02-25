import { registerDecorator, ValidationOptions } from 'class-validator';

export function NoDuplicateDayOfWeek(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'NoDuplicateDayOfWeek',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!Array.isArray(value)) return false;

          const days = value
            .map((x) => x?.dayOfWeek)
            .filter((d) => typeof d === 'number');

          // If some entries are missing/invalid, let nested validators complain.
          // Don’t add extra confusing errors here.
          if (days.length !== value.length) return true;

          return new Set(days).size === days.length;
        },
        defaultMessage() {
          return `dayOfWeek must be unique (no duplicates)`;
        },
      },
    });
  };
}
