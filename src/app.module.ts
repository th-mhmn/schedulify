import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UsersModule, BusinessesModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
