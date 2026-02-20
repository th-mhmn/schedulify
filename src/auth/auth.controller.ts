import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { TransformDTO } from '../../_core/interceptors/transform-dto.interceptor';
import { ResponseUserDto } from '@/users/dto/response-user.dto';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
@TransformDTO(ResponseUserDto)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
}
