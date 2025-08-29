import express from "express";
import Ruptura from "../models/Ruptura.js";

const router = express.Router();

// Rota para obter dados de ruptura
router.get("/dados-ruptura", async (req, res) => {
  try {
    const { data } = req.query;
    let filter = { tipo: "ruptura" };

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

    const dados = await Ruptura.find(filter).sort({ local: 1, produto: 1 });

    res.json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados de ruptura:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados de ruptura",
      detalhes: error.message,
    });
  }
});

// Rota para estatísticas de ruptura
router.get("/estatisticas-ruptura", async (req, res) => {
  try {
    const { data } = req.query;
    let filter = { tipo: "ruptura" };

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

    const estatisticas = await Ruptura.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalItens: { $sum: 1 },
          totalCustoRuptura: { $sum: "$custoRuptura" },
          mediaDiasSemVenda: { $avg: "$diasSemVenda" },
          totalSetores: { $addToSet: "$local" },
          totalProdutos: { $addToSet: "$produto" },
        },
      },
      {
        $project: {
          totalItens: 1,
          totalCustoRuptura: 1,
          mediaDiasSemVenda: { $round: ["$mediaDiasSemVenda", 2] },
          totalSetores: { $size: "$totalSetores" },
          totalProdutos: { $size: "$totalProdutos" },
        },
      },
    ]);

    res.json(
      estatisticas[0] || {
        totalItens: 0,
        totalCustoRuptura: 0,
        mediaDiasSemVenda: 0,
        totalSetores: 0,
        totalProdutos: 0,
      }
    );
  } catch (error) {
    console.error("Erro ao calcular estatísticas de ruptura:", error);
    res.status(500).json({
      erro: "Falha ao calcular estatísticas",
      detalhes: error.message,
    });
  }
});

// Rota para obter datas de auditoria de ruptura
router.get("/datas-ruptura", async (req, res) => {
  try {
    const datas = await Ruptura.distinct("dataAuditoria");
    res.json(datas.sort((a, b) => new Date(b) - new Date(a)));
  } catch (error) {
    console.error("Erro ao buscar datas de ruptura:", error);
    res.status(500).json({
      erro: "Falha ao buscar datas",
      detalhes: error.message,
    });
  }
});

// Rota para dashboard de ruptura
router.get("/dashboard-ruptura", async (req, res) => {
  try {
    const { data } = req.query;
    let filter = { tipo: "ruptura" };

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
      Ruptura.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalItens: { $sum: 1 },
            totalCustoRuptura: { $sum: "$custoRuptura" },
            mediaDiasSemVenda: { $avg: "$diasSemVenda" },
          },
        },
      ]),

      // Dados por setor
      Ruptura.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$local",
            totalItens: { $sum: 1 },
            custoRuptura: { $sum: "$custoRuptura" },
            mediaDias: { $avg: "$diasSemVenda" },
          },
        },
        { $sort: { custoRuptura: -1 } },
      ]),

      // Dados por situação
      Ruptura.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$situacao",
            total: { $sum: 1 },
            custoTotal: { $sum: "$custoRuptura" },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      estatisticas: estatisticas[0] || {
        totalItens: 0,
        totalCustoRuptura: 0,
        mediaDiasSemVenda: 0,
      },
      porSetor,
      porSituacao,
      periodo: data || "todas as datas",
    });
  } catch (error) {
    console.error("Erro no dashboard de ruptura:", error);
    res.status(500).json({
      erro: "Falha ao gerar dashboard",
      detalhes: error.message,
    });
  }
});

export default router;
