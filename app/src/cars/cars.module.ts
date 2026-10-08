import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { UsersModule } from '@users/users.module';

@Module({
  controllers: [CarsController],
  providers: [CarsService],
  imports: [UsersModule],
})
export class CarsModule {}
