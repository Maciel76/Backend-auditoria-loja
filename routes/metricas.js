import express from "express";
import MetricasUsuario from "../models/MetricasUsuario.js";
import MetricasLoja from "../models/MetricasLoja.js";
import MetricasAuditoria from "../models/MetricasAuditoria.js";
import MetricasGlobais from "../models/MetricasGlobais.js";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";
import metricsCalculationService from "../services/metricsCalculationService.js";

// Helper function to access static method
const obterPeriodo = (periodo, data) => {
  const dataRef = new Date(data);
  let dataInicio, dataFim;

  switch (periodo) {
    case "diario":
      dataInicio = new Date(dataRef);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date(dataRef);
      dataFim.setHours(23, 59, 59, 999);
      break;

    case "semanal":
      const diaSemanaSemana = dataRef.getDay();
      dataInicio = new Date(dataRef);
      dataInicio.setDate(dataRef.getDate() - diaSemanaSemana);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6);
      dataFim.setHours(23, 59, 59, 999);
      break;

    case "mensal":
      dataInicio = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1);
      dataFim = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0);
      dataFim.setHours(23, 59, 59, 999);
      break;

    default:
      throw new Error(`Período inválido: ${periodo}`);
  }

  return { dataInicio, dataFim };
};
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

// ===== ROTAS DE MÉTRICAS DE USUÁRIOS =====

// Obter métricas de um usuário específico
router.get(
  "/usuarios/:usuarioId",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const { usuarioId } = req.params;
      const { periodo = "mensal", data, limite = 12 } = req.query;

      // Se data específica foi fornecida, buscar métricas dessa data
      if (data) {
        const dataEspecifica = new Date(data);
        const { dataInicio, dataFim } = obterPeriodo(periodo, dataEspecifica);

        const metricas = await MetricasUsuario.findOne({
          usuarioId,
          loja: req.loja._id,
          periodo,
          dataInicio: { $gte: dataInicio, $lte: dataInicio },
        }).populate("loja", "codigo nome regiao");

        return res.json({
          usuario: {
            usuarioId,
            loja: req.loja.codigo,
          },
          periodo,
          data: dataEspecifica,
          metricas: metricas || null,
        });
      }

      // Buscar histórico de métricas do usuário
      const historico = await MetricasUsuario.find({
        usuarioId,
        loja: req.loja._id,
        periodo,
      })
        .populate("loja", "codigo nome regiao")
        .sort({ dataInicio: -1 })
        .limit(parseInt(limite));

      // Calcular tendências
      const tendencias =
        historico.length >= 2
          ? {
              melhoriaTotal:
                (historico[0]?.totais.percentualConclusaoGeral || 0) -
                (historico[1]?.totais.percentualConclusaoGeral || 0),
              melhoriaEtiquetas:
                (historico[0]?.etiquetas.itensAtualizados || 0) -
                (historico[1]?.etiquetas.itensAtualizados || 0),
              melhoriaRupturas:
                (historico[0]?.rupturas.itensAtualizados || 0) -
                (historico[1]?.rupturas.itensAtualizados || 0),
              melhoriaPresencas:
                (historico[0]?.presencas.itensAtualizados || 0) -
                (historico[1]?.presencas.itensAtualizados || 0),
            }
          : null;

      res.json({
        usuario: {
          usuarioId,
          usuarioNome: historico[0]?.usuarioNome || "Usuário não encontrado",
          loja: req.loja.codigo,
        },
        periodo,
        historico,
        tendencias,
        totalPeriodos: historico.length,
      });
    } catch (error) {
      console.error("Erro ao buscar métricas do usuário:", error);
      res.status(500).json({
        erro: "Falha ao buscar métricas do usuário",
        detalhes: error.message,
      });
    }
  },
);

// Obter ranking de usuários da loja
router.get("/usuarios/ranking", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { periodo = "mensal", data, limite = 50 } = req.query;

    let filtroData = {};
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);
      filtroData = { dataInicio: { $gte: dataInicio, $lte: dataInicio } };
    }

    const ranking = await MetricasUsuario.find({
      loja: req.loja._id,
      periodo,
      ...filtroData,
    })
      .populate("loja", "codigo nome")
      .sort({ "totais.pontuacaoTotal": -1 })
      .limit(parseInt(limite));

    // Adicionar posições
    const rankingComPosicoes = ranking.map((usuario, index) => ({
      posicao: index + 1,
      usuarioId: usuario.usuarioId,
      usuarioNome: usuario.usuarioNome,
      pontuacao: usuario.totais.pontuacaoTotal,
      percentualConclusao: usuario.totais.percentualConclusaoGeral,
      totalItens: usuario.totais.totalItens,
      itensAtualizados: usuario.totais.itensAtualizados,
      especialidades: {
        etiquetas: usuario.etiquetas.percentualConclusao,
        rupturas: usuario.rupturas.percentualConclusao,
        presencas: usuario.presencas.percentualConclusao,
      },
      ultimaAtualizacao: usuario.ultimaAtualizacao,
    }));

    res.json({
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
      periodo,
      data: data ? new Date(data) : null,
      ranking: rankingComPosicoes,
      totalUsuarios: ranking.length,
    });
  } catch (error) {
    console.error("Erro ao buscar ranking de usuários:", error);
    res.status(500).json({
      erro: "Falha ao buscar ranking de usuários",
      detalhes: error.message,
    });
  }
});

// ===== ROTAS DE MÉTRICAS DE LOJAS =====

// Obter métricas da loja atual
router.get("/loja", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { periodo = "mensal", data, limite = 12 } = req.query;

    // Se data específica foi fornecida
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);

      const metricas = await MetricasLoja.findOne({
        loja: req.loja._id,
        periodo,
        dataInicio: { $gte: dataInicio, $lte: dataInicio },
      }).populate("loja", "codigo nome regiao");

      return res.json({
        loja: {
          codigo: req.loja.codigo,
          nome: req.loja.nome,
          regiao: req.loja.regiao,
        },
        periodo,
        data: dataEspecifica,
        metricas: metricas || null,
      });
    }

    // Buscar histórico
    const historico = await MetricasLoja.find({
      loja: req.loja._id,
      periodo,
    })
      .populate("loja", "codigo nome regiao")
      .sort({ dataInicio: -1 })
      .limit(parseInt(limite));

    // Calcular tendências
    const tendencias =
      historico.length >= 2
        ? {
            melhoriaTotal:
              historico[0]?.totais.percentualConclusaoGeral -
              historico[1]?.totais.percentualConclusaoGeral,
            melhoriaRanking:
              historico[1]?.ranking.posicaoGeral -
              historico[0]?.ranking.posicaoGeral, // Melhoria = posição menor
            crescimentoUsuarios:
              historico[0]?.totais.usuariosAtivos -
              historico[1]?.totais.usuariosAtivos,
            melhoriaEficiencia:
              historico[0]?.ranking.eficienciaOperacional -
              historico[1]?.ranking.eficienciaOperacional,
          }
        : null;

    res.json({
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
        regiao: req.loja.regiao,
      },
      periodo,
      historico,
      tendencias,
      totalPeriodos: historico.length,
    });
  } catch (error) {
    console.error("Erro ao buscar métricas da loja:", error);
    res.status(500).json({
      erro: "Falha ao buscar métricas da loja",
      detalhes: error.message,
    });
  }
});

