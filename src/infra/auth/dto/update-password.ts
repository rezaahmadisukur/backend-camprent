import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordUserDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/, {
    message:
      'at least one lowercase letter and one number, with a minimum length of 8 characters',
  })
  newPassword: string;
}
