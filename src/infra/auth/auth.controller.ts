import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService, TGetProfile } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { SessionGuard } from './session.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.authService.signUp(registerUserDto);
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.singIn(loginUserDto);

    response.cookie('auth_token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return result;
  }

  @UseGuards(SessionGuard)
  @Get('profile')
  getProfile(@Req() req: Request & TGetProfile) {
    return this.authService.getProfile(req);
  }
}
