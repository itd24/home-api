import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { UsersService } from '@users/users.service';
import { HomeApiException } from '@core/HomeApiException';
import { ApikeysService } from '@users/apikeys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'apiKey') {
  constructor(
    private usersService: UsersService,
    private apikeysService: ApikeysService,
  ) {
    super();
  }

  async validate(req: Request) {
    const apiKey = req.headers['x-api-key'] || req.headers['X-Api-Key'];
    const apiUser = req.headers['x-api-user'] || req.headers['X-Api-User'];
    let isValid = false;

    if (apiKey) {
      const apiKeyData = await this.apikeysService.findOneByKey(apiKey);
      if (
        apiKeyData &&
        apiKeyData.isValid &&
        apiKeyData.user.email === apiUser
      ) {
        isValid = true;
      }
    }
    return isValid;
  }
}
