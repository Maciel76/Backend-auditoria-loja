// routes/estatisticas.js
import express from "express";
import Auditoria from "../models/Auditoria.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

// Rota para obter estatísticas das auditorias
router.get("/estatisticas-setores", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { data } = req.query;

    let filter = { loja: req.loja._id };
    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);

      filter.data = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    const estatisticas = await Auditoria.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$local",
          totalItens: { $sum: 1 },
          itensLidos: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          local: "$_id",
          totalItens: 1,
          itensLidos: 1,
          percentualLidos: {
            $round: [
              { $multiply: [{ $divide: ["$itensLidos", "$totalItens"] }, 100] },
              2,
            ],
          },
        },
      },
      { $sort: { local: 1 } },
    ]);

    res.json(estatisticas);
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    res.status(500).json({
      erro: "Falha ao calcular estatísticas",
      detalhes: error.message,
    });
  }
});

// Rota para obter datas de auditoria disponíveis
router.get("/datas-auditoria", async (req, res) => {
  try {
    const datas = await Auditoria.distinct("dataAuditoria");
    res.json(datas.sort((a, b) => new Date(b) - new Date(a)));
  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    res.status(500).json({ erro: "Falha ao buscar datas" });
  }
});

export default router;
