import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ApikeysService } from './apikeys.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ApikeysService],
  exports: [UsersService, ApikeysService],
})
export class UsersModule {}
