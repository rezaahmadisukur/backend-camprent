import { Injectable } from '@nestjs/common';
import { TGetProfile, UsersService } from '../users/users.service';
import { RegisterUserDto } from '../users/dto/register.dto';
import { LoginUserDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async register(registerUserDto: RegisterUserDto) {
    return await this.userService.signUp(registerUserDto);
  }

  async login(loginUserDto: LoginUserDto) {
    return await this.userService.singIn(loginUserDto);
  }

  getProfile(req: TGetProfile) {
    return this.userService.me(req);
  }
}
