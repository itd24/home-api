import { Module } from '@nestjs/common';
import { AppController } from '@app.controller';
import { AppService } from '@app.service';
import { PrismaModule } from 'nestjs-prisma';
import { CarsModule } from '@cars/cars.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BankingModule } from './banking/banking.module';
import { DocumentsModule } from './documents/documents.module';
import { LatexModule } from './latex/latex.module';
import { MatchingModule } from './matching/matching.module';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    CarsModule,
    AuthModule,
    UsersModule,
    BankingModule,
    DocumentsModule,
    LatexModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe, // validates every @Body()/@Query()/@Param() typed with a createZodDto class
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor, // runs the @ZodResponse output schema on responses
    }
  ],
})
export class AppModule {}
