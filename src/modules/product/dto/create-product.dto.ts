import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @Type(() => Number)
  stock: number;

  @IsNotEmpty()
  @Type(() => Number)
  categoryId: number;
}
