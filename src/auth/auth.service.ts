import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { UsersService } from '@/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password } = signUpDto;
    const userByEmail = await this.userService.findUser({ email });
    if (userByEmail) throw new BadRequestException('Email already registered');
    const saltRounds = Number(this.configService.get('SALT') ?? 10);
    if (!Number.isInteger(saltRounds) || saltRounds < 4 || saltRounds > 31) {
      throw new Error(`Invalid SALT rounds: ${saltRounds}`);
    }
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const savedUser = await this.userService.createUser({
      email: email.toLocaleLowerCase(),
      passwordHash,
    });
    const payload = {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      isEmailVerified: savedUser.emailVerifiedAt != null,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const responseUser = await this.userService.findUser({ id: savedUser.id });
    return { user: responseUser, accessToken };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.userService.findUser({ email });
    if (!user) throw new NotFoundException('Invalid Credentials');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new NotFoundException('Invalid Credentials');
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.emailVerifiedAt != null,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { user, accessToken };
  }
}
