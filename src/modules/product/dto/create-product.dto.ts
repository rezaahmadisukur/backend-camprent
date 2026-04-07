import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name cannot be empty' })
  name!: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Price cannot be empty' })
  @Type(() => Number)
  price!: number;

  @IsInt()
  @IsNotEmpty({ message: 'Stock cannot be empty' })
  @Type(() => Number)
  stock!: number;

  @IsString()
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId!: string;
}