// Obter ranking geral de lojas (apenas para usuários com acesso global)
router.get("/lojas/ranking", async (req, res) => {
  try {
    const { periodo = "mensal", data, limite = 50, regiao } = req.query;

    let filtroData = {};
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);
      filtroData = { dataInicio: { $gte: dataInicio, $lte: dataInicio } };
    }

    let filtros = { periodo, ...filtroData };

    const ranking = await MetricasLoja.find(filtros)
      .populate("loja", "codigo nome regiao")
      .sort({ "ranking.pontuacaoTotal": -1 })
      .limit(parseInt(limite));

    // Filtrar por região se especificado
    let rankingFiltrado = ranking;
    if (regiao && regiao !== "todas") {
      rankingFiltrado = ranking.filter((loja) => loja.loja.regiao === regiao);
    }

    const rankingFormatado = rankingFiltrado.map((loja, index) => ({
      posicao: index + 1,
      loja: {
        codigo: loja.loja.codigo,
        nome: loja.loja.nome,
        regiao: loja.loja.regiao,
      },
      pontuacao: loja.ranking.pontuacaoTotal,
      notaQualidade: loja.ranking.notaQualidade,
      percentualConclusao: loja.totais.percentualConclusaoGeral,
      usuariosAtivos: loja.totais.usuariosAtivos,
      totalItens: loja.totais.totalItens,
      melhorUsuario: loja.usuariosEstatisticas.melhorUsuario,
      alertas: loja.alertas.filter(
        (a) => a.severidade === "alta" || a.severidade === "critica",
      ).length,
      ultimaAtualizacao: loja.ultimaAtualizacao,
    }));

    res.json({
      periodo,
      data: data ? new Date(data) : null,
      regiao: regiao || "todas",
      ranking: rankingFormatado,
      totalLojas: rankingFormatado.length,
    });
  } catch (error) {
    console.error("Erro ao buscar ranking de lojas:", error);
    res.status(500).json({
      erro: "Falha ao buscar ranking de lojas",
      detalhes: error.message,
    });
  }
});

// ===== ROTAS DE MÉTRICAS DIÁRIAS DE LOJA (LojaDailyMetrics) =====

// Obter métricas diárias da loja atual
router.get("/loja-daily", verificarLojaObrigatoria, async (req, res) => {
  try {
    const {
      data = new Date().toISOString().split("T")[0],
      tipoAuditoria = "etiquetas",
    } = req.query;

    // Converter string para Date
    const dataEspecifica = new Date(data);

    // Ajustar para o início e fim do dia
    const dataInicio = new Date(dataEspecifica);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataEspecifica);
    dataFim.setHours(23, 59, 59, 999);

    // Buscar métricas diárias para a loja e data específica
    const metricas = await LojaDailyMetrics.findOne({
      loja: req.loja._id,
      dataInicio: { $gte: dataInicio, $lt: dataFim },
    }).populate("loja", "codigo nome regiao");

    if (!metricas) {
      return res.json({
        loja: {
          codigo: req.loja.codigo,
          nome: req.loja.nome,
          regiao: req.loja.regiao,
        },
        data: dataEspecifica,
        tipoAuditoria,
        metricas: null,
        mensagem:
          "Sem dados para exibir. Faça upload de uma planilha para visualizar as métricas.",
      });
    }

    // Retornar os dados específicos por tipo de auditoria
    const dadosTipoAuditoria = metricas[tipoAuditoria] || {};

    // Formatar a resposta para o componente MetricasSetor.vue
    const resposta = {
      usuarioId: req.usuario?.id || "anonimo", // Poderia vir do middleware
      loja: req.loja._id,
      lojaNome: req.loja.nome,
      metricas: {
        data: dataEspecifica,
        etiquetas: metricas.etiquetas,
        rupturas: metricas.rupturas,
        presencas: metricas.presencas,
        totais: metricas.totais,
      },
    };

    res.json(resposta);
  } catch (error) {
    console.error("Erro ao buscar métricas diárias da loja:", error);
    res.status(500).json({
      erro: "Falha ao buscar métricas diárias da loja",
      detalhes: error.message,
    });
  }
});

// Obter métricas por classe de produto (dados para MetricasSetor.vue)
router.get(
  "/loja-daily/classes",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const {
        data = new Date().toISOString().split("T")[0],
        tipoAuditoria = "etiquetas",
      } = req.query;

      // Converter string para Date
      const dataEspecifica = new Date(data);

      // Ajustar para o início e fim do dia
      const dataInicio = new Date(dataEspecifica);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(dataEspecifica);
      dataFim.setHours(23, 59, 59, 999);

      // Buscar métricas diárias para a loja e data específica
      const metricas = await LojaDailyMetrics.findOne({
        loja: req.loja._id,
        dataInicio: { $gte: dataInicio, $lt: dataFim },
      });

      if (!metricas) {
        return res.json({
          loja: req.loja.nome,
          data: dataEspecifica,
          tipoAuditoria,
          classesLeitura: {},
          mensagem: "Nenhuma métrica diária encontrada para esta data",
        });
      }

      // Retornar apenas os dados de classesLeitura
      const dadosTipoAuditoria = metricas[tipoAuditoria] || {};
      const classesLeitura = dadosTipoAuditoria.classesLeitura || {};

      res.json({
        loja: req.loja.nome,
        data: dataEspecifica,
        tipoAuditoria,
        classesLeitura,
        resumo: {
          totalItens: dadosTipoAuditoria.totalItens || 0,
          itensLidos:
            dadosTipoAuditoria.itensValidos ||
            dadosTipoAuditoria.itensLidos ||
            0,
          percentualConclusao: dadosTipoAuditoria.percentualConclusao || 0,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar métricas por classe:", error);
      res.status(500).json({
        erro: "Falha ao buscar métricas por classe",
        detalhes: error.message,
      });
    }
  },
);

// Obter histórico de métricas diárias da loja
router.get(
  "/loja-daily/historico",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const {
        dataInicio: dataInicioQuery,
        dataFim: dataFimQuery,
        limite = 30,
      } = req.query;

      const dataInicio = dataInicioQuery
        ? new Date(dataInicioQuery)
        : new Date();
      const dataFim = dataFimQuery ? new Date(dataFimQuery) : new Date();

      const historico = await LojaDailyMetrics.find({
        loja: req.loja._id,
        data: { $gte: dataInicio, $lte: dataFim },
      })
        .sort({ data: -1 })
        .limit(parseInt(limite));

      res.json({
        loja: req.loja.nome,
        periodo: {
          dataInicio: dataInicio,
          dataFim: dataFim,
        },
        historico: historico.map((m) => ({
          data: m.data,
          etiquetas: m.etiquetas,
          rupturas: m.rupturas,
          presencas: m.presencas,
          totais: m.totais,
          ranking: m.ranking,
          ultimaAtualizacao: m.ultimaAtualizacao,
        })),
        totalDias: historico.length,
      });
    } catch (error) {
      console.error("Erro ao buscar histórico de métricas diárias:", error);
      res.status(500).json({
        erro: "Falha ao buscar histórico de métricas diárias",
        detalhes: error.message,
      });
    }
  },
);

