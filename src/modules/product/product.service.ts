import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { GetPopularProductDto } from './dto/get-popular-productdto';
import { GetProductsDto, ProductSortBy } from './dto/get-products.dto';
import { Prisma } from '@prisma/client';
import { TCreateProduct, TProduct } from './types/product';

@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<TCreateProduct> {
    return await this.prismaService.product.create({
      data: {
        ...createProductDto,
      },
    });
  }

  public async findAll(getProductsDto: GetProductsDto): Promise<TProduct[]> {
    const { limit, categoryIds, sortBy, productName } = getProductsDto;

    const whereClause: Prisma.ProductWhereInput = {};
    const orderByClause: Prisma.ProductOrderByWithRelationInput = {};

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

    const products = await this.prismaService.product.findMany({
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

  async findPopular(params: GetPopularProductDto): Promise<TProduct[]> {
    const products = await this.prismaService.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        imageUrl: true,
        description: true,
        category: {
          select: {
            id: true,
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

  private async findById(id: string): Promise<TProduct> {
    const product = await this.prismaService.product.findUnique({
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
            id: true,
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

    const updatedProduct = await this.prismaService.product.update({
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

    const deletedProduct = this.prismaService.product.delete({
      where: {
        id: id,
      },
    });

    return deletedProduct;
  }
}
