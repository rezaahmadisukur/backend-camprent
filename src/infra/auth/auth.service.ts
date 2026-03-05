import { BadRequestException, Injectable } from '@nestjs/common';
import { TGetProfile, UsersService } from '../users/users.service';
import { RegisterUserDto } from '../users/dto/register.dto';
import { LoginUserDto } from '../users/dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async signUp(registerUserDto: RegisterUserDto) {
    // 1. Cek apakah email sudah ada
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: registerUserDto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    // 3. Run Transaction
    return await this.prismaService.$transaction(async (tx) => {
      // create user
      const user = await tx.user.create({
        data: {
          email: registerUserDto.email,
          password: hashedPassword,
          name: registerUserDto.name,
          emailVerified: false,
        },
      });

      // Create Verification token (same with better auth)
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

      await tx.verification.create({
        data: {
          identifier: user.email,
          token: token,
          expiresAt: expiresAt,
        },
      });

      // Here usually you call MailService for send the email
      // console.log('send email to ${user.email} with token: ${token}');

      return {
        message: 'Registration Successfully. Check email to verification',
        userId: user.id,
      };
    });
  }

  async login(loginUserDto: LoginUserDto) {
    return await this.userService.singIn(loginUserDto);
  }

  getProfile(req: TGetProfile) {
    return this.userService.me(req);
  }
}