// Obter ranking diário de lojas (similar ao existente mas com mais detalhes)
router.get("/lojas-daily-ranking", async (req, res) => {
  try {
    const { data: dataQuery, limite = 50, regiao } = req.query;

    const dataEspecifica = dataQuery ? new Date(dataQuery) : new Date();
    // Ajustar para o início e fim do dia
    const dataInicio = new Date(dataEspecifica);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataEspecifica);
    dataFim.setHours(23, 59, 59, 999);

    // Buscar todas as lojas com métricas diárias para a data específica
    const ranking = await LojaDailyMetrics.find({
      dataInicio: { $gte: dataInicio, $lt: dataFim },
    })
      .populate("loja", "codigo nome cidade regiao")
      .sort({ "ranking.pontuacaoTotal": -1 })
      .limit(parseInt(limite));

    // Filtrar por região se especificado
    let rankingFiltrado = ranking;
    if (regiao && regiao !== "todas") {
      rankingFiltrado = ranking.filter((loja) => loja.loja?.regiao === regiao);
    }

    const rankingFormatado = rankingFiltrado.map((item, index) => ({
      posicao: index + 1,
      loja: {
        codigo: item.loja?.codigo || "N/A",
        nome: item.loja?.nome || "N/A",
        cidade: item.loja?.cidade || "N/A",
        regiao: item.loja?.regiao || "N/A",
      },
      pontuacao: item.ranking?.pontuacaoTotal || 0,
      notaQualidade: item.ranking?.notaQualidade || 0,
      eficienciaOperacional: item.ranking?.eficienciaOperacional || 0,

      // Totais consolidados
      totalItens: item.totais?.totalItens || 0,
      percentualConclusao: item.totais?.percentualConclusaoGeral || 0,
      usuariosAtivos: item.totais?.usuariosAtivos || 0,

      // Dados por tipo - diretamente do modelo
      etiquetas: item.etiquetas || {},
      rupturas: item.rupturas || {},
      presencas: item.presencas || {},

      // Outros dados
      alertas: item.alertas?.length || 0,
      locaisComProblemas:
        item.locaisEstatisticas?.filter(
          (l) =>
            l.prioridadeAtencao === "alta" || l.prioridadeAtencao === "critica",
        ).length || 0,
      ultimaAtualizacao: item.ultimaAtualizacao,
    }));

    res.json({
      data: dataEspecifica,
      regiao: regiao || "todas",
      ranking: rankingFormatado,
      totalLojas: rankingFormatado.length,
      resumo: {
        melhorLoja: rankingFormatado[0] || null,
        mediaItens:
          rankingFormatado.length > 0
            ? Math.round(
                rankingFormatado.reduce((acc, l) => acc + l.totalItens, 0) /
                  rankingFormatado.length,
              )
            : 0,
        mediaEficiencia:
          rankingFormatado.length > 0
            ? Math.round(
                rankingFormatado.reduce(
                  (acc, l) => acc + l.percentualConclusao,
                  0,
                ) / rankingFormatado.length,
              )
            : 0,
        totalUsuariosAtivos: rankingFormatado.reduce(
          (acc, l) => acc + l.usuariosAtivos,
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar ranking LojaDailyMetrics:", error);
    res.status(500).json({
      erro: "Falha ao buscar ranking de lojas diárias",
      detalhes: error.message,
    });
  }
});

// Obter ranking de lojas usando LojaDailyMetrics com mais detalhes por classe
router.get("/lojas-daily-ranking-classes", async (req, res) => {
  try {
    const { data: dataQuery, tipoAuditoria = "etiquetas" } = req.query;

    const dataEspecifica = dataQuery ? new Date(dataQuery) : new Date();
    // Ajustar para o início e fim do dia
    const dataInicio = new Date(dataEspecifica);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataEspecifica);
    dataFim.setHours(23, 59, 59, 999);

    // Buscar todas as lojas com métricas diárias para a data específica
    const ranking = await LojaDailyMetrics.find({
      dataInicio: { $gte: dataInicio, $lt: dataFim },
    })
      .populate("loja", "codigo nome cidade regiao")
      .sort({ "ranking.pontuacaoTotal": -1 });

    const rankingPorClasses = ranking.map((item, index) => {
      const dadosTipo = item[tipoAuditoria] || {};
      const classesLeitura = dadosTipo.classesLeitura || {};

      return {
        posicao: index + 1,
        loja: {
          codigo: item.loja?.codigo || "N/A",
          nome: item.loja?.nome || "N/A",
          cidade: item.loja?.cidade || "N/A",
          regiao: item.loja?.regiao || "N/A",
        },
        pontuacao: item.ranking?.pontuacaoTotal || 0,
        tipoAuditoria: tipoAuditoria,
        classesLeitura: classesLeitura,
        totalItens: dadosTipo.totalItens || 0,
        percentualConclusao: dadosTipo.percentualConclusao || 0,
        usuariosAtivos: dadosTipo.usuariosAtivos || 0,
      };
    });

    res.json({
      data: dataEspecifica,
      tipoAuditoria: tipoAuditoria,
      ranking: rankingPorClasses,
      totalLojas: rankingPorClasses.length,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar ranking LojaDailyMetrics por classes:",
      error,
    );
    res.status(500).json({
      erro: "Falha ao buscar ranking de lojas diárias por classes",
      detalhes: error.message,
    });
  }
});

// Função auxiliar para gerar dados fakes (quando não há dados reais)
function gerarDadosFakes(nomeLoja, tipoAuditoria = "etiquetas") {
  const classes = [
    "A CLASSIFICAR",
    "ALTO GIRO",
    "BAZAR",
    "DIVERSOS",
    "DPH",
    "FLV",
    "LATICINIOS 1",
    "LIQUIDA",
    "PERECIVEL 1",
    "PERECIVEL 2",
    "PERECIVEL 2 B",
    "PERECIVEL 3",
    "SECA DOCE",
    "SECA SALGADA",
    "SECA SALGADA 2",
  ];

  const dadosFake = {
    usuarioId: "2692473",
    loja: "68f866ee22514096fd4c3295",
    lojaNome: nomeLoja,
    metricas: {
      data: new Date().toISOString(),
      etiquetas: {
        totalItens: 1301,
        itensValidos: 1200,
        itensLidos: 1200,
        itensAtualizados: 1000,
        itensDesatualizado: 150,
        itensNaopertence: 50,
        percentualConclusao: 92,
        percentualDesatualizado: 12.5,
        usuariosAtivos: 8,
        classesLeitura: {},
        contadorClasses: {},
      },
      rupturas: {
        totalItens: 0,
        itensLidos: 0,
        itensAtualizados: 0,
        percentualConclusao: 0,
        custoTotalRuptura: 0,
        usuariosAtivos: 0,
        classesLeitura: {},
        contadorClasses: {},
      },
      presencas: {
        totalItens: 0,
        itensLidos: 0,
        itensAtualizados: 0,
        percentualConclusao: 0,
        presencasConfirmadas: 0,
        percentualPresenca: 0,
        usuariosAtivos: 0,
        classesLeitura: {},
        contadorClasses: {},
      },
      totais: {
        totalItens: 1301,
        itensLidos: 1200,
        itensAtualizados: 1000,
        percentualConclusaoGeral: 92,
        usuariosTotais: 15,
        usuariosAtivos: 8,
        planilhasProcessadas: 5,
      },
    },
  };

  // Preencher classesLeitura com dados fakes FIXOS (não aleatórios)
  // Dados baseados em uma planilha real média
  const dadosFixosPorClasse = {
    "A CLASSIFICAR": { total: 71, itensValidos: 64, lidos: 58 },
    "ALTO GIRO": { total: 446, itensValidos: 400, lidos: 350 },
    BAZAR: { total: 2643, itensValidos: 2400, lidos: 2100 },
    DIVERSOS: { total: 7, itensValidos: 6, lidos: 5 },
    DPH: { total: 3376, itensValidos: 3100, lidos: 2800 },
    FLV: { total: 62, itensValidos: 56, lidos: 50 },
    "LATICINIOS 1": { total: 432, itensValidos: 390, lidos: 340 },
    LIQUIDA: { total: 1249, itensValidos: 1150, lidos: 1000 },
    "PERECIVEL 1": { total: 611, itensValidos: 550, lidos: 480 },
    "PERECIVEL 2": { total: 823, itensValidos: 750, lidos: 650 },
    "PERECIVEL 2 B": { total: 42, itensValidos: 38, lidos: 33 },
    "PERECIVEL 3": { total: 154, itensValidos: 140, lidos: 120 },
    "SECA DOCE": { total: 2719, itensValidos: 2500, lidos: 2200 },
    "SECA SALGADA": { total: 879, itensValidos: 800, lidos: 700 },
    "SECA SALGADA 2": { total: 284, itensValidos: 260, lidos: 230 },
  };

  for (const classe of classes) {
    const dados = dadosFixosPorClasse[classe] || {
      total: 100,
      itensValidos: 90,
      lidos: 75,
    };
    const percentual =
      dados.itensValidos > 0 ? (dados.lidos / dados.itensValidos) * 100 : 0;

    dadosFake.metricas[tipoAuditoria].classesLeitura[classe] = {
      total: dados.total,
      itensValidos: dados.itensValidos,
      lidos: dados.lidos,
      percentual: Math.round(percentual * 100) / 100,
    };

    dadosFake.metricas[tipoAuditoria].contadorClasses[classe] = dados.lidos;
  }

  return dadosFake;
}

// Obter ranking geral de lojas (apenas para usuários com acesso global)
router.post("/lojas/comparar", async (req, res) => {
  try {
    const { lojasCodigos, periodo = "mensal", data } = req.body;

    if (
      !lojasCodigos ||
      !Array.isArray(lojasCodigos) ||
      lojasCodigos.length < 2
    ) {
      return res.status(400).json({
        erro: "É necessário fornecer pelo menos 2 códigos de lojas para comparação",
      });
    }

    // Buscar lojas pelos códigos
    const Loja = (await import("../models/Loja.js")).default;
    const lojas = await Loja.find({ codigo: { $in: lojasCodigos } });

    if (lojas.length !== lojasCodigos.length) {
      return res.status(404).json({
        erro: "Uma ou mais lojas não foram encontradas",
        lojasEncontradas: lojas.map((l) => l.codigo),
        lojasNaoEncontradas: lojasCodigos.filter(
          (c) => !lojas.find((l) => l.codigo === c),
        ),
      });
    }

    let filtroData = {};
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);
      filtroData = { dataInicio: { $gte: dataInicio, $lte: dataInicio } };
    }

    // Buscar métricas das lojas
    const lojasIds = lojas.map((l) => l._id);
    const metricas = await MetricasLoja.find({
      loja: { $in: lojasIds },
      periodo,
      ...filtroData,
    }).populate("loja", "codigo nome regiao");

    // Organizar comparação
    const comparacao = lojasCodigos.map((codigo) => {
      const loja = lojas.find((l) => l.codigo === codigo);
      const metrica = metricas.find(
        (m) => m.loja._id.toString() === loja._id.toString(),
      );

      return {
        loja: {
          codigo: loja.codigo,
          nome: loja.nome,
          regiao: loja.regiao,
        },
        metricas: metrica
          ? {
              pontuacao: metrica.ranking.pontuacaoTotal,
              posicaoRanking: metrica.ranking.posicaoGeral,
              percentualConclusao: metrica.totais.percentualConclusaoGeral,
              usuariosAtivos: metrica.totais.usuariosAtivos,
              totalItens: metrica.totais.totalItens,
              por_tipo: {
                etiquetas: metrica.etiquetas.percentualConclusao,
                rupturas: metrica.rupturas.percentualConclusao,
                presencas: metrica.presencas.percentualConclusao,
              },
              custoRuptura: metrica.rupturas.custoTotalRuptura,
              alertas: metrica.alertas.length,
            }
          : null,
      };
    });

    res.json({
      periodo,
      data: data ? new Date(data) : null,
      comparacao,
      totalLojas: comparacao.length,
      resumo: {
        melhor_loja: comparacao.reduce((melhor, atual) => {
          if (!atual.metricas) return melhor;
          if (!melhor.metricas) return atual;
          return atual.metricas.pontuacao > melhor.metricas.pontuacao
            ? atual
            : melhor;
        }),
        maior_crescimento: comparacao.reduce((maior, atual) => {
          if (!atual.metricas) return maior;
          if (!maior.metricas) return atual;
          return atual.metricas.usuariosAtivos > maior.metricas.usuariosAtivos
            ? atual
            : maior;
        }),
      },
    });
  } catch (error) {
    console.error("Erro ao comparar lojas:", error);
    res.status(500).json({
      erro: "Falha ao comparar lojas",
      detalhes: error.message,
    });
  }
});

// ===== ROTAS DE MÉTRICAS POR TIPO DE AUDITORIA =====

// Obter métricas por tipo de auditoria
router.get("/auditorias/:tipo", async (req, res) => {
  try {
    const { tipo } = req.params;
    const { periodo = "mensal", data, limite = 12 } = req.query;

    if (!["etiqueta", "ruptura", "presenca"].includes(tipo)) {
      return res.status(400).json({
        erro: "Tipo de auditoria inválido. Use: etiqueta, ruptura ou presenca",
      });
    }

    // Se data específica foi fornecida
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);

      const metricas = await MetricasAuditoria.findOne({
        tipo,
        periodo,
        dataInicio: { $gte: dataInicio, $lte: dataInicio },
      });

      return res.json({
        tipo,
        periodo,
        data: dataEspecifica,
        metricas: metricas || null,
      });
    }

    // Buscar histórico
    const historico = await MetricasAuditoria.find({
      tipo,
      periodo,
    })
      .sort({ dataInicio: -1 })
      .limit(parseInt(limite));

    res.json({
      tipo,
      periodo,
      historico,
      totalPeriodos: historico.length,
    });
  } catch (error) {
    console.error("Erro ao buscar métricas de auditoria:", error);
    res.status(500).json({
      erro: "Falha ao buscar métricas de auditoria",
      detalhes: error.message,
    });
  }
});

