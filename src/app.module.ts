import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UsersModule, BusinessesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
