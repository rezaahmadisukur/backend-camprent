import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
