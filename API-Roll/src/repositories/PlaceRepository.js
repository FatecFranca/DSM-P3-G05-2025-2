const prisma = require('../database/prismaClient');

class PlaceRepository {
  async create(data) {
    return await prisma.place.create({
      data
    });
  }

  async findById(id) {
    return await prisma.place.findUnique({
      where: { id },
      include: {
        category: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                user_email: true
              }
            }
          }
        }
      }
    });
  }

  async findAll(filter = {}) {
    return await prisma.place.findMany({
      where: filter,
      include: {
        category: true
      }
    });
  }

  async update(id, data) {
    return await prisma.place.update({
      where: { id },
      data,
      include: {
        category: true,
        infoPrivPlace: true
      }
    });
  }

  async delete(id) {
    return await prisma.place.delete({
      where: { id }
    });
  }

  async findByIdWithPrivateInfo(id) {
    return await prisma.place.findUnique({
      where: { id },
      include: {
        category: true,
        infoPrivPlace: true,
        comments: {
          include: {
            user: true
          }
        }
      }
    });
  }
}

module.exports = new PlaceRepository();
