// routes/sugestoes.js - Rotas para gerenciar sugestões
import express from "express";
import mongoose from "mongoose";
import Sugestao from "../models/Sugestao.js";
import Loja from "../models/Loja.js";

const router = express.Router();

// TESTE: Rota simples sem /api prefix
router.post("/test-react/:id", async (req, res) => {
  console.log("🔥 TEST REACT ENDPOINT CHAMADO:", req.params, req.body);
  return res.json({
    message: "Test route works!",
    params: req.params,
    body: req.body,
  });
});

// TESTE: Mover rota de react para o topo ABSOLUTO
router.post("/api/sugestoes/:id/react", async (req, res) => {
  console.log("🔥 REACT ENDPOINT CHAMADO NO TOPO:", req.params, req.body);
  try {
    const { id } = req.params;
    const { reaction, userIdentifier } = req.body;

    if (!["like", "dislike", "fire", "heart"].includes(reaction)) {
      return res.status(400).json({
        erro: "Reação deve ser: like, dislike, fire ou heart",
      });
    }

    if (!userIdentifier) {
      return res.status(400).json({
        erro: "Identificador do usuário é obrigatório",
      });
    }

    const sugestao = await Sugestao.findById(id);
    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada",
      });
    }

    // Inicializar reactions se não existir
    if (!sugestao.reactions) {
      sugestao.reactions = {
        like: { count: 0, users: [] },
        dislike: { count: 0, users: [] },
        fire: { count: 0, users: [] },
        heart: { count: 0, users: [] },
      };
    }

    // Verificar se usuário já reagiu a essa reação específica
    const hasReacted =
      sugestao.reactions[reaction].users.includes(userIdentifier);

    if (hasReacted) {
      // Remover reação
      sugestao.reactions[reaction].count = Math.max(
        0,
        sugestao.reactions[reaction].count - 1,
      );
      sugestao.reactions[reaction].users = sugestao.reactions[
        reaction
      ].users.filter((user) => user !== userIdentifier);
    } else {
      // Adicionar reação
      sugestao.reactions[reaction].count += 1;
      sugestao.reactions[reaction].users.push(userIdentifier);
    }

    await sugestao.save();

    res.json({
      message: hasReacted ? "Reação removida" : "Reação adicionada",
      reactions: sugestao.reactions,
      hasReacted: !hasReacted,
    });
  } catch (error) {
    console.error("Erro ao reagir:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// POST /api/sugestoes - Criar nova sugestão
router.post("/api/sugestoes", async (req, res) => {
  try {
    const { sugestao, nome, email, tipo = "geral" } = req.body;

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
      nome: nome ? nome.trim() : null,
      email: email ? email.trim() : null,
      tipo,
      loja: lojaId,
      status: "pendente",
      prioridade: "media",
    });

    const sugestaoSalva = await novaSugestao.save();

    res.status(201).json({
      message: "Sugestão enviada com sucesso!",
      id: sugestaoSalva._id,
      status: "pendente",
    });
  } catch (error) {
    console.error("Erro ao salvar sugestão:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
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
      pagina = 1,
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
      .populate("loja", "nome codigo")
      .populate("usuario", "nome email")
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
        totalPaginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar sugestões:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
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
          _id: "$status",
          total: { $sum: 1 },
        },
      },
    ]);

    // Estatísticas por tipo
    const estatisticasTipo = await Sugestao.aggregate([
      { $match: filtroLoja },
      {
        $group: {
          _id: "$tipo",
          total: { $sum: 1 },
        },
      },
    ]);

    // Total geral
    const totalGeral = await Sugestao.countDocuments(filtroLoja);

    // Sugestões recentes (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const sugestoesRecentes = await Sugestao.countDocuments({
      ...filtroLoja,
      createdAt: { $gte: seteDiasAtras },
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
      }, {}),
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
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
        erro: "Sugestão não encontrada",
      });
    }

    // Atualizar campos
    if (status) sugestao.status = status;
    if (comentarioAdmin) sugestao.comentarioAdmin = comentarioAdmin;
    if (prioridade) sugestao.prioridade = prioridade;

    if (status === "implementado") {
      sugestao.dataImplementacao = new Date();
    }

    await sugestao.save();

    res.json({
      message: "Sugestão atualizada com sucesso",
      sugestao,
    });
  } catch (error) {
    console.error("Erro ao atualizar sugestão:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
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
        erro: "Voto deve ser 1 (positivo) ou -1 (negativo)",
      });
    }

    const sugestao = await Sugestao.findById(id);
    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada",
      });
    }

    // Verificar se usuário já votou
    const votoExistente = sugestao.votosUsuarios.find(
      (v) => v.usuario.toString() === usuarioId,
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
        data: new Date(),
      });
    }

    await sugestao.save();

    res.json({
      message: "Voto registrado com sucesso",
      votos: sugestao.votos,
    });
  } catch (error) {
    console.error("Erro ao votar:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
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
        erro: "Sugestão não encontrada",
      });
    }

    res.json({
      message: "Sugestão deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar sugestão:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// POST /api/sugestoes/:id/comentarios - Adicionar comentário a uma sugestão
router.post("/api/sugestoes/:id/comentarios", async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, userId } = req.body;

    // Validação básica
    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({
        erro: "Conteúdo do comentário é obrigatório",
        success: false,
      });
    }

    if (!userId) {
      return res.status(400).json({
        erro: "ID do usuário é obrigatório",
        success: false,
      });
    }

    if (conteudo.trim().length > 1000) {
      return res.status(400).json({
        erro: "Comentário deve ter no máximo 1000 caracteres",
        success: false,
      });
    }

    // Buscar usuário para pegar dados (tenta primeiro por campo 'id', depois por '_id')
    const User = mongoose.model("User");
    let usuario = await User.findOne({ id: userId });

    // Se não encontrar por id, tentar por _id (MongoDB ObjectId)
    if (!usuario) {
      usuario = await User.findById(userId);
    }

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
        success: false,
      });
    }

    const sugestao = await Sugestao.findById(id);
    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada",
        success: false,
      });
    }

    // Criar novo comentário com dados do usuário (formato correto para o modelo Sugestao)
    const novoComentario = {
      conteudo: conteudo.trim(),
      userId: usuario._id, // Este é o campo obrigatório que estava faltando
      autor: usuario.nome, // Salvar nome para compatibilidade
      avatar: (usuario.foto || usuario.nome.charAt(0).toUpperCase()).substring(
        0,
        200,
      ), // Limitar a 200 caracteres
      data: new Date(),
    };

    // Adicionar comentário ao array
    sugestao.comentarios.push(novoComentario);
    await sugestao.save();

    // Popular dados do usuário para retorno (formato esperado pelo frontend)
    const comentarioPopulado = {
      _id: novoComentario._id,
      conteudo: novoComentario.conteudo,
      data: novoComentario.data,
      userId: novoComentario.userId,
      autor: novoComentario.autor,
      avatar: novoComentario.avatar,
      user: {
        _id: usuario._id,
        nome: usuario.nome,
        foto: usuario.foto,
        cargo: usuario.cargo,
      },
    };

    res.status(201).json({
      message: "Comentário adicionado com sucesso!",
      success: true,
      commentId: novoComentario._id,
      comentario: comentarioPopulado,
    });
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      success: false,
      details: error.message,
    });
  }
});

