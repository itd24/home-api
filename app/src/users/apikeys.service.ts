import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ApikeysService {
  constructor(private prisma: PrismaService) {}

  findOne(id: number) {
    return this.prisma.apiKey.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  findOneByKey(key: string) {
    return this.prisma.apiKey.findFirst({
      where: { key },
      include: { user: true },
    });
  }
}
