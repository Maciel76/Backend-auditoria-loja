import express from "express";
import User from "../models/User.js";
import Planilha from "../models/Planilha.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { periodo, data } = req.query;

    let dataInicio, dataFim;
    const hoje = new Date();

    // Definir período com base no filtro
    if (data) {
      // Data específica
      dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
    } else {
      // Período padrão (hoje)
      dataInicio = new Date(hoje.setHours(0, 0, 0, 0));
      dataFim = new Date(hoje.setHours(23, 59, 59, 999));
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

    const colaboradores = usuarios
      .map((user) => {
        const itensPeriodo = user.auditorias
          .filter((aud) => aud.data >= dataInicio && aud.data <= dataFim)
          .reduce((sum, aud) => sum + aud.contador, 0);

        return {
          id: user.id,
          nome: user.nome,
          itens: itensPeriodo,
          percentual:
            totalItens > 0 ? ((itensPeriodo / totalItens) * 100).toFixed(2) : 0,
        };
      })
      .filter((colab) => colab.itens > 0) // Filtrar apenas colaboradores com atividade
      .sort((a, b) => b.itens - a.itens);

    res.json({
      periodo: data ? "diario" : periodo,
      dataInicio,
      dataFim,
      totalItens,
      totalItensLidos,
      taxaConclusao,
      colaboradores,
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