// Comparar diferentes tipos de auditoria
router.get("/auditorias/comparacao", async (req, res) => {
  try {
    const { periodo = "mensal", data } = req.query;

    let filtroData = {};
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);
      filtroData = { dataInicio: { $gte: dataInicio, $lte: dataInicio } };
    }

    const tipos = ["etiqueta", "ruptura", "presenca"];
    const metricas = await MetricasAuditoria.find({
      tipo: { $in: tipos },
      periodo,
      ...filtroData,
    }).sort({ tipo: 1 });

    const comparacao = tipos.map((tipo) => {
      const metrica = metricas.find((m) => m.tipo === tipo);
      return {
        tipo,
        metricas: metrica
          ? {
              totalItens: metrica.totais.totalItens,
              percentualConclusao: metrica.totais.percentualConclusao,
              lojasAtivas: metrica.totais.lojasAtivas,
              usuariosAtivos: metrica.totais.usuariosAtivos,
              padroesCriticos: metrica.padroesCriticos.length,
              insights: metrica.insights.length,
              tendencia: metrica.tendencias.melhoriaQualidade,
            }
          : null,
      };
    });

    // Resumo comparativo
    const resumo = {
      tipo_mais_ativo: comparacao.reduce((maior, atual) => {
        if (!atual.metricas) return maior;
        if (!maior.metricas) return atual;
        return atual.metricas.totalItens > maior.metricas.totalItens
          ? atual
          : maior;
      }),
      melhor_performance: comparacao.reduce((melhor, atual) => {
        if (!atual.metricas) return melhor;
        if (!melhor.metricas) return atual;
        return atual.metricas.percentualConclusao >
          melhor.metricas.percentualConclusao
          ? atual
          : melhor;
      }),
      mais_problematico: comparacao.reduce((problematico, atual) => {
        if (!atual.metricas) return problematico;
        if (!problematico.metricas) return atual;
        return atual.metricas.padroesCriticos >
          problematico.metricas.padroesCriticos
          ? atual
          : problematico;
      }),
    };

    res.json({
      periodo,
      data: data ? new Date(data) : null,
      comparacao,
      resumo,
    });
  } catch (error) {
    console.error("Erro ao comparar tipos de auditoria:", error);
    res.status(500).json({
      erro: "Falha ao comparar tipos de auditoria",
      detalhes: error.message,
    });
  }
});

