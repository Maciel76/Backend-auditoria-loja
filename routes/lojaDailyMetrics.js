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

// POST /api/loja-daily-metrics/performance-map - Busca dados para o mapa de desempenho
router.post("/performance-map", async (req, res) => {
  try {
    const { loja, data } = req.body;

    if (!loja || !data) {
      return res.status(400).json({ message: "loja e data são obrigatórios" });
    }

    const startDate = new Date(data);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(data);
    endDate.setHours(23, 59, 59, 999);

    const regexLojaNome = new RegExp(`^Loja ${loja} -`, "i"); // 'i' para case-insensitive

    const metrics = await LojaDailyMetrics.findOne({
      lojaNome: regexLojaNome, // <--- MUDANÇA AQUI
      data: { $gte: startDate, $lte: endDate },
    }).select(
      "lojaNome data etiquetas.locaisLeitura etiquetas.totalItens etiquetas.usuariosAtivos rupturas.locaisLeitura rupturas.totalItens rupturas.usuariosAtivos presencas.locaisLeitura presencas.totalItens presencas.usuariosAtivos"
    );

    if (!metrics) {
      return res.status(404).json({
        message: "Nenhuma métrica encontrada para a loja e data especificadas",
      });
    }

    res.json(metrics);
  } catch (error) {
    console.error("Erro ao buscar dados de performance do mapa:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

router.get("/corredores/hoje", async (req, res) => {
  try {
    const lojaCodigo = req.headers["x-loja"]; // Pegar código da loja do header

    if (!lojaCodigo) {
      return res.status(400).json({
        message: "Código da loja não fornecido. Use o header x-loja.",
      });
    }

    console.log(`🔍 Buscando métricas de corredores para loja: ${lojaCodigo}`);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Criar regex para encontrar a loja pelo nome (similar à rota performance-map)
    const regexLojaNome = new RegExp(`^Loja ${lojaCodigo} -`, "i");

    const metricas = await LojaDailyMetrics.findOne({
      lojaNome: regexLojaNome,
      data: {
        $gte: hoje,
        $lt: amanha,
      },
    }).select(
      "lojaNome data etiquetas.locaisLeitura etiquetas.totalItens etiquetas.itensValidos etiquetas.usuariosAtivos " +
        "rupturas.locaisLeitura rupturas.totalItens rupturas.itensValidos rupturas.usuariosAtivos " +
        "presencas.locaisLeitura presencas.totalItens presencas.itensValidos presencas.usuariosAtivos presencas.presencasConfirmadas"
    );

    if (!metricas) {
      console.log(`⚠️ Nenhuma métrica encontrada para loja ${lojaCodigo} hoje`);
      return res.status(200).json({
        loja: lojaCodigo,
        lojaNome: `Loja ${lojaCodigo}`,
        data: hoje,
        etiquetas: { locaisLeitura: {}, resumo: {} },
        rupturas: { locaisLeitura: {}, resumo: {} },
        presencas: { locaisLeitura: {}, resumo: {} },
      });
    }

    // Log para debug
    console.log(`📍 Métricas encontradas para ${lojaCodigo}:`);
    console.log(
      `   Etiquetas locais: ${
        Object.keys(metricas.etiquetas?.locaisLeitura || {}).length
      }`
    );
    console.log(
      `   Rupturas locais: ${
        Object.keys(metricas.rupturas?.locaisLeitura || {}).length
      }`
    );
    console.log(
      `   Presenças locais: ${
        Object.keys(metricas.presencas?.locaisLeitura || {}).length
      }`
    );

    // Mostrar alguns exemplos de locais
    const locaisEtiquetas = Object.keys(
      metricas.etiquetas?.locaisLeitura || {}
    );
    if (locaisEtiquetas.length > 0) {
      console.log(
        `   Exemplo locais etiquetas: ${locaisEtiquetas.slice(0, 3).join(", ")}`
      );
    }

    res.json({
      loja: lojaCodigo,
      lojaNome: metricas.lojaNome,
      data: metricas.data,
      etiquetas: {
        totalItens: metricas.etiquetas?.totalItens || 0,
        itensValidos: metricas.etiquetas?.itensValidos || 0,
        locaisLeitura: metricas.etiquetas?.locaisLeitura || {},
        resumo: {
          totalItens: metricas.etiquetas?.totalItens || 0,
          usuariosAtivos: metricas.etiquetas?.usuariosAtivos || 0,
        },
      },
      rupturas: {
        totalItens: metricas.rupturas?.totalItens || 0,
        itensValidos: metricas.rupturas?.itensValidos || 0,
        locaisLeitura: metricas.rupturas?.locaisLeitura || {},
        resumo: {
          totalItens: metricas.rupturas?.totalItens || 0,
          usuariosAtivos: metricas.rupturas?.usuariosAtivos || 0,
        },
      },
      presencas: {
        totalItens: metricas.presencas?.totalItens || 0,
        itensValidos: metricas.presencas?.itensValidos || 0,
        presencasConfirmadas: metricas.presencas?.presencasConfirmadas || 0,
        locaisLeitura: metricas.presencas?.locaisLeitura || {},
        resumo: {
          totalItens: metricas.presencas?.totalItens || 0,
          usuariosAtivos: metricas.presencas?.usuariosAtivos || 0,
          presencasConfirmadas: metricas.presencas?.presencasConfirmadas || 0,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados dos corredores de hoje:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

export default router;
