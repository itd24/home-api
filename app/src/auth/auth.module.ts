import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@users/users.module';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtSecret } from '@core/constants';
import { ApiKeyStrategy } from '@auth/strategy/apiKey.strategy';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { ApikeyAuthGuard } from '@auth/apikey-auth.guard';
import { JwtOrApikeyAuthGuard } from '@auth/jwt-or-apikey-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1d' }, // e.g. 30s, 7d, 24h
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ApiKeyStrategy,
    JwtAuthGuard,
    ApikeyAuthGuard,
    JwtOrApikeyAuthGuard,
  ],
})
export class AuthModule {}
