import express from "express";
import Presenca from "../models/Presenca.js";

const router = express.Router();

// Rota para obter dados de presença
router.get("/dados-presenca", async (req, res) => {
  try {
    const { data } = req.query;
    let filter = { tipo: "presenca" };

    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);

      filter.dataAuditoria = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    const dados = await Presenca.find(filter).sort({ local: 1, produto: 1 });

    res.json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados de presença:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados de presença",
      detalhes: error.message,
    });
  }
});

// Rota para estatísticas de presença
router.get("/estatisticas-presenca", async (req, res) => {
  try {
    const { data } = req.query;
    let filter = { tipo: "presenca" };

    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);

      filter.dataAuditoria = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    const estatisticas = await Presenca.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalItens: { $sum: 1 },
          comPresenca: {
            $sum: { $cond: [{ $eq: ["$presenca", true] }, 1, 0] },
          },
          semPresenca: {
            $sum: { $cond: [{ $eq: ["$presenca", false] }, 1, 0] },
          },
          totalSetores: { $addToSet: "$local" },
          taxaPresenca: {
            $avg: { $cond: [{ $eq: ["$presenca", true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          totalItens: 1,
          comPresenca: 1,
          semPresenca: 1,
          totalSetores: { $size: "$totalSetores" },
          taxaPresenca: { $multiply: [{ $round: ["$taxaPresenca", 4] }, 100] },
        },
      },
    ]);

    res.json(
      estatisticas[0] || {
        totalItens: 0,
        comPresenca: 0,
        semPresenca: 0,
        totalSetores: 0,
        taxaPresenca: 0,
      }
    );
  } catch (error) {
    console.error("Erro ao calcular estatísticas de presença:", error);
    res.status(500).json({
      erro: "Falha ao calcular estatísticas",
      detalhes: error.message,
    });
  }
});

// Rota para obter datas de auditoria de presença
router.get("/datas-presenca", async (req, res) => {
  try {
    const datas = await Presenca.distinct("dataAuditoria");
    res.json(datas.sort((a, b) => new Date(b) - new Date(a)));
  } catch (error) {
    console.error("Erro ao buscar datas de presença:", error);
    res.status(500).json({
      erro: "Falha ao buscar datas",
      detalhes: error.message,
    });
  }
});

// Rota para dashboard de presença
router.get("/dashboard-presenca", async (req, res) => {
  try {
    const { data } = req.query;
    let filter = { tipo: "presenca" };

    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);

      filter.dataAuditoria = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    const [estatisticas, porSetor, porSituacao] = await Promise.all([
      // Estatísticas gerais
      Presenca.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalItens: { $sum: 1 },
            comPresenca: {
              $sum: { $cond: [{ $eq: ["$presenca", true] }, 1, 0] },
            },
            semPresenca: {
              $sum: { $cond: [{ $eq: ["$presenca", false] }, 1, 0] },
            },
          },
        },
      ]),

      // Dados por setor
      Presenca.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$local",
            totalItens: { $sum: 1 },
            comPresenca: {
              $sum: { $cond: [{ $eq: ["$presenca", true] }, 1, 0] },
            },
            semPresenca: {
              $sum: { $cond: [{ $eq: ["$presenca", false] }, 1, 0] },
            },
            taxaPresenca: {
              $avg: { $cond: [{ $eq: ["$presenca", true] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            totalItens: 1,
            comPresenca: 1,
            semPresenca: 1,
            taxaPresenca: {
              $multiply: [{ $round: ["$taxaPresenca", 4] }, 100],
            },
          },
        },
        { $sort: { taxaPresenca: -1 } },
      ]),

      // Dados por situação
      Presenca.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$situacao",
            total: { $sum: 1 },
            comPresenca: {
              $sum: { $cond: [{ $eq: ["$presenca", true] }, 1, 0] },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      estatisticas: estatisticas[0] || {
        totalItens: 0,
        comPresenca: 0,
        semPresenca: 0,
      },
      porSetor,
      porSituacao,
      periodo: data || "todas as datas",
    });
  } catch (error) {
    console.error("Erro no dashboard de presença:", error);
    res.status(500).json({
      erro: "Falha ao gerar dashboard",
      detalhes: error.message,
    });
  }
});

export default router;
