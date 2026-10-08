import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

export class SetParkingTimeDto {

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  licencePlate: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty()
  time: Date;

  @IsNumber()
  @IsLongitude()
  @ApiProperty()
  longitude: number;

  @IsNumber()
  @IsLatitude()
  @ApiProperty()
  latitude: number;
}
