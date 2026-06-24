import { Expose, Type } from 'class-transformer';

class Block {
  @Expose()
  id: number;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  reason?: string;
}

export class ResponseBlockDto {
  @Expose()
  @Type(() => Block)
  block: Block;
}

export class ResponseBlocksDto {
  @Expose()
  @Type(() => Block)
  blocks: Block[];
}
