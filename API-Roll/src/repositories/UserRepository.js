const prisma = require('../database/prismaClient');

class UserRepository {
  async create(data) {
    return await prisma.user.create({
      data
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        owned_places: true,
        comments: true
      }
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { user_email: email }
    });
  }

  async findByCpf(cpf) {
    return await prisma.user.findUnique({
      where: { cpf }
    });
  }

  async findAll() {
    return await prisma.user.findMany();
  }

  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }
}

module.exports = new UserRepository();
