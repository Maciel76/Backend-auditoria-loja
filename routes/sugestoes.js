// routes/sugestoes.js - Rotas para gerenciar sugestões
import express from "express";
import Sugestao from "../models/Sugestao.js";
import Loja from "../models/Loja.js";

const router = express.Router();

// POST /api/sugestoes - Criar nova sugestão
router.post("/api/sugestoes", async (req, res) => {
  try {
    const { sugestao, email, tipo = 'geral' } = req.body;

    // Validação básica
    if (!sugestao || sugestao.trim().length === 0) {
      return res.status(400).json({
        erro: "Sugestão é obrigatória",
      });
    }

    if (sugestao.trim().length > 2000) {
      return res.status(400).json({
        erro: "Sugestão deve ter no máximo 2000 caracteres",
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

    // Criar nova sugestão
    const novaSugestao = new Sugestao({
      sugestao: sugestao.trim(),
      email: email ? email.trim() : null,
      tipo,
      loja: lojaId,
      status: 'pendente',
      prioridade: 'media',
    });

    const sugestaoSalva = await novaSugestao.save();

    res.status(201).json({
      message: "Sugestão enviada com sucesso!",
      id: sugestaoSalva._id,
      status: "pendente"
    });

  } catch (error) {
    console.error("Erro ao salvar sugestão:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// GET /api/sugestoes - Listar sugestões (com filtros)
router.get("/api/sugestoes", async (req, res) => {
  try {
    const {
      tipo,
      status,
      prioridade,
      loja: codigoLoja,
      limite = 50,
      pagina = 1
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (tipo) filtros.tipo = tipo;
    if (status) filtros.status = status;
    if (prioridade) filtros.prioridade = prioridade;

    // Filtro por loja
    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        filtros.loja = loja._id;
      }
    }

    // Paginação
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const sugestoes = await Sugestao.find(filtros)
      .populate('loja', 'nome codigo')
      .populate('usuario', 'nome email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    const total = await Sugestao.countDocuments(filtros);

    res.json({
      sugestoes,
      paginacao: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error("Erro ao buscar sugestões:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// GET /api/sugestoes/estatisticas - Estatísticas das sugestões
router.get("/api/sugestoes/estatisticas", async (req, res) => {
  try {
    const codigoLoja = req.headers["x-loja"];
    let filtroLoja = {};

    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        filtroLoja.loja = loja._id;
      }
    }

    // Estatísticas por status
    const estatisticasStatus = await Sugestao.aggregate([
      { $match: filtroLoja },
      {
        $group: {
          _id: '$status',
          total: { $sum: 1 }
        }
      }
    ]);

    // Estatísticas por tipo
    const estatisticasTipo = await Sugestao.aggregate([
      { $match: filtroLoja },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 }
        }
      }
    ]);

    // Total geral
    const totalGeral = await Sugestao.countDocuments(filtroLoja);

    // Sugestões recentes (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const sugestoesRecentes = await Sugestao.countDocuments({
      ...filtroLoja,
      createdAt: { $gte: seteDiasAtras }
    });

    res.json({
      totalGeral,
      sugestoesRecentes,
      porStatus: estatisticasStatus.reduce((acc, item) => {
        acc[item._id] = item.total;
        return acc;
      }, {}),
      porTipo: estatisticasTipo.reduce((acc, item) => {
        acc[item._id] = item.total;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// PUT /api/sugestoes/:id/status - Atualizar status (admin)
router.put("/api/sugestoes/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comentarioAdmin, prioridade } = req.body;

    const sugestao = await Sugestao.findById(id);
    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada"
      });
    }

    // Atualizar campos
    if (status) sugestao.status = status;
    if (comentarioAdmin) sugestao.comentarioAdmin = comentarioAdmin;
    if (prioridade) sugestao.prioridade = prioridade;

    if (status === 'implementado') {
      sugestao.dataImplementacao = new Date();
    }

    await sugestao.save();

    res.json({
      message: "Sugestão atualizada com sucesso",
      sugestao
    });

  } catch (error) {
    console.error("Erro ao atualizar sugestão:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// POST /api/sugestoes/:id/votar - Votar em sugestão
router.post("/api/sugestoes/:id/votar", async (req, res) => {
  try {
    const { id } = req.params;
    const { voto, usuarioId } = req.body; // voto: 1 (upvote) ou -1 (downvote)

    if (![1, -1].includes(voto)) {
      return res.status(400).json({
        erro: "Voto deve ser 1 (positivo) ou -1 (negativo)"
      });
    }

    const sugestao = await Sugestao.findById(id);
    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada"
      });
    }

    // Verificar se usuário já votou
    const votoExistente = sugestao.votosUsuarios.find(
      v => v.usuario.toString() === usuarioId
    );

    if (votoExistente) {
      // Atualizar voto existente
      votoExistente.voto = voto;
      votoExistente.data = new Date();
    } else {
      // Adicionar novo voto
      sugestao.votosUsuarios.push({
        usuario: usuarioId,
        voto,
        data: new Date()
      });
    }

    await sugestao.save();

    res.json({
      message: "Voto registrado com sucesso",
      votos: sugestao.votos
    });

  } catch (error) {
    console.error("Erro ao votar:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

// DELETE /api/sugestoes/:id - Deletar sugestão (admin)
router.delete("/api/sugestoes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sugestao = await Sugestao.findByIdAndDelete(id);
    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada"
      });
    }

    res.json({
      message: "Sugestão deletada com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar sugestão:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message
    });
  }
});

export default router;