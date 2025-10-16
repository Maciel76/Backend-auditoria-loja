// routes/avisos.js - Rotas para gerenciar avisos
import express from "express";
import Aviso from "../models/Aviso.js";
import Loja from "../models/Loja.js";

const router = express.Router();

// POST /api/avisos - Criar novo aviso
router.post("/api/avisos", async (req, res) => {
  try {
    const { titulo, conteudo, prioridade = 'media', autor } = req.body;

    // Validação básica
    if (!titulo || titulo.trim().length === 0) {
      return res.status(400).json({
        erro: "Título é obrigatório",
      });
    }

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({
        erro: "Conteúdo é obrigatório",
      });
    }

    // Obter loja do header se fornecido
    let lojaId = null;
    const codigoLoja = req.headers["x-loja"];
    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        lojaId = loja._id;
      }
    }

    // Criar novo aviso
    const novoAviso = new Aviso({
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      prioridade,
      autor: autor ? autor.trim() : null,
      loja: lojaId,
      status: 'pendente',
    });

    const avisoSalvo = await novoAviso.save();

    res.status(201).json({
      message: "Aviso criado com sucesso!",
      id: avisoSalvo._id,
      status: "pendente"
    });

  } catch (error) {
    console.error("Erro ao salvar aviso:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// GET /api/avisos - Listar avisos
router.get("/api/avisos", async (req, res) => {
  try {
    const {
      status,
      prioridade,
      loja: codigoLoja,
      limite = 50,
      pagina = 1
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (status) filtros.status = status;
    if (prioridade) filtros.prioridade = prioridade;

    // Filtro por loja
    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        filtros.loja = loja._id;
      }
    }

    // Apenas avisos ativos (não expirados)
    filtros.status = { $in: ['aprovado', 'pendente'] };

    // Paginação
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const avisos = await Aviso.find(filtros)
      .populate('loja', 'nome codigo')
      .populate('usuario', 'nome email')
      .sort({ prioridade: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    const total = await Aviso.countDocuments(filtros);

    res.json({
      avisos,
      paginacao: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error("Erro ao buscar avisos:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// PUT /api/avisos/:id/status - Atualizar status do aviso (admin)
router.put("/api/avisos/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dataExpiracao } = req.body;

    const aviso = await Aviso.findById(id);
    if (!aviso) {
      return res.status(404).json({
        erro: "Aviso não encontrado"
      });
    }

    // Atualizar campos
    if (status) aviso.status = status;
    if (dataExpiracao) aviso.dataExpiracao = new Date(dataExpiracao);

    if (status === 'aprovado') {
      aviso.dataPublicacao = new Date();
    }

    await aviso.save();

    res.json({
      message: "Aviso atualizado com sucesso",
      aviso
    });

  } catch (error) {
    console.error("Erro ao atualizar aviso:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// DELETE /api/avisos/:id - Deletar aviso (admin)
router.delete("/api/avisos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const aviso = await Aviso.findByIdAndDelete(id);
    if (!aviso) {
      return res.status(404).json({
        erro: "Aviso não encontrado"
      });
    }

    res.json({
      message: "Aviso deletado com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar aviso:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

export default router;