const UserRepository = require('../repositories/UserRepository');
const ApiError = require('../utils/ApiError');

class UserService {
  async create(userData) {
    // 1. Validar campos obrigatórios (name, email)
    if (!userData.name || typeof userData.name !== 'string' || userData.name.trim() === '') {
      throw new ApiError(400, 'Name is required and must be a non-empty string');
    }

    if (!userData.user_email || typeof userData.user_email !== 'string' || userData.user_email.trim() === '') {
      throw new ApiError(400, 'Email is required and must be a non-empty string');
    }

    if (!userData.type_user || !['C', 'O'].includes(userData.type_user)) {
      throw new ApiError(400, 'Type user is required and must be either "C" (Client) or "O" (Owner)');
    }

    // 2. Se type_user === 'O', validar campos adicionais (cpf, phone)
    if (userData.type_user === 'O') {
      if (!userData.cpf || typeof userData.cpf !== 'string' || userData.cpf.trim() === '') {
        throw new ApiError(400, 'CPF is required for Owner type users');
      }

      if (!userData.phone_number || typeof userData.phone_number !== 'string' || userData.phone_number.trim() === '') {
        throw new ApiError(400, 'Phone number is required for Owner type users');
      }
    }

    // 3. Verificar duplicidade de email
    const existingUserByEmail = await UserRepository.findByEmail(userData.user_email);
    if (existingUserByEmail) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // 4. Se type_user === 'O', verificar duplicidade de CPF
    if (userData.type_user === 'O') {
      const existingUserByCpf = await UserRepository.findByCpf(userData.cpf);
      if (existingUserByCpf) {
        throw new ApiError(409, 'User with this CPF already exists');
      }
    }

    // 5. Se type_user === 'O', inicializar cnpj_owner = []
    if (userData.type_user === 'O') {
      userData.cnpj_owner = [];
    }

    // 6. Chamar repository.create(userData)
    return await UserRepository.create(userData);
  }

  async findById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  async findAll() {
    return await UserRepository.findAll();
  }

  async update(id, data) {
    // Verificar se usuário existe
    const user = await this.findById(id);

    // Bloquear alteração de campos sensíveis
    if (data.type_user !== undefined) {
      throw new ApiError(400, 'Cannot change user type after creation');
    }

    if (data.cnpj_owner !== undefined) {
      throw new ApiError(400, 'Cannot modify cnpj_owner directly. This field is managed automatically by the system.');
    }

    // Validar email se fornecido
    if (data.user_email !== undefined) {
      const existingUser = await UserRepository.findByEmail(data.user_email);
      if (existingUser && existingUser.id !== id) {
        throw new ApiError(409, 'User with this email already exists');
      }
    }

    // Validar CPF se fornecido
    if (data.cpf !== undefined) {
      // Validar se é um usuário Owner tentando mudar CPF
      if (user.type_user === 'O') {
        throw new ApiError(400, 'Cannot change CPF for Owner type users. CPF is used as primary identifier for place ownership.');
      }
      
      const existingUser = await UserRepository.findByCpf(data.cpf);
      if (existingUser && existingUser.id !== id) {
        throw new ApiError(409, 'User with this CPF already exists');
      }
    }

    // Se é Owner, validar que phone_number não seja removido
    if (user.type_user === 'O' && data.phone_number !== undefined) {
      if (!data.phone_number || typeof data.phone_number !== 'string' || data.phone_number.trim() === '') {
        throw new ApiError(400, 'Phone number is required for Owner type users');
      }
    }

    return await UserRepository.update(id, data);
  }

  async exclude(id) {
    // 1. Obter usuário
    const user = await this.findById(id);

    // 2. Se user.type_user === 'O' e user.cnpj_owner.length > 0, deletar os places
    if (user.type_user === 'O' && user.cnpj_owner && user.cnpj_owner.length > 0) {
      // Importar PlaceService para evitar dependência circular
      const PlaceService = require('./PlaceService');
      
      // Para cada cnpj, obter o place e deletar
      for (const cnpj of user.cnpj_owner) {
        // Precisamos encontrar o place_id pelo cnpj
        const InfoPrivPlaceRepository = require('../repositories/InfoPrivPlaceRepository');
        const infoPrivPlace = await InfoPrivPlaceRepository.findByCnpj(cnpj);
        if (infoPrivPlace) {
          await PlaceService.delete(infoPrivPlace.place_id);
        }
      }
    }

    // 3. Deletar todos os comentários do usuário
    const CommentRepository = require('../repositories/CommentRepository');
    await CommentRepository.deleteManyByUserId(id);

    // 4. Deletar o usuário
    return await UserRepository.delete(id);
  }
}

module.exports = new UserService();
