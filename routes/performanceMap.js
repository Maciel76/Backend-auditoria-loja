// backend/routes/performanceMap.js
import express from "express";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";

const router = express.Router();

// POST /api/performance-map - Busca dados para o mapa de desempenho do PerfilLoja
router.post("/", async (req, res) => {
  try {
    const { loja, data } = req.body;

    if (!loja || !data) {
      return res.status(400).json({ message: "O código da loja e a data são obrigatórios." });
    }

    const startDate = new Date(data);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(data);
    endDate.setHours(23, 59, 59, 999);

    // Procurar a loja pelo código, que pode estar no nome completo
    // O formato de lojaNome é "Loja XXX - NOME_DA_CIDADE", então vamos procurar por "Loja ${loja} -"
    const regexLojaNome = new RegExp(`^Loja ${loja} -`, 'i');

    console.log(`🔍 Buscando métricas para loja: ${loja} na data: ${data}`);
    console.log(`🔍 Regex usado para busca: ${regexLojaNome}`);
    console.log(`📅 Intervalo de datas: ${startDate} a ${endDate}`);

    // Primeira tentativa: buscar usando o código da loja (formato "Loja 056 - ...")
    const metrics = await LojaDailyMetrics.findOne({
      lojaNome: regexLojaNome,
      data: { $gte: startDate, $lte: endDate },
    }).select(
      "lojaNome data etiquetas.locaisLeitura etiquetas.totalItens etiquetas.usuariosAtivos rupturas.locaisLeitura rupturas.totalItens rupturas.usuariosAtivos presencas.locaisLeitura presencas.totalItens presencas.usuariosAtivos"
    );

    console.log(`📊 Resultado da busca: ${metrics ? 'Dados encontrados' : 'Nenhum dado encontrado'}`);

    if (!metrics) {
      console.log(`🔍 Nenhum dado encontrado para a loja ${loja} na data ${data}`);

      // Busca alternativa: tentar encontrar qualquer documento para debug
      const todosDocs = await LojaDailyMetrics.find({}).limit(5);
      console.log(`📋 Amostra de documentos existentes:`,
        todosDocs.map(doc => ({ lojaNome: doc.lojaNome, data: doc.data }))
      );

      // Fazer uma busca mais ampla para verificar se há dados para esta loja em qualquer data
      const lojaExistente = await LojaDailyMetrics.findOne({
        lojaNome: regexLojaNome,
      });

      console.log(`🔍 Loja existe em outros dias? ${lojaExistente ? 'Sim' : 'Não'}`);

      // Verificar se há dados para a data específica, mas com outro nome de loja
      const dadosNaData = await LojaDailyMetrics.findOne({
        data: { $gte: startDate, $lte: endDate }
      }).limit(5);

      console.log(`🔍 Existem dados para a data ${data} com outros nomes de loja? ${dadosNaData ? 'Sim' : 'Não'}`);
      if (dadosNaData) {
        console.log(`🔍 Nome da loja nos dados da data: ${dadosNaData.lojaNome}`);
      }

      // Busca alternativa: tentar encontrar dados usando diferentes formatos de nome de loja
      // Pode ser que o formato da loja esteja armazenado de forma diferente

      // Primeiro, vamos tentar encontrar a loja correspondente baseada no código
      let lojaCompleta = null;
      const lojasExistentes = [
        { codigo: "056", nome: "Loja 056 - Goiania Burits" },
        { codigo: "084", nome: "Loja 084 - Goiania Independência" },
        { codigo: "105", nome: "Loja 105 - T9" },
        { codigo: "111", nome: "Loja 111 - Rio Verde" },
        { codigo: "140", nome: "Loja 140 - Perimetral" },
        { codigo: "214", nome: "Loja 214 - Caldas Novas" },
        { codigo: "176", nome: "Loja 176 - Palmas Teotônio" },
        { codigo: "194", nome: "Loja 194 - Anápolis" },
        { codigo: "310", nome: "Loja 310 - Portugal" },
        { codigo: "320", nome: "Loja 320 - Palmas cesamar" },
      ];

      const lojaInfo = lojasExistentes.find(l => l.codigo === loja);

      if (lojaInfo) {
        console.log(`🔍 Tentando busca com nome completo: ${lojaInfo.nome}`);
        const metricsPorNomeCompleto = await LojaDailyMetrics.findOne({
          lojaNome: lojaInfo.nome,
          data: { $gte: startDate, $lte: endDate },
        }).select(
          "lojaNome data etiquetas.locaisLeitura etiquetas.totalItens etiquetas.usuariosAtivos rupturas.locaisLeitura rupturas.totalItens rupturas.usuariosAtivos presencas.locaisLeitura presencas.totalItens presencas.usuariosAtivos"
        );

        console.log(`📊 Resultado com nome completo: ${metricsPorNomeCompleto ? 'Dados encontrados' : 'Nenhum dado encontrado'}`);

        if (metricsPorNomeCompleto) {
          return res.json(metricsPorNomeCompleto);
        }
      }

      // Retorna 200 OK com um objeto vazio para que o frontend trate como dados válidos, mas vazios
      return res.status(200).json({
        lojaNome: `Loja ${loja} - Dados não disponíveis`,
        data: data,
        etiquetas: { locaisLeitura: {}, totalItens: 0, usuariosAtivos: 0 },
        rupturas: { locaisLeitura: {}, totalItens: 0, usuariosAtivos: 0 },
        presencas: { locaisLeitura: {}, totalItens: 0, usuariosAtivos: 0 },
      });
    }

    res.json(metrics);
  } catch (error) {
    console.error("❌ Erro ao buscar dados de performance do mapa:", error);
    res.status(500).json({
      message: "Erro interno do servidor ao buscar dados do mapa de performance.",
      error: error.message,
    });
  }
});

export default router;
