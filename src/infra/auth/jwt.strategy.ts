import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { PrismaService } from '../prisma/prisma.service';

export type TPayload = {
  sub: number;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret!,
    });
  }

  async validate(payload: TPayload) {
    const user = await this.prismaService.users.findUnique({
      where: {
        id: payload.sub,
      },
    });

    // console.log()

    if (!user) throw new UnauthorizedException('Email or Password is wrong');

    const { password, ...result } = user;

    return result;
  }
}
