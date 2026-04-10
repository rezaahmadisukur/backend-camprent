import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '@/infra/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const newCategory = await this.prismaService.category.create({
      data: {
        ...createCategoryDto,
      },
    });

    return newCategory;
  }

  async findAll() {
    const categories = await this.prismaService.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return categories;
  }

  async findOne(id: string) {
    const category = await this.findById(id);

    if (!category) {
      throw new NotFoundException(`Category Not Found`);
    }

    return category;
  }

  private async findById(id: string) {
    const category = await this.prismaService.category.findUnique({
      where: {
        id: id,
      },
      select: {
        name: true,
      },
    });

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findById(id);

    if (!category) {
      throw new NotFoundException('Category Not Found');
    }

    const updatedCategory = await this.prismaService.category.update({
      where: {
        id: id,
      },
      data: updateCategoryDto,
    });

    return updatedCategory;
  }

  async remove(id: string) {
    const deleteCategory = await this.prismaService.category.delete({
      where: {
        id: id,
      },
    });
    return deleteCategory;
  }
}
