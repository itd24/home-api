import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import {BaseExceptionFilter} from "@nestjs/core";
import { Response } from 'express';
import {HomeApiException} from "@core/HomeApiException";

@Catch()
export class HomeApiExceptionFilter<T> extends BaseExceptionFilter {

  getStatusCode(exception: Error){
    if(exception instanceof HomeApiException){
      return exception.getHttpStatusCode();
    }
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return 500;
  }

  getErrorCode(exception: Error){
    if(exception instanceof HomeApiException){
      return exception.getErrorCode();
    }
    return null;
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    console.error(exception.message);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');
    const status = this.getStatusCode(exception);

    response.status(status).json({
      statusCode: status,
      errorCode: this.getErrorCode(exception),
      message: message,
    });
  }
}
