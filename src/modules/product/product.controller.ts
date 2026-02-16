import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/infra/auth/jwt-auth.guard';
import { Public } from 'src/infra/auth/public.decorator';
import { GetPopularProductDto } from './dto/get-popular-productdto';
import { GetProductsDto } from './dto/get-products.dto';

@UseGuards(JwtAuthGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('/popular')
  @Public()
  findPopular(@Query() getPopularProductDto: GetPopularProductDto) {
    return this.productService.findPopular(getPopularProductDto);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post('/browse')
  @Public()
  findAll(@Body() getProductsDto: GetProductsDto) {
    return this.productService.findAll(getProductsDto);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
