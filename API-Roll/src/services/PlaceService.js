const PlaceRepository = require('../repositories/PlaceRepository');
const InfoPrivPlaceRepository = require('../repositories/InfoPrivPlaceRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const UserRepository = require('../repositories/UserRepository');
const CommentRepository = require('../repositories/CommentRepository');
const prisma = require('../database/prismaClient');
const ApiError = require('../utils/ApiError');

class PlaceService {
  async create(documento) {
    // 1. Validar Categoria
    if (!documento.category_title) {
      throw new ApiError(400, 'Category title is required');
    }

    const category = await CategoryRepository.findByTitle(documento.category_title);
    if (!category) {
      throw new ApiError(400, 'Category not found');
    }

    // 2. Validar Dono
    if (!documento.owner_cpf) {
      throw new ApiError(400, 'Owner CPF is required');
    }

    const owner = await UserRepository.findByCpf(documento.owner_cpf);
    if (!owner) {
      throw new ApiError(400, 'Owner not found');
    }

    if (owner.type_user !== 'O') {
      throw new ApiError(400, 'User must be of type Owner (O)');
    }

    // 3. Validar Unicidade do CNPJ
    if (!documento.cnpj) {
      throw new ApiError(400, 'CNPJ is required');
    }

    const existingInfoPrivPlace = await InfoPrivPlaceRepository.findByCnpj(documento.cnpj);
    if (existingInfoPrivPlace) {
      throw new ApiError(409, 'A place with this CNPJ already exists');
    }

    // Validar campos obrigatórios do Place
    const requiredFields = ['place_name', 'opening_hours', 'closing_hours', 'street', 'street_number', 'phone_number'];
    for (const field of requiredFields) {
      if (!documento[field]) {
        throw new ApiError(400, `${field} is required`);
      }
    }

    // Validar campos obrigatórios do InfoPrivPlace
    if (!documento.razao_social) {
      throw new ApiError(400, 'razao_social is required');
    }

    // 4. Iniciar transação
    return await prisma.$transaction(async (tx) => {
      // a. Criar o Place (público)
      const place = await tx.place.create({
        data: {
          place_name: documento.place_name,
          opening_hours: documento.opening_hours,
          closing_hours: documento.closing_hours,
          tags: documento.tags || [],
          street: documento.street,
          street_number: documento.street_number,
          phone_number: documento.phone_number,
          category_id: category.id
        }
      });

      // b. Criar o InfosPrivPlace (privado)
      await tx.infosPrivPlace.create({
        data: {
          razao_social: documento.razao_social,
          cnpj: documento.cnpj,
          place_id: place.id,
          owner_id: owner.id
        }
      });

      // c. Atualizar o User dono, adicionando o novo cnpj ao seu array 'cnpj_owner'
      await tx.user.update({
        where: { id: owner.id },
        data: {
          cnpj_owner: {
            push: documento.cnpj
          }
        }
      });

      return place;
    });
  }

  async delete(id) {
    // 1. Buscar InfosPrivPlace por place_id
    const infoPrivPlace = await InfoPrivPlaceRepository.findByPlaceId(id);
    if (!infoPrivPlace) {
      throw new ApiError(404, 'Place not found');
    }

    // 2. Buscar o User (dono)
    const owner = await UserRepository.findById(infoPrivPlace.owner_id);
    if (!owner) {
      throw new ApiError(404, 'Owner not found');
    }

    // 3. Remover o cnpj do array 'cnpj_owner' do usuário
    const updatedCnpjOwner = (owner.cnpj_owner || []).filter(cnpj => cnpj !== infoPrivPlace.cnpj);

    // 4. Iniciar transação
    return await prisma.$transaction(async (tx) => {
      // a. Atualizar o documento do User com o novo array 'cnpj_owner'
      await tx.user.update({
        where: { id: owner.id },
        data: {
          cnpj_owner: {
            set: updatedCnpjOwner
          }
        }
      });

      // b. Deletar todos os comentários associados
      await tx.comment.deleteMany({
        where: { place_id: id }
      });

      // c. Deletar o InfosPrivPlace
      await tx.infosPrivPlace.delete({
        where: { place_id: id }
      });

      // d. Deletar o Place
      await tx.place.delete({
        where: { id }
      });
    });
  }

  async search(queryData) {
    const filter = {};

    // Filtrar por tag
    if (queryData.tag) {
      filter.tags = {
        has: queryData.tag
      };
    }

    // Filtrar por nome (busca parcial case-insensitive)
    if (queryData.name) {
      filter.place_name = {
        contains: queryData.name,
        mode: 'insensitive'
      };
    }

    // Filtrar por categoria
    if (queryData.category) {
      const category = await CategoryRepository.findByTitle(queryData.category);
      if (category) {
        filter.category_id = category.id;
      } else {
        // Se a categoria não existe, retornar array vazio
        return [];
      }
    }

    return await PlaceRepository.findAll(filter);
  }

  async retrievePublicProfileById(id) {
    const place = await PlaceRepository.findById(id);
    if (!place) {
      throw new ApiError(404, 'Place not found');
    }

    // Retornar apenas informações públicas (sem infoPrivPlace)
    return {
      id: place.id,
      place_name: place.place_name,
      opening_hours: place.opening_hours,
      closing_hours: place.closing_hours,
      tags: place.tags,
      street: place.street,
      street_number: place.street_number,
      phone_number: place.phone_number,
      category: place.category
    };
  }

  async retrieveCommentsByPlaceId(placeId) {
    const place = await PlaceRepository.findById(placeId);
    if (!place) {
      throw new ApiError(404, 'Place not found');
    }

    return await CommentRepository.findByPlaceId_IncludeUser(placeId);
  }

  async update(id, updateData) {
    // 1. Buscar place com informações privadas
    const place = await PlaceRepository.findByIdWithPrivateInfo(id);
    if (!place) {
      throw new ApiError(404, 'Place not found');
    }

    // 2. Identificar se há dados públicos ou privados para atualizar
    const publicFields = ['place_name', 'opening_hours', 'closing_hours', 'tags', 'street', 'street_number', 'phone_number'];
    const privateFields = ['razao_social', 'cnpj', 'owner_cpf', 'category_title'];

    const hasPublicUpdates = publicFields.some(field => updateData[field] !== undefined);
    const hasPrivateUpdates = privateFields.some(field => updateData[field] !== undefined);

    // Se não há nada para atualizar
    if (!hasPublicUpdates && !hasPrivateUpdates) {
      return place;
    }

    // 3. Preparar dados públicos
    const publicData = {};
    publicFields.forEach(field => {
      if (updateData[field] !== undefined) {
        publicData[field] = updateData[field];
      }
    });

    // 4. Validar e preparar categoria se fornecida
    if (updateData.category_title) {
      const category = await CategoryRepository.findByTitle(updateData.category_title);
      if (!category) {
        throw new ApiError(400, 'Category not found');
      }
      publicData.category_id = category.id;
      delete publicData.category_title;
    }

    // 5. Se não há atualizações privadas, atualizar apenas Place
    if (!hasPrivateUpdates) {
      return await PlaceRepository.update(id, publicData);
    }

    // 6. Há atualizações privadas - validar e preparar
    const privateData = {};
    const oldInfoPrivPlace = place.infoPrivPlace;

    if (!oldInfoPrivPlace) {
      throw new ApiError(404, 'Private information not found for this place');
    }

    // Validar razao_social se fornecida
    if (updateData.razao_social !== undefined) {
      if (typeof updateData.razao_social !== 'string' || updateData.razao_social.trim() === '') {
        throw new ApiError(400, 'razao_social must be a non-empty string');
      }
      privateData.razao_social = updateData.razao_social;
    }

    // Validar e preparar CNPJ se fornecido
    const cnpjChanged = updateData.cnpj && updateData.cnpj !== oldInfoPrivPlace.cnpj;
    if (cnpjChanged) {
      const existingInfoPrivPlace = await InfoPrivPlaceRepository.findByCnpj(updateData.cnpj);
      if (existingInfoPrivPlace) {
        throw new ApiError(409, 'A place with this CNPJ already exists');
      }
      privateData.cnpj = updateData.cnpj;
    }

    // Validar e preparar owner se fornecido
    let newOwnerId = oldInfoPrivPlace.owner_id;
    let ownerChanged = updateData.owner_cpf !== undefined;
    
    if (ownerChanged) {
      const newOwner = await UserRepository.findByCpf(updateData.owner_cpf);
      if (!newOwner) {
        throw new ApiError(400, 'Owner not found');
      }
      if (newOwner.type_user !== 'O') {
        throw new ApiError(400, 'User must be of type Owner (O)');
      }
      newOwnerId = newOwner.id;
      
      if (newOwnerId !== oldInfoPrivPlace.owner_id) {
        privateData.owner_id = newOwnerId;
      } else {
        // Mesmo owner, nada a fazer
        ownerChanged = false;
      }
    }

    // 7. Executar atualização em transação
    return await prisma.$transaction(async (tx) => {
      // a. Atualizar Place se houver dados públicos
      if (Object.keys(publicData).length > 0) {
        await tx.place.update({
          where: { id },
          data: publicData
        });
      }

      // b. Atualizar InfosPrivPlace
      if (Object.keys(privateData).length > 0) {
        await tx.infosPrivPlace.update({
          where: { id: oldInfoPrivPlace.id },
          data: privateData
        });
      }

      // c. Atualizar arrays cnpj_owner se necessário
      const oldCnpj = oldInfoPrivPlace.cnpj;
      const newCnpj = updateData.cnpj || oldCnpj;
      const oldOwnerId = oldInfoPrivPlace.owner_id;

      // Caso 1: CNPJ mudou E owner mudou
      if (cnpjChanged && ownerChanged) {
        // Remover CNPJ antigo do owner antigo
        const oldOwner = await tx.user.findUnique({ where: { id: oldOwnerId } });
        const updatedOldOwnerCnpjs = (oldOwner.cnpj_owner || []).filter(cnpj => cnpj !== oldCnpj);
        await tx.user.update({
          where: { id: oldOwnerId },
          data: { cnpj_owner: { set: updatedOldOwnerCnpjs } }
        });

        // Adicionar novo CNPJ ao novo owner
        await tx.user.update({
          where: { id: newOwnerId },
          data: { cnpj_owner: { push: newCnpj } }
        });
      }
      // Caso 2: Apenas CNPJ mudou (mesmo owner)
      else if (cnpjChanged) {
        const owner = await tx.user.findUnique({ where: { id: oldOwnerId } });
        const updatedCnpjs = (owner.cnpj_owner || [])
          .filter(cnpj => cnpj !== oldCnpj)
          .concat(newCnpj);
        await tx.user.update({
          where: { id: oldOwnerId },
          data: { cnpj_owner: { set: updatedCnpjs } }
        });
      }
      // Caso 3: Apenas owner mudou (mesmo CNPJ)
      else if (ownerChanged) {
        // Remover CNPJ do owner antigo
        const oldOwner = await tx.user.findUnique({ where: { id: oldOwnerId } });
        const updatedOldOwnerCnpjs = (oldOwner.cnpj_owner || []).filter(cnpj => cnpj !== oldCnpj);
        await tx.user.update({
          where: { id: oldOwnerId },
          data: { cnpj_owner: { set: updatedOldOwnerCnpjs } }
        });

        // Adicionar CNPJ ao novo owner
        await tx.user.update({
          where: { id: newOwnerId },
          data: { cnpj_owner: { push: oldCnpj } }
        });
      }

      // d. Retornar place atualizado com todas as informações
      return await tx.place.findUnique({
        where: { id },
        include: {
          category: true,
          infoPrivPlace: true
        }
      });
    });
  }

  async findById(id) {
    const place = await PlaceRepository.findByIdWithPrivateInfo(id);
    if (!place) {
      throw new ApiError(404, 'Place not found');
    }
    return place;
  }

  async findAll() {
    return await PlaceRepository.findAll();
  }
}

module.exports = new PlaceService();

