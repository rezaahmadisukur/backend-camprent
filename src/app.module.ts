import { Module } from '@nestjs/common';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { AuthModule } from './infra/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_USER } from './utils/env';
// import { APP_GUARD } from '@nestjs/core';
// import { JwtAuthGuard } from './infra/auth/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    ProductModule,
    CategoryModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // With Mailtap
    MailerModule.forRoot({
      transport: {
        host: MAIL_HOST,
        port: MAIL_PORT, // Port standart mailtrap
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>',
      },
      template: {
        adapter: new HandlebarsAdapter(),
      },
    }),
  ],
  // { provide: APP_GUARD, useClass: JwtAuthGuard } kalo pake ini berarti di setiap controller gak usah pake UseGuards() method
  // providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