// GET /api/sugestoes/:id/comentarios - Obter comentários de uma sugestão
router.get("/api/sugestoes/:id/comentarios", async (req, res) => {
  try {
    const { id } = req.params;

    const sugestao = await Sugestao.findById(id).populate({
      path: "comentarios.userId",
      select: "nome foto cargo",
    });

    if (!sugestao) {
      return res.status(404).json({
        erro: "Sugestão não encontrada",
      });
    }

    // Formatar comentários com dados do usuário populados
    const comentariosFormatados = sugestao.comentarios.map((comentario) => ({
      _id: comentario._id,
      conteudo: comentario.conteudo,
      data: comentario.data,
      user: comentario.userId
        ? {
            _id: comentario.userId._id,
            nome: comentario.userId.nome,
            foto: comentario.userId.foto,
            cargo: comentario.userId.cargo,
          }
        : {
            nome: comentario.autor || "Anônimo",
            foto: comentario.avatar,
            cargo: null,
          },
    }));

    res.json({
      comentarios: comentariosFormatados,
      total: comentariosFormatados.length,
    });
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// DELETE /api/sugestoes/:id/comentarios/:comentarioId - Deletar um comentário específico
router.delete(
  "/api/sugestoes/:id/comentarios/:comentarioId",
  async (req, res) => {
    try {
      const { id, comentarioId } = req.params;

      const sugestao = await Sugestao.findById(id);
      if (!sugestao) {
        return res.status(404).json({
          erro: "Sugestão não encontrada",
        });
      }

      // Filtrar o comentário a ser removido
      const comentariosAntes = sugestao.comentarios.length;
      sugestao.comentarios = sugestao.comentarios.filter(
        (comentario) => comentario._id.toString() !== comentarioId,
      );

      if (sugestao.comentarios.length === comentariosAntes) {
        // Nenhum comentário foi removido, então o comentário não existia
        return res.status(404).json({
          erro: "Comentário não encontrado",
        });
      }

      await sugestao.save();

      res.json({
        message: "Comentário deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar comentário:", error);
      res.status(500).json({
        erro: "Erro interno do servidor",
        details: error.message,
      });
    }
  },
);

export default router;
