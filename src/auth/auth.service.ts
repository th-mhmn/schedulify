import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { UsersService } from '@/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto, response: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const email = signUpDto.email.trim().toLowerCase();

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    if (!Number.isInteger(saltRounds) || saltRounds < 4 || saltRounds > 31) {
      throw new Error(`Invalid bcrypt rounds: ${saltRounds}`);
    }

    const passwordHash = await bcrypt.hash(signUpDto.password, saltRounds);

    let user;
    try {
      user = await this.usersService.createUser({
        email,
        passwordHash,
      });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new BadRequestException('Email already registered');
      throw e;
    }
    const expirationMs = parseInt(
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
    );
    const refreshExpirationMs = parseInt(
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
    );
    const expiresAccessToken = new Date(Date.now() + expirationMs);
    const expiresRefreshToken = new Date(Date.now() + refreshExpirationMs);
    const tokenPayload = {
      sub: user.id,
    };
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${expirationMs}ms`,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh' },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${refreshExpirationMs}ms`,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);

    await this.usersService.updateUser({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    });

    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: isProd,
      expires: expiresAccessToken,
    });

    response.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: isProd,
      expires: expiresRefreshToken,
    });

    return {
      user: { ...user, isEmailVerified: user.emailVerifiedAt != null },
    };
  }

  async signOut(userId: number, response: Response) {
    try {
      await this.usersService.updateUser({
        where: { id: userId },
        data: { refreshToken: null },
      });
      response.clearCookie('Authentication');
      response.clearCookie('Refresh');
      response.status(200).json({ message: 'Successfully signed out' });
    } catch (error: any) {
      this.logger.error('Sign out error:', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw new UnauthorizedException('Failed to process sign out');
    }
  }

  async verifyUserRefreshToken(refreshToken: string, userId: number) {
    try {
      const user = await this.usersService.findUser({ id: userId });
      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user?.refreshToken,
      );
      if (!refreshTokenMatches) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      this.logger.error('Verify user refresh token error', error);
      throw new UnauthorizedException('Refresh token is not valid');
    }
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.usersService.findUser({ email });
      const authenticated = await bcrypt.compare(password, user?.passwordHash);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      this.logger.error('Verify user error', error);
      throw new UnauthorizedException('Credentials are not valid');
    }
  }

  async signIn(user: IUserPayload, response: Response) {
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const expirationMs = parseInt(
        this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
      );
      const refreshExpirationMs = parseInt(
        this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
      );

      const expiresAccessToken = new Date(Date.now() + expirationMs);
      const expiresRefreshToken = new Date(Date.now() + refreshExpirationMs);

      const tokenPayload = {
        sub: user.id,
      };

      const accessToken = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: `${expirationMs}ms`,
      });

      const refreshToken = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${refreshExpirationMs}ms`,
      });

      const userData = {
        id: user.id,
        email: user.email,
      };

      await this.usersService.updateUser({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
      });

      response.cookie('Authentication', accessToken, {
        httpOnly: true,
        secure: isProd,
        expires: expiresAccessToken,
      });

      response.cookie('Refresh', refreshToken, {
        httpOnly: true,
        secure: isProd,
        expires: expiresRefreshToken,
      });

      return { user: userData };
    } catch (error: any) {
      this.logger.error('Login error:', {
        error: error.message,
        userId: user.id,
        stack: error.stack,
      });
      throw new UnauthorizedException(
        'Failed to process login. Please try again.',
      );
    }
  }
}
