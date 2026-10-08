import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Coordinates } from '@core/types/coordinates';
import { HomeApiException } from '@core/HomeApiException';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async findCar({ licencePlate }: { licencePlate: string }) {
    const car = await this.prisma.car.findUnique({
      where: { licencePlate: licencePlate },
    });
    if (!car) {
      return false;
    }
    return car;
  }

  async setParking({
    licencePlate,
    times,
    location,
  }: {
    licencePlate: string;
    times: { startTime: Date | null; endTime?: Date | null };
    location?: Coordinates | null;
  }) {
    if (!licencePlate)
      throw new HomeApiException({
        message: 'Licence plate must not be empty!',
        errorCode: 100002,
        httpStatusCode: 400,
      });
    const car = await this.findCar({ licencePlate });
    if (!car) {
      throw new HomeApiException({
        message: 'Car not found!',
        errorCode: 100001,
        httpStatusCode: 404,
      });
    }

    return this.prisma.parking.upsert({
      where: {
        carLicencePlate: licencePlate,
      },
      update: {
        ...(times.startTime && { startTime: times.startTime }),
        ...(times.endTime && { endTime: times.endTime }),
        ...(location && { longitude: location.longitude }),
        ...(location && { latitude: location.latitude }),
      },
      create: {
        carLicencePlate: licencePlate,
        longitude: location && location.longitude ? location.longitude : 0,
        latitude: location && location.latitude ? location.latitude : 0,
        startTime: times.startTime || new Date(),
        endTime: times.endTime || new Date(),
      },
    });
  }

  async getParkingLocation({ licencePlate }: { licencePlate: string }) {
    if (!licencePlate)
      throw new HomeApiException({
        message: 'Licence plate must not be empty!',
        errorCode: 100003,
        httpStatusCode: 400,
      });
    return await this.prisma.parking.findUnique({
      where: { carLicencePlate: licencePlate },
    });
  }

  async startParking({
    licencePlate,
    startTime,
    location,
  }: {
    licencePlate: string;
    startTime: Date;
    location: { latitude: number; longitude: number };
  }) {
    return await this.setParking({
      licencePlate,
      times: {
        startTime,
        endTime: null,
      },
      location,
    });
  }

  async stopParking({
    licencePlate,
    endTime,
  }: {
    licencePlate: string;
    endTime: Date;
  }) {
    return await this.setParking({
      licencePlate,
      times: { endTime, startTime: null },
      location: null,
    });
  }
}
