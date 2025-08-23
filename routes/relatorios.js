import express from "express";
import User from "../models/User.js";
import Planilha from "../models/Planilha.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { periodo } = req.query;

    let dataInicio, dataFim;
    const hoje = new Date();

    // Definir período com base no filtro
    switch (periodo) {
      case "semanal":
        dataInicio = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          hoje.getDate() - hoje.getDay()
        );
        dataFim = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          hoje.getDate() - hoje.getDay() + 6
        );
        break;
      case "mensal":
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      default: // diário
        dataInicio = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          hoje.getDate(),
          0,
          0,
          0,
          0
        );
        dataFim = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          hoje.getDate(),
          23,
          59,
          59,
          999
        );
    }

    // Buscar planilhas do período
    const planilhas = await Planilha.find({
      dataAuditoria: {
        $gte: dataInicio,
        $lte: dataFim,
      },
    });

    // Calcular totais
    const totalItens = planilhas.reduce((sum, p) => sum + p.totalItens, 0);
    const totalItensLidos = planilhas.reduce(
      (sum, p) => sum + p.totalItensLidos,
      0
    );
    const taxaConclusao =
      totalItens > 0 ? ((totalItensLidos / totalItens) * 100).toFixed(2) : 0;

    // Buscar desempenho por colaborador
    const usuarios = await User.find({
      "auditorias.data": {
        $gte: dataInicio,
        $lte: dataFim,
      },
    });

    const colaboradores = usuarios.map((user) => {
      const itensPeriodo = user.auditorias
        .filter((aud) => aud.data >= dataInicio && aud.data <= dataFim)
        .reduce((sum, aud) => sum + aud.contador, 0);

      return {
        nome: user.nome,
        itens: itensPeriodo,
        percentual:
          totalItens > 0 ? ((itensPeriodo / totalItens) * 100).toFixed(2) : 0,
      };
    });

    res.json({
      periodo,
      dataInicio,
      dataFim,
      totalItens,
      totalItensLidos,
      taxaConclusao,
      colaboradores: colaboradores.sort((a, b) => b.itens - a.itens),
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({
      erro: "Falha ao gerar relatório",
      detalhes: error.message,
    });
  }
});

export default router;
