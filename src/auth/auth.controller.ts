import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { TransformDTO } from '../../_core/interceptors/transform-dto.interceptor';
import { ResponseUserDto } from '@/users/dto/response-user.dto';
import { CurrentUser } from '../../_core/decorators/current-user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TransformDTO(ResponseUserDto)
  @Post('sign-up')
  signUp(@Res({ passthrough: true }) response, @Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto, response);
  }

  @TransformDTO(ResponseUserDto)
  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  signIn(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    return this.authService.signIn(user, response);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    await this.authService.signIn(user, response);
  }

  @TransformDTO(ResponseUserDto)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: IUserPayload) {
    return { user };
  }

  @Post('sign-out')
  @UseGuards(JwtAuthGuard)
  async signOut(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    await this.authService.signOut(user.id, response);
  }
}
