const ApiError = require('../utils/ApiError');
const { Prisma } = require('@prisma/client');

function errorHandler(err, req, res, next) {
  // Tratar erros customizados da API
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Tratar erros do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Violação de constraint único
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({ 
        message: `A record with this ${field} already exists` 
      });
    }

    // P2025: Registro não encontrado (delete/update)
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        message: 'Record not found' 
      });
    }

    // P2003: Violação de foreign key
    if (err.code === 'P2003') {
      return res.status(400).json({ 
        message: 'Foreign key constraint failed' 
      });
    }
  }

  // Tratar erros de validação do Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ 
      message: 'Invalid data provided' 
    });
  }

  // Log do erro para debugging
  console.error('Unhandled error:', err);
  
  // Erro genérico
  return res.status(500).json({ message: 'Internal Server Error' });
}

module.exports = errorHandler;
