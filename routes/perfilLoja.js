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
      .sort({ "metricas.totais.itensAtualizados": -1 })
      .limit(20)
      .lean();

    // 4. Estruturar a resposta
    const response = {
      loja,
      metricas: lojaMetrics || {},
      metricasSetores: lojaMetrics?.locaisEstatisticas || [],
      colaboradores: rankingColaboradores
        .map((c) => {
          const m = c.metricas || {};
          const totais = m.totais || {};
          const etiquetas = m.etiquetas || {};
          const rupturas = m.rupturas || {};
          const presencas = m.presencas || {};
          const auditorias =
            (etiquetas.itensAtualizados || 0) +
            (rupturas.itensAtualizados || 0) +
            (presencas.itensAtualizados || 0);
          return {
            id: c.usuarioId,
            nome: c.usuarioNome,
            performance: totais.percentualConclusaoGeral || 0,
            auditorias,
            pontuacao: totais.pontuacaoTotal || 0,
          };
        })
        .filter(
          (c) =>
            c.nome &&
            !c.nome.toLowerCase().includes("produto não auditado") &&
            !c.nome.toLowerCase().includes("usuário não identificado") &&
            c.auditorias > 0,
        ),
      atividadesRecentes: [],
      metricasAuditoria: {
        etiquetas: lojaMetrics?.etiquetas || {},
        presencas: lojaMetrics?.presencas || {},
        rupturas: lojaMetrics?.rupturas || {},
      },
      insights: [],
      dadosGraficos: [],
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Erro ao carregar dados do perfil da loja:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

export default router;
