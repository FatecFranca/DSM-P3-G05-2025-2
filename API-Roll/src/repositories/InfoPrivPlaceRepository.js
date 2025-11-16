const prisma = require('../database/prismaClient');

class InfoPrivPlaceRepository {
  async create(data) {
    return await prisma.infosPrivPlace.create({
      data
    });
  }

  async findById(id) {
    return await prisma.infosPrivPlace.findUnique({
      where: { id }
    });
  }

  async findByPlaceId(placeId) {
    return await prisma.infosPrivPlace.findUnique({
      where: { place_id: placeId }
    });
  }

  async findByCnpj(cnpj) {
    return await prisma.infosPrivPlace.findUnique({
      where: { cnpj }
    });
  }

  async update(id, data) {
    return await prisma.infosPrivPlace.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return await prisma.infosPrivPlace.delete({
      where: { id }
    });
  }

  async deleteByPlaceId(placeId) {
    return await prisma.infosPrivPlace.delete({
      where: { place_id: placeId }
    });
  }
}

module.exports = new InfoPrivPlaceRepository();
