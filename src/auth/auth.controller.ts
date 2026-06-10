import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ResponseUserDto } from '@/users/dto/response-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { TransformDTO } from '@/_core/interceptors/transform-dto.interceptor';
import { CurrentUser } from '@/_core/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Throttle({ short: { ttl: 1000, limit: 1 }, long: { ttl: 60000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up (sets Authentication + Refresh cookies)' })
  @ApiBody({ type: SignUpDto })
  @ApiCreatedResponse({ description: 'User created, cookies set' })
  @ApiBadRequestResponse({ description: 'Email already registered' })
  @TransformDTO(ResponseUserDto)
  @Post('sign-up')
  signUp(@Res({ passthrough: true }) response, @Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto, response);
  }

  @ApiOperation({ summary: 'Sign in (sets Authentication + Refresh cookies)' })
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({ description: 'Signed in, cookies set' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @TransformDTO(ResponseUserDto)
  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  signIn(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    return this.authService.signIn(user, response);
  }

  @ApiOperation({ summary: 'Refresh tokens (requires Refresh cookie)' })
  @ApiCookieAuth('Refresh')
  @ApiOkResponse({ description: 'New cookies set' })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalid/expired' })
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @CurrentUser() user: IUserPayload,
    @Res({ passthrough: true }) response,
  ) {
    return this.authService.signIn(user, response);
  }

  @ApiOperation({
    summary: 'Get current user (requires Authentication cookie)',
  })
  @ApiCookieAuth('Authentication')
  @ApiOkResponse({ description: 'Current user returned' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @TransformDTO(ResponseUserDto)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: IUserPayload) {
    return { user };
  }

  @ApiOperation({ summary: 'Sign out (clears cookies, revokes refresh token)' })
  @ApiCookieAuth('Authentication')
  @ApiOkResponse({ description: 'Signed out' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
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
