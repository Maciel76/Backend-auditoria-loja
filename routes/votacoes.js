// routes/votacoes.js - Rotas para gerenciar votações
import express from "express";
import Votacao from "../models/Votacao.js";
import Loja from "../models/Loja.js";

const router = express.Router();

// POST /api/votacoes - Criar nova votação
router.post("/api/votacoes", async (req, res) => {
  try {
    const { titulo, descricao, beneficios, autor } = req.body;

    // Validação básica
    if (!titulo || titulo.trim().length === 0) {
      return res.status(400).json({
        erro: "Título é obrigatório",
      });
    }

    if (!descricao || descricao.trim().length === 0) {
      return res.status(400).json({
        erro: "Descrição é obrigatória",
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

    // Criar nova votação
    const novaVotacao = new Votacao({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      beneficios: beneficios ? beneficios.trim() : null,
      autor: autor ? autor.trim() : null,
      loja: lojaId,
      status: 'pendente',
    });

    const votacaoSalva = await novaVotacao.save();

    res.status(201).json({
      message: "Votação criada com sucesso!",
      id: votacaoSalva._id,
      status: "pendente"
    });

  } catch (error) {
    console.error("Erro ao salvar votação:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// GET /api/votacoes - Listar votações
router.get("/api/votacoes", async (req, res) => {
  try {
    const {
      status,
      loja: codigoLoja,
      limite = 50,
      pagina = 1
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (status) filtros.status = status;

    // Filtro por loja
    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        filtros.loja = loja._id;
      }
    }

    // Paginação
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const votacoes = await Votacao.find(filtros)
      .populate('loja', 'nome codigo')
      .populate('usuario', 'nome email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    const total = await Votacao.countDocuments(filtros);

    res.json({
      votacoes,
      paginacao: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error("Erro ao buscar votações:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// POST /api/votacoes/:id/react - Reagir a uma votação
router.post("/api/votacoes/:id/react", async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, userIdentifier } = req.body;

    if (!['like', 'dislike', 'fire', 'heart'].includes(reaction)) {
      return res.status(400).json({
        erro: "Reação deve ser 'like', 'dislike', 'fire' ou 'heart'"
      });
    }

    if (!userIdentifier) {
      return res.status(400).json({
        erro: "Identificador do usuário é obrigatório"
      });
    }

    const votacao = await Votacao.findById(id);
    if (!votacao) {
      return res.status(404).json({
        erro: "Votação não encontrada"
      });
    }

    if (votacao.status !== 'ativo') {
      return res.status(400).json({
        erro: "Votação não está ativa"
      });
    }

    // Inicializar reactions se não existir
    if (!votacao.reactions) {
      votacao.reactions = {
        like: { count: 0, users: [] },
        dislike: { count: 0, users: [] },
        fire: { count: 0, users: [] },
        heart: { count: 0, users: [] }
      };
    }

    // Sempre adicionar nova reação (permite múltiplos votos)
    if (!votacao.reactions[reaction]) {
      votacao.reactions[reaction] = { count: 0, users: [] };
    }

    votacao.reactions[reaction].count += 1;
    votacao.reactions[reaction].users.push(userIdentifier);

    await votacao.save();

    res.json({
      message: "Reação registrada com sucesso",
      reactions: votacao.reactions,
      totalReacoes: Object.values(votacao.reactions).reduce((total, r) => total + (r.count || 0), 0)
    });

  } catch (error) {
    console.error("Erro ao reagir:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// PUT /api/votacoes/:id/status - Atualizar status da votação (admin)
router.put("/api/votacoes/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dataInicio, dataFim } = req.body;

    const votacao = await Votacao.findById(id);
    if (!votacao) {
      return res.status(404).json({
        erro: "Votação não encontrada"
      });
    }

    // Atualizar campos
    if (status) votacao.status = status;
    if (dataInicio) votacao.dataInicio = new Date(dataInicio);
    if (dataFim) votacao.dataFim = new Date(dataFim);

    await votacao.save();

    res.json({
      message: "Votação atualizada com sucesso",
      votacao
    });

  } catch (error) {
    console.error("Erro ao atualizar votação:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// DELETE /api/votacoes/:id - Deletar votação (admin)
router.delete("/api/votacoes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const votacao = await Votacao.findByIdAndDelete(id);
    if (!votacao) {
      return res.status(404).json({
        erro: "Votação não encontrada"
      });
    }

    res.json({
      message: "Votação deletada com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar votação:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

export default router;