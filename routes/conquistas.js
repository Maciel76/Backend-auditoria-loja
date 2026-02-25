// backend/routes/conquistas.js
import express from 'express';
const router = express.Router();
import conquistasService from '../services/conquistasService.js';
import { verificarLojaObrigatoria as validateLoja } from '../middleware/loja.js';

// Obter todas as conquistas disponíveis
router.get('/', validateLoja, async (req, res) => {
  try {
    const loja = req.headers['x-loja'];
    const conquistas = await conquistasService.getTodasConquistas();
    res.json(conquistas);
  } catch (error) {
    console.error('Erro ao obter conquistas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter conquistas de um usuário específico
router.get('/usuario/:usuarioId', validateLoja, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const loja = req.headers['x-loja'];
    
    const conquistas = await conquistasService.getConquistasUsuario(usuarioId, loja);
    res.json({ conquistas });
  } catch (error) {
    console.error('Erro ao obter conquistas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar conquistas para um usuário (disparado após auditoria)
router.post('/verificar/:usuarioId', validateLoja, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const loja = req.headers['x-loja'];
    
    const resultado = await conquistasService.verificarConquistas(usuarioId, loja);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;