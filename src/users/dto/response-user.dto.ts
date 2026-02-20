import { Expose, Transform } from 'class-transformer';

export class ResponseUserDto {
  @Expose()
  id: string;
  @Expose()
  email: string;
  @Expose()
  role: string;
  @Expose()
  @Transform(({ obj }) => obj.emailVerifiedAt != null)
  isEmailVerified: boolean;
}
