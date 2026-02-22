interface IUserPayload {
  id: number;
  email: string;
  role: sting;
  isEmailActivated: boolean;
}

type IRole = 'user' | 'business_owner';

declare namespace Express {
  export interface Request {
    user: IUserPayload;
  }
}
