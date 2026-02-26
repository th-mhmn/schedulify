import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

function parseIsoMs(value: string): number | null {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

@ValidatorConstraint({ name: 'IsoRangeValidator', async: false })
export class IsoRangeValidator implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startTime?: string; endTime?: string };

    if (!obj.startTime || !obj.endTime) return true;

    const startMs = parseIsoMs(obj.startTime);
    const endMs = parseIsoMs(obj.endTime);

    // If either is invalid, let field validators complain.
    if (startMs === null || endMs === null) return true;

    return startMs < endMs;
  }

  defaultMessage(): string {
    return 'startTime must be earlier than endTime';
  }
}
