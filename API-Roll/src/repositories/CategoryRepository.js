const prisma = require('../database/prismaClient');

class CategoryRepository {
  async create(data) {
    return await prisma.category.create({
      data
    });
  }

  async findById(id) {
    return await prisma.category.findUnique({
      where: { id }
    });
  }

  async findByIdWithPlaces(id) {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        places: true
      }
    });
  }

  async findByTitle(title) {
    return await prisma.category.findUnique({
      where: { title }
    });
  }

  async findAll() {
    return await prisma.category.findMany();
  }

  async update(id, data) {
    return await prisma.category.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return await prisma.category.delete({
      where: { id }
    });
  }
}

module.exports = new CategoryRepository();
