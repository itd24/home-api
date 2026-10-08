import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CarsService } from './cars.service';
import { SetParkingTimeDto } from '@cars/dto/set.parkingTime.dto';
import { SetEndParkingTimeDto } from '@cars/dto/set.endParkingTime.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtOrApikeyAuthGuard } from '@auth/jwt-or-apikey-auth.guard';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get('parkinglocation/:licencePlate')
  @ApiTags('car')
  @ApiBearerAuth()
  @UseGuards(JwtOrApikeyAuthGuard)
  async getParkingLocation(@Param('licencePlate') licencePlate: string) {
    return await this.carsService.getParkingLocation({ licencePlate });
  }

  @Post('startparking')
  @ApiTags('car')
  async startParking(@Body() setParkingTimeDto: SetParkingTimeDto) {
    return await this.carsService.startParking({
      licencePlate: setParkingTimeDto.licencePlate,
      startTime: setParkingTimeDto.time,
      location: {
        latitude: setParkingTimeDto.latitude,
        longitude: setParkingTimeDto.longitude,
      },
    });
  }

  @Post('stopparking')
  @ApiTags('car')
  async stopParking(@Body() setEndParkingTimeDto: SetEndParkingTimeDto) {
    return await this.carsService.stopParking({
      licencePlate: setEndParkingTimeDto.licencePlate,
      endTime: setEndParkingTimeDto.time,
    });
  }
}
