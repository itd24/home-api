import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { HomeApiExceptionFilter } from '@home-api-exception/home-api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  app.useGlobalFilters(new HomeApiExceptionFilter(httpAdapter));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Home API')
    .setDescription('A simple home api for home needs')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  // swagger: http://localhost:3001/api/
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // REQUIRED with nestjs-zod v5 — without this, Zod DTO schemas don't render correctly.
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document));

  await app.listen(3000);
}
bootstrap();
