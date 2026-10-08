import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { JwtService } from '@nestjs/jwt';
import { AuthEntity } from '@auth/entity/auth.entity';
import { HomeApiException } from '@core/HomeApiException';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthEntity> {
    // Step 1: Fetch a user with the given email
    const user = await this.prisma.user.findUnique({ where: { email: email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        accessToken: this.jwtService.sign({ userId: user.id }),
      };
    }
    throw new HomeApiException({
      message: `Invalid password or username`,
      httpStatusCode: 403,
      errorCode: 100004,
    });
  }
}
