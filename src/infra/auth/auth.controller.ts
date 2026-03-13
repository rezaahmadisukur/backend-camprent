import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { SessionGuard } from './session.guard';
import { UpdateProfileUserDto } from './dto/update-profile.dto';
import { type AuthenticatedRequest } from './@types/auth';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.authService.signUp(registerUserDto);
  }

  @Get('verify-email')
  async verify(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
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
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // 1. Get token in cookie
    const token: string = req.cookies['auth_token'] as string;

    // 2. delete session via token
    await this.authService.logout(token);

    // 3. Clear cookies token
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Logout successful' };
  }

  @UseGuards(SessionGuard)
  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.me(req);
  }

  @UseGuards(SessionGuard)
  @Patch('update-profile')
  editProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileUserDto: UpdateProfileUserDto,
  ) {
    const userId = req.user.id;
    return this.authService.updateProfile(updateProfileUserDto, userId);
  }
}
