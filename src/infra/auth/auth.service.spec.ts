import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService - SignUp', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() }, // Kita palsukan fungsi database
            $transaction: jest.fn(), // Kita palsukan transaksi
          },
        },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn() }, // Kita palsukan pengiriman email
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('must successfully register user, save to DB, and send email', async () => {
    const dto = {
      email: 'test@mail.com',
      password: 'password123',
      confirmPassword: 'password123',
      name: 'New User Test',
    };

    // 1. Mock: Email does not exist in DB (return null)
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    // 2. Mock: Transaction successful
    // We create a fake transaction that immediately executes its callback
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return await callback({
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'user-123',
            email: dto.email,
          }),
        },
        verification: {
          create: jest.fn().mockResolvedValue({
            id: 'user-123',
          }),
        },
      });
    });

    const result = await service.signUp(dto);

    // 4. Expectation V
    expect(result).toHaveProperty(
      'message',
      'Registration Successfully. Check email to verification',
    );
    expect(result).toHaveProperty('userId', 'user-123');

    // 5. Pastikan Email Service dipanggil (Penting!)
    // Kita cek apakah asisten robot beneran manggil fungsi kirim email
    // (Asumsikan di service kamu panggil mailerService.sendMail atau sendVerificationEmail)
    // expect(mailerService.sendMail).toHaveBeenCalled();
  });

  /**
   * Failed : Error password and confirm password not match
   */
  it('Throw error if password and confirmPassword not match', async () => {
    const dto = {
      email: 'test@mail.com',
      password: 'password123',
      confirmPassword: 'password1234',
      name: 'User Test',
    };

    // Kita jalankan dan berharap dia "Reject" (Error)
    await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
  });

  /**
   * Failed: Error email has registered
   */
  it('Throw error if email has registered', async () => {
    const dto = {
      email: 'test@mail.com',
      password: 'password123',
      confirmPassword: 'password123',
      name: 'User Test',
    };

    // Kita "setting" Prisma palsu: "Kalau ada yang cari email ini, balikin data user (bukan null)"
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@mail.com',
    });

    // Kita jalankan dan berharap dia Error
    await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
  });
});
