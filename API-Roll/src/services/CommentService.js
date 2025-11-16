const CommentRepository = require('../repositories/CommentRepository');
const UserRepository = require('../repositories/UserRepository');
const ApiError = require('../utils/ApiError');

class CommentService {
  async create(data) {
    // 1. Validar conteúdo
    if (!data.content || typeof data.content !== 'string' || data.content.trim() === '') {
      throw new ApiError(400, 'Content is required and must be a non-empty string');
    }

    // 2. Validar usuário: Chamar UserRepository.findByEmail(data.user_email)
    if (!data.user_email) {
      throw new ApiError(400, 'User email is required');
    }

    const user = await UserRepository.findByEmail(data.user_email);
    if (!user) {
      throw new ApiError(400, 'User with this email not found');
    }

    // 3. Validar local: Chamar PlaceRepository.findById(data.place_id)
    if (!data.place_id) {
      throw new ApiError(400, 'Place ID is required');
    }

    const PlaceRepository = require('../repositories/PlaceRepository');
    const place = await PlaceRepository.findById(data.place_id);
    if (!place) {
      throw new ApiError(400, 'Place not found');
    }

    // 4. Montar DTO com { content, place_id, user_id }
    const dto = {
      content: data.content,
      place_id: data.place_id,
      user_id: user.id
    };

    // 5. Chamar repository.create(dto)
    return await CommentRepository.create(dto);
  }

  async delete(id) {
    const comment = await CommentRepository.findById(id);
    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    return await CommentRepository.delete(id);
  }

  async findByPlaceId(placeId) {
    return await CommentRepository.findByPlaceId_IncludeUser(placeId);
  }
}

module.exports = new CommentService();
