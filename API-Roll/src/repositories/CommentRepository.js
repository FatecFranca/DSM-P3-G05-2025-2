const prisma = require('../database/prismaClient');

class CommentRepository {
  async create(data) {
    return await prisma.comment.create({
      data
    });
  }

  async delete(id) {
    return await prisma.comment.delete({
      where: { id }
    });
  }

  async deleteManyByUserId(userId) {
    return await prisma.comment.deleteMany({
      where: { user_id: userId }
    });
  }

  async deleteManyByPlaceId(placeId) {
    return await prisma.comment.deleteMany({
      where: { place_id: placeId }
    });
  }

  async findByPlaceId_IncludeUser(placeId) {
    return await prisma.comment.findMany({
      where: { place_id: placeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_email: true
          }
        }
      }
    });
  }

  async findById(id) {
    return await prisma.comment.findUnique({
      where: { id }
    });
  }
}

module.exports = new CommentRepository();
