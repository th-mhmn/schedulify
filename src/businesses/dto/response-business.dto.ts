import { Expose, Transform, Type } from 'class-transformer';

export class OwnerDto {
  @Expose()
  id: string;
  @Expose()
  email: string;
  @Expose()
  role: string;
}

export class BusinessDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  timezone: string;
  @Expose()
  @Type(() => OwnerDto)
  owner: OwnerDto;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}

export class ResponseBusinessDto {
  @Expose()
  owner: IUserPayload;
  @Expose()
  @Type(() => BusinessDto)
  business: BusinessDto;
}