// ===== ROTAS DE MÉTRICAS GLOBAIS =====

// Obter dashboard executivo (métricas globais)
router.get("/dashboard", async (req, res) => {
  try {
    const { periodo = "mensal", data } = req.query;

    let filtroData = {};
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);
      filtroData = { dataInicio: { $gte: dataInicio, $lte: dataInicio } };
    }

    const metricas = await MetricasGlobais.findOne({
      periodo,
      ...filtroData,
    })
      .populate("rankings.melhorLoja.loja", "codigo nome regiao")
      .populate("rankings.melhorUsuario.loja", "codigo nome")
      .sort({ dataInicio: -1 });

    if (!metricas) {
      return res.status(404).json({
        erro: "Métricas globais não encontradas para o período especificado",
        periodo,
        data: data ? new Date(data) : null,
      });
    }

    res.json({
      periodo,
      data: metricas.dataInicio,
      dashboard: {
        resumo_executivo: metricas.resumoExecutivo,
        indicadores_negocio: metricas.indicadoresNegocio,
        rankings: metricas.rankings,
        por_tipo_auditoria: metricas.porTipoAuditoria,
        analise_regional: metricas.porRegiao,
        tendencias: metricas.tendencias,
        alertas_criticos: metricas.alertasCriticos,
        insights_estrategicos: metricas.insightsEstrategicos,
        metas: metricas.metas,
        comparacoes: metricas.comparacoes,
        ultima_atualizacao: metricas.ultimaAtualizacao,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard executivo:", error);
    res.status(500).json({
      erro: "Falha ao buscar dashboard executivo",
      detalhes: error.message,
    });
  }
});

// Obter tendências históricas globais
router.get("/tendencias", async (req, res) => {
  try {
    const { periodo = "mensal", limite = 12 } = req.query;

    const historico = await MetricasGlobais.find({ periodo })
      .sort({ dataInicio: -1 })
      .limit(parseInt(limite));

    if (historico.length === 0) {
      return res.status(404).json({
        erro: "Nenhuma métrica histórica encontrada",
        periodo,
      });
    }

    // Extrair dados para gráficos
    const dados_temporais = historico.reverse().map((metrica) => ({
      data: metrica.dataInicio,
      percentual_conclusao: metrica.resumoExecutivo.percentualConclusaoGeral,
      usuarios_ativos: metrica.resumoExecutivo.usuariosAtivos,
      lojas_ativas: metrica.resumoExecutivo.lojasAtivas,
      itens_processados: metrica.resumoExecutivo.totalItensProcessados,
      custo_ruptura: metrica.porTipoAuditoria.rupturas.custoTotalRuptura,
      indice_plataforma: metrica.indicadoresNegocio.indicePlataforma,
    }));

    // Calcular crescimento médio
    const crescimento_medio =
      dados_temporais.length >= 2
        ? {
            conclusao: (
              (dados_temporais[dados_temporais.length - 1]
                .percentual_conclusao -
                dados_temporais[0].percentual_conclusao) /
              dados_temporais.length
            ).toFixed(1),
            usuarios: (
              (dados_temporais[dados_temporais.length - 1].usuarios_ativos -
                dados_temporais[0].usuarios_ativos) /
              dados_temporais.length
            ).toFixed(1),
            lojas: (
              (dados_temporais[dados_temporais.length - 1].lojas_ativas -
                dados_temporais[0].lojas_ativas) /
              dados_temporais.length
            ).toFixed(1),
          }
        : null;

    res.json({
      periodo,
      dados_temporais,
      crescimento_medio,
      total_periodos: historico.length,
      primeira_data: dados_temporais[0]?.data,
      ultima_data: dados_temporais[dados_temporais.length - 1]?.data,
    });
  } catch (error) {
    console.error("Erro ao buscar tendências históricas:", error);
    res.status(500).json({
      erro: "Falha ao buscar tendências históricas",
      detalhes: error.message,
    });
  }
});

// ===== ROTAS DE CONTROLE E ADMINISTRAÇÃO =====

// Recalcular métricas manualmente
router.post("/recalcular", async (req, res) => {
  try {
    const { periodo = "mensal", data } = req.body;

    const dataRef = data ? new Date(data) : new Date();

    console.log(`🔄 Iniciando recálculo manual de métricas ${periodo}...`);

    const resultado = await metricsCalculationService.calcularTodasMetricas(
      periodo,
      dataRef,
    );

    res.json({
      mensagem: "Métricas recalculadas com sucesso",
      resultado,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Erro ao recalcular métricas:", error);
    res.status(500).json({
      erro: "Falha ao recalcular métricas",
      detalhes: error.message,
    });
  }
});

// Status das métricas
router.get("/status", async (req, res) => {
  try {
    const agora = new Date();
    const { dataInicio: inicioHoje } = obterPeriodo("diario", agora);
    const { dataInicio: inicioSemana } = obterPeriodo("semanal", agora);
    const { dataInicio: inicioMes } = obterPeriodo("mensal", agora);

    const [statusDiario, statusSemanal, statusMensal] = await Promise.all([
      MetricasGlobais.findOne({ periodo: "diario", dataInicio: inicioHoje }),
      MetricasGlobais.findOne({ periodo: "semanal", dataInicio: inicioSemana }),
      MetricasGlobais.findOne({ periodo: "mensal", dataInicio: inicioMes }),
    ]);

    res.json({
      timestamp: agora,
      status: {
        diario: {
          calculado: !!statusDiario,
          data_calculo: statusDiario?.ultimaAtualizacao,
          versao: statusDiario?.versaoCalculo,
        },
        semanal: {
          calculado: !!statusSemanal,
          data_calculo: statusSemanal?.ultimaAtualizacao,
          versao: statusSemanal?.versaoCalculo,
        },
        mensal: {
          calculado: !!statusMensal,
          data_calculo: statusMensal?.ultimaAtualizacao,
          versao: statusMensal?.versaoCalculo,
        },
      },
      recomendacoes: {
        precisa_calculo_diario: !statusDiario,
        precisa_calculo_semanal: !statusSemanal,
        precisa_calculo_mensal: !statusMensal,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar status das métricas:", error);
    res.status(500).json({
      erro: "Falha ao verificar status das métricas",
      detalhes: error.message,
    });
  }
});

// Obter métricas completas por locais (corredores) para o componente MetricasCorredor
router.get(
  "/loja-daily/locais-completas",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const { data = new Date().toISOString().split("T")[0] } = req.query;

      // Converter string para Date
      const dataEspecifica = new Date(data);

      // Ajustar para o início e fim do dia
      const dataInicio = new Date(dataEspecifica);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(dataEspecifica);
      dataFim.setHours(23, 59, 59, 999);

      // Buscar métricas diárias para a loja e data específica
      let metricas = await LojaDailyMetrics.findOne({
        loja: req.loja._id,
        dataInicio: { $gte: dataInicio, $lt: dataFim },
      }).populate("loja", "codigo nome regiao");

      // Se não encontrar para a data específica, buscar a mais recente
      if (!metricas) {
        console.log(
          `⚠️ Nenhuma métrica encontrada para ${data}, buscando mais recente...`,
        );

        metricas = await LojaDailyMetrics.findOne({
          loja: req.loja._id,
        })
          .sort({ dataInicio: -1 }) // Ordena pela data mais recente
          .populate("loja", "codigo nome regiao");

        if (!metricas) {
          return res.json({
            loja: req.loja.nome,
            data: dataEspecifica,
            mensagem: "Nenhuma métrica diária encontrada para esta loja",
            // Retornar estrutura vazia para manter compatibilidade com frontend
            etiquetas: { locaisLeitura: {}, resumo: {} },
            rupturas: { locaisLeitura: {}, resumo: {} },
            presencas: { locaisLeitura: {}, resumo: {} },
            totais: {},
          });
        }

        console.log(
          `✅ Usando dados de ${metricas.dataInicio.toISOString().split("T")[0]}`,
        );
      }

      // Função para enriquecer dados dos locais com informações específicas
      const enriquecerLocaisLeitura = (locaisLeitura, tipoAuditoria) => {
        const locaisEnriquecidos = {};

        for (const [local, dados] of Object.entries(locaisLeitura || {})) {
          // Calcular percentual baseado em itens válidos e lidos
          const percentual =
            dados.itensValidos > 0
              ? (dados.lidos / dados.itensValidos) * 100
              : 0;

          locaisEnriquecidos[local] = {
            ...dados,
            percentual: Math.round(percentual * 100) / 100, // Arredondar para 2 casas decimais
            // Manter a estrutura de usuários como está (objeto com nomes e quantidades)
            usuarios: dados.usuarios || {},
          };
        }

        return locaisEnriquecidos;
      };

      // Preparar resposta com estrutura otimizada para o componente MetricasCorredor
      const resposta = {
        loja: req.loja.nome,
        data: dataEspecifica,
        etiquetas: {
          locaisLeitura: enriquecerLocaisLeitura(
            metricas.etiquetas?.locaisLeitura,
            "etiquetas",
          ),
          resumo: {
            totalItens: metricas.etiquetas?.totalItens || 0,
            itensValidos: metricas.etiquetas?.itensValidos || 0,
            itensLidos: metricas.etiquetas?.itensValidos || 0,
            itensAtualizados: metricas.etiquetas?.itensAtualizados || 0,
            percentualConclusao: metricas.etiquetas?.percentualConclusao || 0,
            usuariosAtivos: metricas.etiquetas?.usuariosAtivos || 0,
          },
        },
        rupturas: {
          locaisLeitura: enriquecerLocaisLeitura(
            metricas.rupturas?.locaisLeitura,
            "rupturas",
          ),
          resumo: {
            totalItens: metricas.rupturas?.totalItens || 0,
            itensLidos: metricas.rupturas?.itensLidos || 0,
            percentualConclusao: metricas.rupturas?.percentualConclusao || 0,
            custoTotalRuptura: metricas.rupturas?.custoTotalRuptura || 0,
            usuariosAtivos: metricas.rupturas?.usuariosAtivos || 0,
          },
        },
        presencas: {
          locaisLeitura: enriquecerLocaisLeitura(
            metricas.presencas?.locaisLeitura,
            "presencas",
          ),
          resumo: {
            totalItens: metricas.presencas?.totalItens || 0,
            itensValidos: metricas.presencas?.itensValidos || 0,
            itensAtualizados: metricas.presencas?.itensAtualizados || 0,
            percentualConclusao: metricas.presencas?.percentualConclusao || 0,
            presencasConfirmadas: metricas.presencas?.presencasConfirmadas || 0,
            usuariosAtivos: metricas.presencas?.usuariosAtivos || 0,
          },
        },
        totais: {
          totalItens: metricas.totais?.totalItens || 0,
          itensLidos: metricas.totais?.itensLidos || 0,
          itensAtualizados: metricas.totais?.itensAtualizados || 0,
          percentualConclusaoGeral:
            metricas.totais?.percentualConclusaoGeral || 0,
          usuariosAtivos: metricas.totais?.usuariosAtivos || 0,
        },
      };

      console.log(
        `✅ Endpoint locais-completas: Retornando dados para ${
          Object.keys(resposta.etiquetas.locaisLeitura).length
        } locais`,
      );

      res.json(resposta);
    } catch (error) {
      console.error("❌ Erro ao buscar métricas completas por locais:", error);
      res.status(500).json({
        erro: "Falha ao buscar métricas completas por locais",
        detalhes: error.message,
      });
    }
  },
);

// Endpoint alternativo que retorna dados de exemplo caso não haja dados reais
router.get(
  "/loja-daily/locais-completas-demo",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const { data = new Date().toISOString().split("T")[0] } = req.query;

      // Dados de exemplo para demonstração
      const dadosExemplo = {
        loja: req.loja.nome,
        data: new Date(data),
        etiquetas: {
          locaisLeitura: {
            "G01A - G01A": {
              total: 150,
              itensValidos: 135,
              lidos: 120,
              percentual: 88.9,
              usuarios: {
                "João Silva": 45,
                "Maria Santos": 40,
                "Carlos Lima": 35,
              },
            },
            "G01B - G01B": {
              total: 120,
              itensValidos: 110,
              lidos: 95,
              percentual: 86.4,
              usuarios: {
                "Maria Santos": 50,
                "Ana Oliveira": 45,
              },
            },
            "G02A - G02A": {
              total: 180,
              itensValidos: 160,
              lidos: 140,
              percentual: 87.5,
              usuarios: {
                "Pedro Costa": 60,
                "Fernanda Rocha": 50,
                "Ricardo Alves": 30,
              },
            },
            "G02B - G02B": {
              total: 90,
              itensValidos: 85,
              lidos: 70,
              percentual: 82.4,
              usuarios: {
                "Carlos Lima": 40,
                "Juliana Costa": 30,
              },
            },
            "F01 - F01": {
              total: 75,
              itensValidos: 70,
              lidos: 65,
              percentual: 92.9,
              usuarios: {
                "Roberto Santos": 35,
                "Patrícia Nunes": 30,
              },
            },
            "FLV - FLV": {
              total: 60,
              itensValidos: 55,
              lidos: 50,
              percentual: 90.9,
              usuarios: {
                "Ana Oliveira": 30,
                "Marcos Oliveira": 20,
              },
            },
          },
          resumo: {
            totalItens: 675,
            itensValidos: 615,
            itensLidos: 540,
            itensAtualizados: 480,
            percentualConclusao: 87.8,
            usuariosAtivos: 8,
          },
        },
        rupturas: {
          locaisLeitura: {
            "G01A - G01A": {
              total: 150,
              itensValidos: 135,
              lidos: 125,
              percentual: 92.6,
              usuarios: {
                "João Silva": 50,
                "Maria Santos": 45,
                "Carlos Lima": 30,
              },
            },
            "G02A - G02A": {
              total: 180,
              itensValidos: 160,
              lidos: 145,
              percentual: 90.6,
              usuarios: {
                "Pedro Costa": 60,
                "Fernanda Rocha": 50,
                "Ricardo Alves": 35,
              },
            },
          },
          resumo: {
            totalItens: 330,
            itensLidos: 270,
            percentualConclusao: 81.8,
            custoTotalRuptura: 4252.5,
            usuariosAtivos: 6,
          },
        },
        presencas: {
          locaisLeitura: {
            "G01A - G01A": {
              total: 150,
              itensValidos: 135,
              lidos: 130,
              percentual: 96.3,
              usuarios: {
                "João Silva": 55,
                "Maria Santos": 45,
                "Carlos Lima": 30,
              },
            },
            "G02B - G02B": {
              total: 90,
              itensValidos: 85,
              lidos: 80,
              percentual: 94.1,
              usuarios: {
                "Carlos Lima": 45,
                "Juliana Costa": 35,
              },
            },
          },
          resumo: {
            totalItens: 240,
            itensValidos: 220,
            itensAtualizados: 210,
            percentualConclusao: 95.5,
            presencasConfirmadas: 205,
            usuariosAtivos: 5,
          },
        },
        totais: {
          totalItens: 1245,
          itensLidos: 1030,
          itensAtualizados: 900,
          percentualConclusaoGeral: 87.4,
          usuariosAtivos: 8,
        },
      };

      res.json(dadosExemplo);
    } catch (error) {
      console.error("Erro ao gerar dados de exemplo:", error);
      res.status(500).json({
        erro: "Falha ao gerar dados de exemplo",
        detalhes: error.message,
      });
    }
  },
);

// Obter métricas completas por classe de produto (TODAS as auditorias)
router.get(
  "/loja-daily/classes-completas",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const { data = new Date().toISOString().split("T")[0] } = req.query;

      // Converter string para Date
      const dataEspecifica = new Date(data);

      // Ajustar para o início e fim do dia
      const dataInicio = new Date(dataEspecifica);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(dataEspecifica);
      dataFim.setHours(23, 59, 59, 999);

      // Buscar métricas diárias para a loja e data específica
      let metricas = await LojaDailyMetrics.findOne({
        loja: req.loja._id,
        dataInicio: { $gte: dataInicio, $lt: dataFim },
      }).populate("loja", "codigo nome regiao");

      // Se não encontrar para a data específica, buscar a mais recente
      if (!metricas) {
        console.log(
          `⚠️ Nenhuma métrica encontrada para ${data}, buscando mais recente...`,
        );

        metricas = await LojaDailyMetrics.findOne({
          loja: req.loja._id,
        })
          .sort({ dataInicio: -1 }) // Ordena pela data mais recente
          .populate("loja", "codigo nome regiao");

        if (!metricas) {
          return res.json({
            loja: req.loja.nome,
            data: dataEspecifica,
            mensagem: "Nenhuma métrica diária encontrada para esta loja",
            etiquetas: { classesLeitura: {}, resumo: {} },
            rupturas: { classesLeitura: {}, resumo: {} },
            presencas: { classesLeitura: {}, resumo: {} },
            totais: {},
          });
        }

        console.log(
          `✅ Usando dados de ${metricas.dataInicio.toISOString().split("T")[0]}`,
        );
      }

      // Preparar resposta com TODAS as auditorias e suas classesLeitura
      const resposta = {
        loja: req.loja.nome,
        data: dataEspecifica,

        etiquetas: {
          classesLeitura: metricas.etiquetas?.classesLeitura || {},
          locaisLeitura: metricas.etiquetas?.locaisLeitura || {},
          resumo: {
            totalItens: metricas.etiquetas?.totalItens || 0,
            itensValidos: metricas.etiquetas?.itensValidos || 0,
            itensAtualizados: metricas.etiquetas?.itensAtualizados || 0,
            itensDesatualizado: metricas.etiquetas?.itensDesatualizado || 0,
            percentualConclusao: metricas.etiquetas?.percentualConclusao || 0,
            percentualDesatualizado:
              metricas.etiquetas?.percentualDesatualizado || 0,
          },
        },

        rupturas: {
          classesLeitura: metricas.rupturas?.classesLeitura || {},
          locaisLeitura: metricas.rupturas?.locaisLeitura || {},
          resumo: {
            totalItens: metricas.rupturas?.totalItens || 0,
            itensLidos: metricas.rupturas?.itensLidos || 0,
            percentualConclusao: metricas.rupturas?.percentualConclusao || 0,
            custoTotalRuptura: metricas.rupturas?.custoTotalRuptura || 0,
          },
        },

        presencas: {
          classesLeitura: metricas.presencas?.classesLeitura || {},
          locaisLeitura: metricas.presencas?.locaisLeitura || {},
          resumo: {
            totalItens: metricas.presencas?.totalItens || 0,
            itensValidos: metricas.presencas?.itensValidos || 0,
            itensAtualizados: metricas.presencas?.itensAtualizados || 0,
            percentualConclusao: metricas.presencas?.percentualConclusao || 0,
            presencasConfirmadas: metricas.presencas?.presencasConfirmadas || 0,
          },
        },

        totais: {
          totalItens: metricas.totais?.totalItens || 0,
          percentualConclusaoGeral:
            metricas.totais?.percentualConclusaoGeral || 0,
        },
      };

      console.log(
        `✅ Endpoint classes-completas: Retornando dados para loja ${req.loja.nome}`,
      );
      console.log(
        `   - Etiquetas: ${Object.keys(resposta.etiquetas.classesLeitura).length} classes, ${Object.keys(resposta.etiquetas.locaisLeitura).length} locais`,
      );
      console.log(
        `   - Rupturas: ${Object.keys(resposta.rupturas.classesLeitura).length} classes, ${Object.keys(resposta.rupturas.locaisLeitura).length} locais`,
      );
      console.log(
        `   - Presenças: ${Object.keys(resposta.presencas.classesLeitura).length} classes, ${Object.keys(resposta.presencas.locaisLeitura).length} locais`,
      );

      res.json(resposta);
    } catch (error) {
      console.error("❌ Erro ao buscar métricas completas por classes:", error);
      res.status(500).json({
        erro: "Falha ao buscar métricas completas por classes",
        detalhes: error.message,
      });
    }
  },
);

