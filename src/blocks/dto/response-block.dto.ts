import { Expose } from 'class-transformer';

export class ResponseBlockDto {
  @Expose()
  id: number;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  reason?: string;

  @Expose()
  createdAt: string;
}
