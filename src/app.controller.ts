import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './infra/auth/auth.service';
import { LocalAuthGuard } from './infra/auth/local-auth.guard';
import { JwtAuthGuard } from './infra/auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  login(@Request() req: { user: { username: string; userId: number } }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { username: string; userId: number } }) {
    return req.user;
  }
}