// ROTA DE DEBUG TEMPORÁRIA PARA FORÇAR RECÁLCULO
router.get("/force-recalc-today", async (req, res) => {
  try {
    const lojaCodigo = req.headers["x-loja"];
    if (!lojaCodigo) {
      return res.status(400).json({
        message:
          "Header 'x-loja' não fornecido. Por favor, selecione uma loja no frontend.",
      });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const regexLojaNome = new RegExp(`^Loja ${lojaCodigo} -`, "i");

    // Passo 1: Buscar os valores distintos de 'local' para diagnóstico
    console.log(
      `[DEBUG] Buscando valores distintos de 'local' para a loja ${lojaCodigo} em ${hoje.toISOString().split("T")[0]}`,
    );
    const distinctLocais = await Auditoria.distinct("local", {
      lojaNome: regexLojaNome,
      tipo: "etiqueta", // Filtrar por um tipo para ser mais rápido
      data: { $gte: hoje, $lt: amanha },
    });
    console.log(
      `[DEBUG] Valores distintos de 'local' encontrados:`,
      distinctLocais,
    );

    // Passo 2: Forçar o recálculo
    console.log(
      "🔄 [DEBUG] Forçando recálculo manual para o período 'diario'...",
    );
    const resultado = await metricsCalculationService.calcularTodasMetricas(
      "diario",
      new Date(),
    );
    console.log("✅ [DEBUG] Recálculo concluído com sucesso.");

    // Passo 3: Retornar o resultado do diagnóstico e do recálculo
    res.status(200).json({
      message: "Recálculo diário forçado com sucesso!",
      diagnostico_locais_encontrados: distinctLocais,
      resultado_calculo: resultado,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Erro ao forçar o recálculo:", error);
    res.status(500).json({
      message: "Erro ao forçar o recálculo.",
      error: error.message,
    });
  }
});

export default router;
