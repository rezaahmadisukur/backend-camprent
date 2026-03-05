import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { GetProfileUserDto } from './dto/get-profile.dto';

export interface TGetProfile extends Request {
  user: GetProfileUserDto;
}
@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
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

    // 3. Simpan User & Verification Token dalam satu Transaction (Atomic)
    // Agar jika salah satu gagal, semua dibatalkan
    return this.prismaService.user.create({
      data: {
        ...registerUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async singIn(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const user = await this.findOne(loginUserDto.email);

    if (!user) throw new UnauthorizedException('User not registered');

    const isMatch = await bcrypt.compare(loginUserDto.password, user.password);

    if (!isMatch) throw new UnauthorizedException('Email or Password is wrong');

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  me(req: TGetProfile) {
    return req.user;
  }

  async findOne(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  }
}
