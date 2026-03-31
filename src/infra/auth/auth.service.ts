import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
// import { GetProfileUserDto } from './dto/get-profile.dto';
import { UpdateProfileUserDto } from './dto/update-profile.dto';
import { AuthenticatedRequest } from './@types/auth';
import { UpdatePasswordUserDto } from './dto/update-password';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
// import * as nodemailer from 'nodemailer';
// import { EMAIL_PASS, EMAIL_USER } from '@/utils/env';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async signUp(registerUserDto: RegisterUserDto) {
    if (registerUserDto.password !== registerUserDto.confirmPassword) {
      throw new BadRequestException('Confirmation password does not match');
    }

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
    const result = await this.prismaService.$transaction(async (tx) => {
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

      return { email: user.email, token: token, userId: user.id };
    });

    try {
      // Send email verification
      await this.sendVerificationEmail(result.email, result.token);
    } catch (error) {
      console.error(error);
    }

    // Here usually you call MailService for send the email
    return {
      message: 'Registration Successfully. Check email to verification',
      userId: result.userId,
    };
  }

  private async sendVerificationEmail(email: string, token: string) {
    // 1. Make link verification
    const verificationUrl = `http://localhost:3000/auth/verify?token=${token}`;

    // 2. Send email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome! Please Verification Your Email',
      // We use 'html' as changer 'template'
      html: `
        <h1>Halo</h1>
        <p>Thank you for registered. Please click link this bellow for verification your email:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verification Account</a>
        <p>If button above not function, click this link: ${verificationUrl}</p>
      `,
      // template: 'welcome',
      // context: {
      //   name: 'John',
      // },
    });
  }

  /** METHOD VERIFICATION EMAIL */
  public async verifyEmail(token: string) {
    // 1. Check token and expired date
    const verification = await this.prismaService.verification.findUnique({
      where: {
        token: token,
      },
    });

    // 2. Check whatever token has been and not expired
    if (!verification || new Date() > verification.expiresAt) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 3. update status token and delete token (use Transaction for safety)
    await this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: verification.identifier },
      });

      if (!user) {
        throw new NotFoundException('User not found!. Please register again');
      }

      await tx.user.update({
        where: {
          email: verification.identifier,
        },
        data: {
          emailVerified: true,
        },
      });

      await tx.verification.delete({
        where: { id: verification.id },
      });
    });

    // Send email success verification
    return {
      message: 'Email verified successfully',
    };
  }

  async singIn(loginUserDto: LoginUserDto) {
    // 1. Find User by email
    const user = await this.findUserByEmail(loginUserDto.email);

    // 2. check user
    if (!user) {
      throw new UnauthorizedException('Email or Password is wrong');
    }

    // check password
    const isMatch = await bcrypt.compare(loginUserDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email or Password is wrong');
    }

    // Check if email not verified
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email not verified, check your inbox or email for verification',
      );
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

  async logout(token: string) {
    // We will delete the session with token
    await this.prismaService.session.deleteMany({
      where: { sessionToken: token },
    });

    return { message: 'Session deleted from database' };
  }

  me(req: AuthenticatedRequest) {
    return {
      message: 'Get profile successfully',
      user: req.user,
    };
  }

  private async findUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  }

  public async updateProfile(
    updateProfileUserDto: UpdateProfileUserDto,
    userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException(
        'User not found, you are not logged in yet',
      );
    }

    const updateProfile = await this.prismaService.user.update({
      where: { id: userId },
      data: updateProfileUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
      },
    });

    return updateProfile;
  }

  public async updatePassword(
    updatePasswordUserDto: UpdatePasswordUserDto,
    userId: string,
  ) {
    if (
      updatePasswordUserDto.newPassword !==
      updatePasswordUserDto.confirmPassword
    ) {
      throw new BadRequestException('Confirmation password does not match');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    const isMatch = await bcrypt.compare(
      updatePasswordUserDto.oldPassword,
      user!.password,
    );

    if (!user && !isMatch) {
      throw new UnauthorizedException('User not found or Password is wrong');
    }

    const newPassword = await bcrypt.hash(
      updatePasswordUserDto.newPassword,
      10,
    );

    return await this.prismaService.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: newPassword },
      });

      await tx.session.deleteMany({
        where: { userId: userId },
      });

      return {
        message: 'Update password successfully',
      };
    });
  }

  private async sendResetPasswordEmail(
    email: string | undefined,
    token: string,
  ) {
    // 1. Make reset link
    const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}`;

    // 2. Send email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Permission Reset Password',
      html: `
        <h1>Permission Reset Password</h1>
        <p>We've received a request to reset your account password. Click the button below to continue:</p>
        <a href="${resetPasswordUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset My Password
      </a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you don't feel like you requested this, please ignore this email.</p>
      `,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.findUserByEmail(forgotPasswordDto.email);

    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

      await this.prismaService.verification.deleteMany({
        where: { identifier: user.email },
      });

      await this.prismaService.verification.create({
        data: {
          identifier: user.email,
          token: token,
          expiresAt: expiresAt,
        },
      });
      // Send email to reset verification
      await this.sendResetPasswordEmail(user?.email, token);
    }

    return {
      message:
        'If your email is registered, you will receive a password reset link.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Confirmation password does not match');
    }

    const verification = await this.prismaService.verification.findUnique({
      where: { token: resetPasswordDto.token },
    });

    if (!verification || new Date() > verification.expiresAt) {
      throw new UnauthorizedException('Token is invalid or has expired');
    }

    const hashedNewPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      10,
    );

    return await this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email: verification.identifier },
        data: {
          password: hashedNewPassword,
        },
      });

      await tx.verification.delete({
        where: { id: verification.id },
      });

      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      return {
        message: 'Reset Password Successfully',
      };
    });
  }
}
