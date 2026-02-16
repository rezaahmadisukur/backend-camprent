import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum ProductSortBy {
  RECOMMENDED = 'recommended',
  PRICE_ASC = 'price-asc',
  PIRCE_DESC = 'price-desc',
}

export class GetProductsDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: string | string[] }) =>
    Array.isArray(value) ? value : [value],
  )
  categoryIds?: string[];

  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;
}
