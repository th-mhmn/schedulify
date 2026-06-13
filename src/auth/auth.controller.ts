import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { Endpoint } from '@/_core/decorators/endpoint.decorator';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { ResponseUserDto } from '@/users/dto/response-user.dto';
import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Throttle({ short: { ttl: 1000, limit: 1 }, long: { ttl: 60000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Endpoint({
    summary: 'Sign up (sets Authentication + Refresh cookies)',
    requestDto: SignUpDto,
    successDescription: 'User created, cookies set',
    badRequestDescription: 'Email already registered',
  })
  @TransformDTO(ResponseUserDto)
  @Post('sign-up')
  signUp(@Res({ passthrough: true }) response, @Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto, response);
  }

  @Endpoint({
    summary: 'Sign in (sets Authentication + Refresh cookies)',
    requestDto: SignInDto,
    successStatus: 200,
    successDescription: 'Signed in, cookies set',
    auth: true,
  })
  @TransformDTO(ResponseUserDto)
  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  signIn(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    return this.authService.signIn(user, response);
  }

  @Endpoint({
    summary: 'Refresh tokens (requires Refresh cookie)',
    auth: true,
    authDescription: 'Refresh token invalid/expired',
    successStatus: 200,
    successDescription: 'New cookies set',
    authCookie: 'Refresh',
  })
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    return this.authService.signIn(user, response);
  }

  @Endpoint({
    summary: 'Get current user (requires Authentication cookie)',
    auth: true,
    authCookie: 'Authentication',
    successStatus: 200,
    successDescription: 'Current user returned',
  })
  @TransformDTO(ResponseUserDto)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: IUserPayload) {
    return { user };
  }

  @Endpoint({
    summary: 'Sign out (clears cookies, revokes refresh token)',
    auth: true,
    authCookie: 'Authentication',
    successStatus: 200,
    successDescription: 'Signed Out',
  })
  @Post('sign-out')
  @UseGuards(JwtAuthGuard)
  async signOut(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    await this.authService.signOut(user.id, response);
    return { message: 'Successfully signed out' };
  }
}
