const CategoryRepository = require('../repositories/CategoryRepository');
const ApiError = require('../utils/ApiError');

class CategoryService {
  async create(data) {
    // Validar se title é string não vazia
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      throw new ApiError(400, 'Title is required and must be a non-empty string');
    }

    // Verificar se title já existe
    const existingCategory = await CategoryRepository.findByTitle(data.title);
    if (existingCategory) {
      throw new ApiError(409, 'Category with this title already exists');
    }

    return await CategoryRepository.create(data);
  }

  async findById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  }

  async findAll() {
    return await CategoryRepository.findAll();
  }

  async update(id, data) {
    // Verificar se categoria existe
    await this.findById(id);

    // Validar title se fornecido
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim() === '') {
        throw new ApiError(400, 'Title must be a non-empty string');
      }

      // Verificar se o novo title já existe em outra categoria
      const existingCategory = await CategoryRepository.findByTitle(data.title);
      if (existingCategory && existingCategory.id !== id) {
        throw new ApiError(409, 'Category with this title already exists');
      }
    }

    return await CategoryRepository.update(id, data);
  }

  async delete(id) {
    // Verificar se categoria existe e buscar com places
    const category = await CategoryRepository.findByIdWithPlaces(id);
    
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Verificar se a categoria está em uso por algum place
    if (category.places && category.places.length > 0) {
      throw new ApiError(400, 'Cannot delete category that is in use by places');
    }

    return await CategoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
