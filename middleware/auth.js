// middleware/auth.js - Middleware functions for authentication and authorization
import { verificarLojaObrigatoria, verificarLojaOpcional } from './loja.js';

// Middleware to extract shop from header - used by various routes
export const extractLoja = (req, res, next) => {
  req.loja = req.headers['x-loja'] || null;
  next();
};

// Export other middleware functions for convenience
export { verificarLojaObrigatoria, verificarLojaOpcional };