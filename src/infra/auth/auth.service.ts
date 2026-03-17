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
// import { GetProfileUserDto } from './dto/get-profile.dto';
import { UpdateProfileUserDto } from './dto/update-profile.dto';
import { AuthenticatedRequest } from './@types/auth';
import { UpdatePasswordUserDto } from './dto/update-password';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
// import * as nodemailer from 'nodemailer';
// import { EMAIL_PASS, EMAIL_USER } from '@/utils/env';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

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

      // Send email verification
      // await this.sendVerificationEmail(user.email, token);

      // Here usually you call MailService for send the email
      // console.log('send email to ${user.email} with token: ${token}');

      return {
        message: 'Registration Successfully. Check email to verification',
        userId: user.id,
      };
    });
  }

  // private async sendVerificationEmail(email: string, token: string) {
  //   const transporter = nodemailer.createTransport({
  //     service: 'gmail',
  //     auth: {
  //       user: EMAIL_USER,
  //       pass: EMAIL_PASS,
  //     },
  //   });

  //   const mailOptions = {
  //     from: EMAIL_USER,
  //     to: email,
  //     subject: 'Verify your email',
  //     text: `Click this link to verify your email: http://localhost:3000/verify-email?token=${token}`,
  //   };

  //   await transporter.sendMail(mailOptions);
  // }

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

    const isMatch = await bcrypt.compare(loginUserDto.password, user!.password);

    // 2. check user and password
    if (!user || !isMatch) {
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
