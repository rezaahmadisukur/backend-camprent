import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetPopularProductDto } from './dto/get-popular-productdto';
import { GetProductsDto, ProductSortBy } from './dto/get-products.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return await this.prismaService.products.create({
      data: {
        ...createProductDto,
      },
    });
  }

  public async findAll(getProductsDto: GetProductsDto) {
    const { limit, categoryIds, sortBy, productName } = getProductsDto;

    const whereClause: Prisma.ProductsWhereInput = {};
    const orderByClause: Prisma.ProductsOrderByWithRelationInput = {};

    if (productName) {
      whereClause.name = {
        contains: productName,
        mode: 'insensitive',
      };
    }

    if (categoryIds?.length) {
      whereClause.category = {
        name: {
          in: categoryIds,
          mode: 'insensitive',
        },
      };
    }

    switch (sortBy) {
      case ProductSortBy.PRICE_ASC:
        orderByClause.price = 'asc';
        break;
      case ProductSortBy.PIRCE_DESC:
        orderByClause.price = 'desc';
        break;
      default:
        break;
    }

    const products = await this.prismaService.products.findMany({
      take: limit,
      where: whereClause,
      orderBy: orderByClause,
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        imageUrl: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return products.map((product) => ({
      ...product,
      price: product.price.toNumber(),
    }));
  }

  async findPopular(params: GetPopularProductDto) {
    const products = await this.prismaService.products.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        imageUrl: true,
        description: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: params.limit,
    });
    return products.map((product) => ({
      ...product,
      price: product.price.toNumber(),
    }));
  }

  async findOne(id: string) {
    const product = await this.findById(id);

    if (!product) {
      throw new NotFoundException(`Product Not Found`);
    }

    return product;
  }

  private async findById(id: string) {
    const product = await this.prismaService.products.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        imageUrl: true,
        description: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      ...product,
      price: product?.price.toNumber(),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findById(id);

    if (!product) {
      throw new NotFoundException(`Product Not Found`);
    }

    const updatedProduct = await this.prismaService.products.update({
      where: {
        id: id,
      },
      data: updateProductDto,
    });

    return updatedProduct;
  }

  async remove(id: string) {
    const product = await this.findById(id);

    if (!product) {
      throw new NotFoundException(`Product Not Found`);
    }

    const deletedProduct = this.prismaService.products.delete({
      where: {
        id: id,
      },
    });

    return deletedProduct;
  }
}
