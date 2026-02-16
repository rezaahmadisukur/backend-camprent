import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @Type(() => Number)
  price: number = 0;

  @IsNotEmpty()
  @Type(() => Number)
  stock: number = 0;

  @IsNotEmpty()
  categoryId: string = '';
}
