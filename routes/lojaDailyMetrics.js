// routes/lojaDailyMetrics.js
import express from "express";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";

const router = express.Router();

// GET /api/loja-daily-metrics/hoje - Buscar métricas do dia atual
router.get("/hoje", async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Buscar métricas do dia atual para a loja específica
    // Você pode ajustar o critério de busca conforme necessário
    const metricas = await LojaDailyMetrics.findOne({
      data: {
        $gte: hoje,
        $lt: amanha,
      },
    }).populate("loja", "nome codigo");

    if (!metricas) {
      return res.status(404).json({
        message: "Nenhuma métrica encontrada para o dia atual",
      });
    }

    res.json(metricas);
  } catch (error) {
    console.error("Erro ao buscar métricas do dia:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

export default router;
