import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type Request } from 'express';
import { User } from '@prisma/client';

type AuthUser = Pick<User, 'id' | 'email' | 'name' | 'emailVerified'>;

interface AuthReq extends Request {
  user: AuthUser;
  sessionId: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthReq>();

    // 1. Get Token from cookie (Not Header Bearer because this is session token)
    const token = request.cookies['auth_token'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Session not found. Please login.');
    }

    // 2. Check to db (this is changer logic strategy)
    const session = await this.prismaService.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            // Don't Select the password for security
          },
        },
      },
    });

    // 3. Validation Duration Expiration token
    if (!session || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session has expired or invalid');
    }

    // 4. "Magic" Manual: Paste user to request
    // For @Req() req in controller can read req.user
    request.user = session.user;
    request.sessionId = session.id;

    return true;
  }
}
