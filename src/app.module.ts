import { Module } from '@nestjs/common';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { AuthModule } from './infra/auth/auth.module';
import { UsersModule } from './infra/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './infra/auth/constants';
// import { APP_GUARD } from '@nestjs/core';
// import { JwtAuthGuard } from './infra/auth/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    ProductModule,
    CategoryModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  // { provide: APP_GUARD, useClass: JwtAuthGuard } kalo pake ini berarti di setiap controller gak usah pake UseGuards() method
  // providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
