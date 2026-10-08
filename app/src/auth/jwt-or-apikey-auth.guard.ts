import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrApikeyAuthGuard extends AuthGuard(['jwt', 'apiKey']) {}
