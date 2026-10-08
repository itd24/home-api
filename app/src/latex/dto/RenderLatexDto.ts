import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate } from 'class-validator';

export class RenderLatexDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  template: string;

  @IsString()
  @ApiPropertyOptional()
  imageUrl: string;
}