// backend/routes/perfilLoja.js
import express from "express";
import Loja from "../models/Loja.js";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";
import UserDailyMetrics from "../models/UserDailyMetrics.js";

const router = express.Router();

// GET /api/perfil-loja/:codigo - Rota para buscar todos os dados do perfil da loja
router.get("/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { data } = req.query;

    const targetDate = data ? new Date(data) : new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // 1. Buscar a loja pelo código
    const loja = await Loja.findOne({ codigo }).lean();
    if (!loja) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }

    // 2. Buscar as métricas diárias da loja
    const lojaMetrics = await LojaDailyMetrics.findOne({
      loja: loja._id,
      data: { $gte: startDate, $lte: endDate },
    }).lean();

    // 3. Buscar o ranking de colaboradores (UserDailyMetrics)
    const rankingColaboradores = await UserDailyMetrics.find({
      loja: loja._id,
      data: { $gte: startDate, $lte: endDate },
    })
      .sort({ "etiquetas.pontuacao": -1 }) // Ordenar por pontuação de etiquetas como padrão
      .limit(20)
      .lean();

    // 4. Estruturar a resposta
    const response = {
      loja,
      metricas: lojaMetrics || {},
      metricasSetores: lojaMetrics?.locaisEstatisticas || [],
      colaboradores: rankingColaboradores.map(c => ({
        nome: c.usuarioNome,
        performance: c.etiquetas?.eficiencia || 0,
        auditorias: c.etiquetas?.totalLidos || 0,
      })),
      atividadesRecentes: [], // Mockado por enquanto
      metricasAuditoria: {
        etiquetas: lojaMetrics?.etiquetas || {},
        presencas: lojaMetrics?.presencas || {},
        rupturas: lojaMetrics?.rupturas || {},
      },
      insights: [], // Mockado por enquanto
      dadosGraficos: [], // Mockado por enquanto
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Erro ao carregar dados do perfil da loja:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

export default router;
