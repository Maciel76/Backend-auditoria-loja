// routes/conquistasRoutes.js
import express from "express";
import Conquista from "../models/Conquista.js";
import MetricasUsuario from "../models/MetricasUsuario.js";
import Loja from "../models/Loja.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * @route GET /api/conquistas
 * @desc Listar todas as conquistas (com filtros opcionais)
 * @query category - Filtrar por categoria
 * @query difficulty - Filtrar por dificuldade
 * @query ativo - Filtrar apenas ativas (true/false)
 */
router.get("/", async (req, res) => {
  try {
    const { category, difficulty, ativo } = req.query;

    // Construir filtro
    const filtro = {};
    if (category) filtro.category = category;
    if (difficulty) filtro.difficulty = difficulty;
    if (ativo !== undefined) filtro.ativo = ativo === "true";

    const conquistas = await Conquista.find(filtro).sort({ ordem: 1, createdAt: 1 });

    res.json({
      success: true,
      total: conquistas.length,
      conquistas,
    });
  } catch (error) {
    console.error("❌ Erro ao listar conquistas:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao listar conquistas",
      detalhes: error.message,
    });
  }
});

/**
 * @route GET /api/conquistas/ativas
 * @desc Listar apenas conquistas ativas
 */
router.get("/ativas", async (req, res) => {
  try {
    const conquistas = await Conquista.buscarAtivas();

    res.json({
      success: true,
      total: conquistas.length,
      conquistas,
    });
  } catch (error) {
    console.error("❌ Erro ao listar conquistas ativas:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao listar conquistas ativas",
      detalhes: error.message,
    });
  }
});

/**
 * @route GET /api/conquistas/categoria/:category
 * @desc Listar conquistas por categoria
 */
router.get("/categoria/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const conquistas = await Conquista.buscarPorCategoria(category);

    res.json({
      success: true,
      category,
      total: conquistas.length,
      conquistas,
    });
  } catch (error) {
    console.error("❌ Erro ao listar conquistas por categoria:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao listar conquistas por categoria",
      detalhes: error.message,
    });
  }
});

/**
 * @route GET /api/conquistas/:id
 * @desc Buscar uma conquista específica por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const conquista = await Conquista.findOne({
      $or: [{ _id: id }, { achievementId: id }],
    });

    if (!conquista) {
      return res.status(404).json({
        success: false,
        erro: "Conquista não encontrada",
      });
    }

    res.json({
      success: true,
      conquista,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar conquista:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao buscar conquista",
      detalhes: error.message,
    });
  }
});

/**
 * @route POST /api/conquistas
 * @desc Criar nova conquista
 */
router.post("/", async (req, res) => {
  try {
    const conquistaData = req.body;

    // Validar campos obrigatórios
    const camposObrigatorios = [
      "achievementId",
      "title",
      "description",
      "icon",
      "category",
      "difficulty",
      "points",
      "sourceField",
    ];

    for (const campo of camposObrigatorios) {
      if (!conquistaData[campo]) {
        return res.status(400).json({
          success: false,
          erro: `Campo obrigatório ausente: ${campo}`,
        });
      }
    }

    // Verificar se já existe
    const existente = await Conquista.findOne({
      achievementId: conquistaData.achievementId,
    });

    if (existente) {
      return res.status(409).json({
        success: false,
        erro: "Já existe uma conquista com este ID",
      });
    }

    // Criar conquista
    const conquista = new Conquista(conquistaData);
    await conquista.save();

    res.status(201).json({
      success: true,
      mensagem: "Conquista criada com sucesso",
      conquista,
    });
  } catch (error) {
    console.error("❌ Erro ao criar conquista:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao criar conquista",
      detalhes: error.message,
    });
  }
});

/**
 * @route PUT /api/conquistas/:id
 * @desc Atualizar conquista existente
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Não permitir alterar achievementId
    delete updateData.achievementId;
    delete updateData._id;

    const conquista = await Conquista.findOneAndUpdate(
      { $or: [{ _id: id }, { achievementId: id }] },
      { ...updateData, atualizadoPor: "user" },
      { new: true, runValidators: true }
    );

    if (!conquista) {
      return res.status(404).json({
        success: false,
        erro: "Conquista não encontrada",
      });
    }

    res.json({
      success: true,
      mensagem: "Conquista atualizada com sucesso",
      conquista,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar conquista:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao atualizar conquista",
      detalhes: error.message,
    });
  }
});

/**
 * @route DELETE /api/conquistas/:id
 * @desc Deletar conquista (soft delete - apenas marca como inativa)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { forceDelete } = req.query;

    if (forceDelete === "true") {
      // Hard delete
      const conquista = await Conquista.findOneAndDelete({
        $or: [{ _id: id }, { achievementId: id }],
      });

      if (!conquista) {
        return res.status(404).json({
          success: false,
          erro: "Conquista não encontrada",
        });
      }

      res.json({
        success: true,
        mensagem: "Conquista deletada permanentemente",
        conquista,
      });
    } else {
      // Soft delete (apenas marca como inativa)
      const conquista = await Conquista.findOneAndUpdate(
        { $or: [{ _id: id }, { achievementId: id }] },
        { ativo: false },
        { new: true }
      );

      if (!conquista) {
        return res.status(404).json({
          success: false,
          erro: "Conquista não encontrada",
        });
      }

      res.json({
        success: true,
        mensagem: "Conquista desativada com sucesso",
        conquista,
      });
    }
  } catch (error) {
    console.error("❌ Erro ao deletar conquista:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao deletar conquista",
      detalhes: error.message,
    });
  }
});

/**
 * @route POST /api/conquistas/:id/ativar
 * @desc Reativar conquista desativada
 */
