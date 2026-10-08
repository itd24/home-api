import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class SetEndParkingTimeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  licencePlate: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty()
  time: Date;
}
