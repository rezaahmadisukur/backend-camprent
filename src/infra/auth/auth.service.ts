import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { GetProfileUserDto } from './dto/get-profile.dto';

export interface TGetProfile extends Request {
  user: GetProfileUserDto;
}

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

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

  async singIn(loginUserDto: LoginUserDto) {
    // 1. Find User by email
    const user = await this.findUserByEmail(loginUserDto.email);

    const isMatch = await bcrypt.compare(loginUserDto.password, user!.password);

    // 2. check user and password
    if (!user || !isMatch) {
      throw new UnauthorizedException('Email or Password is wrong');
    }

    return await this.prismaService.$transaction(async (tx) => {
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // 3. Make Session Token for changer the jwt
      const sessionToken = randomBytes(32).toString('hex');

      // 4. Set Expire the token, may be 1 week
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      // 5. Save to table session
      const session = await this.prismaService.session.create({
        data: {
          sessionToken: sessionToken,
          expiresAt: expiresAt,
          userId: user.id,
        },
      });

      // 6. Return data, usually token send via cookie in controller
      return {
        message: 'Login Successfully',
        sessionToken: session.sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    });
  }

  getProfile(req: TGetProfile) {
    return req.user;
  }

  private async findUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  }
}
