import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): {} {
    return {
      name: 'Schedulify API',
      version: '1.0.0',
      status: 'ok',
      docs: '/api/v1/docs',
    };
  }
}