router.post("/:id/ativar", async (req, res) => {
  try {
    const { id } = req.params;

    const conquista = await Conquista.findOneAndUpdate(
      { $or: [{ _id: id }, { achievementId: id }] },
      { ativo: true },
      { new: true }
    );

    if (!conquista) {
      return res.status(404).json({
        success: false,
        erro: "Conquista não encontrada",
      });
    }

    res.json({
      success: true,
      mensagem: "Conquista reativada com sucesso",
      conquista,
    });
  } catch (error) {
    console.error("❌ Erro ao reativar conquista:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao reativar conquista",
      detalhes: error.message,
    });
  }
});

/**
 * @route POST /api/conquistas/validar-usuario
 * @desc Validar conquistas para um usuário específico
 * @body usuarioId, lojaId, periodo
 */
router.post("/validar-usuario", async (req, res) => {
  try {
    const { usuarioId, lojaId, periodo = "periodo_completo" } = req.body;

    if (!usuarioId || !lojaId) {
      return res.status(400).json({
        success: false,
        erro: "usuarioId e lojaId são obrigatórios",
      });
    }

    try {
      let metricas;

      // Primeiro, tentar encontrar usando lojaId diretamente (se for ObjectId)
      if (mongoose.Types.ObjectId.isValid(lojaId)) {
        // Se lojaId é um ObjectId válido, usá-lo diretamente
        metricas = await MetricasUsuario.findOne({
          usuarioId,
          loja: mongoose.Types.ObjectId(lojaId),
          periodo,
        });
      } else {
        // Se não é ObjectId, pode ser código de loja
        // Tentar encontrar a loja pelo código para obter o ObjectId
        const lojaDoc = await Loja.findOne({ codigo: lojaId });
        if (lojaDoc) {
          // Encontrou a loja pelo código, usar o ObjectId
          metricas = await MetricasUsuario.findOne({
            usuarioId,
            loja: lojaDoc._id,
            periodo,
          });
        } else {
          // Não encontrou pelo código, tentar como string mesmo (último recurso)
          // Neste caso, precisamos contornar a validação do Mongoose
          metricas = await MetricasUsuario.findOne({
            usuarioId,
            'loja': lojaId,  // Usar uma query mais genérica
            periodo,
          });
        }
      }

      if (!metricas) {
        return res.status(404).json({
          success: false,
          erro: `Métricas do usuário não encontradas para usuário ${usuarioId} na loja ${lojaId}`,
        });
      }
    } catch (dbError) {
      console.error("❌ Erro na consulta ao banco:", dbError);
      return res.status(500).json({
        success: false,
        erro: "Erro na consulta ao banco de dados",
        detalhes: dbError.message,
      });
    }

    // Atualizar conquistas baseado nas métricas atuais (cálculo interno do modelo)
    metricas.calcularAchievements();

    // Preparar resposta com conquistas atualizadas
    const conquistas = metricas.achievements.achievements.map(achievement => ({
      achievementId: achievement.achievementId,
      title: achievement.achievementData.title,
      description: achievement.achievementData.description,
      icon: achievement.achievementData.icon,
      category: achievement.achievementData.category,
      difficulty: achievement.achievementData.difficulty,
      points: achievement.achievementData.points,
      desbloqueada: achievement.unlocked,
      progresso: achievement.progress.percentage,
      criteria: achievement.achievementData.criteria,
      sourceField: null, // Não aplicável no modelo interno
      repeticao: achievement.achievementData.repeticao || null,
      nova: achievement.unlocked && !achievement.unlockedAt ? true : false,
    }));

    // Calcular estatísticas
    const stats = {
      total: conquistas.length,
      desbloqueadas: conquistas.filter((c) => c.desbloqueada).length,
      pendentes: conquistas.filter((c) => !c.desbloqueada).length,
      xpTotal: metricas.achievements.xp.fromAchievements,
    };

    res.json({
      success: true,
      usuarioId,
      conquistas,
      stats,
    });
  } catch (error) {
    console.error("❌ Erro ao validar conquistas do usuário:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao validar conquistas do usuário",
      detalhes: error.message,
    });
  }
});

/**
 * @route GET /api/conquistas/stats/resumo
 * @desc Obter estatísticas gerais das conquistas
 */
router.get("/stats/resumo", async (req, res) => {
  try {
    const total = await Conquista.countDocuments();
    const ativas = await Conquista.countDocuments({ ativo: true });
    const inativas = await Conquista.countDocuments({ ativo: false });

    const porCategoria = await Conquista.aggregate([
      { $match: { ativo: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const porDificuldade = await Conquista.aggregate([
      { $match: { ativo: true } },
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        ativas,
        inativas,
        porCategoria: porCategoria.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        porDificuldade: porDificuldade.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    res.status(500).json({
      success: false,
      erro: "Erro ao obter estatísticas",
      detalhes: error.message,
    });
  }
});

export default router;
