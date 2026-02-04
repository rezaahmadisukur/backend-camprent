import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class GetProfileUserDto {
  @Type(() => Number)
  userId: number;

  @IsString()
  email: string;
}
