interface IUserPayload {
  id: number;
  email: string;
  role: sting;
  isEmailActivated: boolean;
}

type IRole = 'USER' | 'BUSINESS_OWNER';

declare namespace Express {
  export interface Request {
    user: IUserPayload;
  }
}
