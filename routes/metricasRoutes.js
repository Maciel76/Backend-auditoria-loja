import express from "express";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";

const router = express.Router();

// routes/metricasRoutes.js - Adicionar esta rota
router.get("/loja-daily/locais-completas", async (req, res) => {
  try {
    const lojaCodigo = req.headers["x-loja"];
    console.log(`🔍 Buscando métricas de locais para loja: ${lojaCodigo}`);

    if (!lojaCodigo) {
      return res.status(400).json({
        mensagem: "Loja não especificada. Use o header x-loja.",
      });
    }

    // Buscar a loja pelo código
    const lojaData = await Loja.findOne({ codigo: lojaCodigo });
    if (!lojaData) {
      return res.status(404).json({
        mensagem: `Loja com código ${lojaCodigo} não encontrada`,
      });
    }

    // Buscar métricas da loja para hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const metricas = await LojaDailyMetrics.findOne({
      loja: lojaData._id,
      data: { $gte: hoje, $lt: amanha },
    })
      .populate("loja", "codigo nome cidade regiao")
      .lean();

    if (!metricas) {
      return res.status(200).json({
        mensagem: "Nenhuma métrica encontrada para esta loja hoje",
        loja: lojaData.codigo,
        lojaNome: lojaData.nome,
        data: hoje.toISOString(),
        etiquetas: { locaisLeitura: {}, resumo: {} },
        rupturas: { locaisLeitura: {}, resumo: {} },
        presencas: { locaisLeitura: {}, resumo: {} },
      });
    }

    // Log para debug
    console.log(`📊 Métricas encontradas para loja ${lojaCodigo}:`);
    console.log(
      `📍 Etiquetas locais: ${
        Object.keys(metricas.etiquetas?.locaisLeitura || {}).length
      }`
    );
    console.log(
      `📍 Rupturas locais: ${
        Object.keys(metricas.rupturas?.locaisLeitura || {}).length
      }`
    );
    console.log(
      `📍 Presenças locais: ${
        Object.keys(metricas.presencas?.locaisLeitura || {}).length
      }`
    );

    // Montar resposta com estrutura simplificada para o frontend
    const resposta = {
      loja: metricas.loja?.codigo || lojaData.codigo,
      lojaNome: metricas.loja?.nome || lojaData.nome,
      data: metricas.data,
      etiquetas: {
        totalItens: metricas.etiquetas?.totalItens || 0,
        itensValidos: metricas.etiquetas?.itensValidos || 0,
        itensLidos: metricas.etiquetas?.itensLidos || 0,
        percentualConclusao: metricas.etiquetas?.percentualConclusao || 0,
        locaisLeitura: metricas.etiquetas?.locaisLeitura || {},
        resumo: {
          totalItens: metricas.etiquetas?.totalItens || 0,
          usuariosAtivos: metricas.etiquetas?.usuariosAtivos || 0,
          percentualConclusao: metricas.etiquetas?.percentualConclusao || 0,
        },
      },
      rupturas: {
        totalItens: metricas.rupturas?.totalItens || 0,
        itensValidos: metricas.rupturas?.itensValidos || 0,
        itensLidos: metricas.rupturas?.itensLidos || 0,
        percentualConclusao: metricas.rupturas?.percentualConclusao || 0,
        custoTotalRuptura: metricas.rupturas?.custoTotalRuptura || 0,
        locaisLeitura: metricas.rupturas?.locaisLeitura || {},
        resumo: {
          totalItens: metricas.rupturas?.totalItens || 0,
          usuariosAtivos: metricas.rupturas?.usuariosAtivos || 0,
          percentualConclusao: metricas.rupturas?.percentualConclusao || 0,
          custoTotalRuptura: metricas.rupturas?.custoTotalRuptura || 0,
        },
      },
      presencas: {
        totalItens: metricas.presencas?.totalItens || 0,
        itensValidos: metricas.presencas?.itensValidos || 0,
        itensLidos: metricas.presencas?.itensLidos || 0,
        percentualConclusao: metricas.presencas?.percentualConclusao || 0,
        presencasConfirmadas: metricas.presencas?.presencasConfirmadas || 0,
        custoRuptura: metricas.presencas?.custoRuptura || 0,
        locaisLeitura: metricas.presencas?.locaisLeitura || {},
        resumo: {
          totalItens: metricas.presencas?.totalItens || 0,
          usuariosAtivos: metricas.presencas?.usuariosAtivos || 0,
          percentualConclusao: metricas.presencas?.percentualConclusao || 0,
          presencasConfirmadas: metricas.presencas?.presencasConfirmadas || 0,
        },
      },
    };

    // Log de amostra dos primeiros locais
    const locaisEtiquetas = Object.keys(resposta.etiquetas.locaisLeitura);
    if (locaisEtiquetas.length > 0) {
      console.log(
        `📍 Amostra locais etiquetas (3 primeiros):`,
        locaisEtiquetas.slice(0, 3)
      );
    }

    res.json(resposta);
  } catch (error) {
    console.error("❌ Erro ao buscar métricas de locais:", error);
    res.status(500).json({
      mensagem: "Erro interno ao buscar métricas de locais",
      erro: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
