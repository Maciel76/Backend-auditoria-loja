import express from "express";
import MetricasUsuario from "../models/MetricasUsuario.js";
import MetricasLoja from "../models/MetricasLoja.js";
import MetricasAuditoria from "../models/MetricasAuditoria.js";
import MetricasGlobais from "../models/MetricasGlobais.js";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";
import Auditoria from "../models/Auditoria.js";
import Loja from "../models/Loja.js";
import User from "../models/User.js";
import metricsCalculationService from "../services/metricsCalculationService.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

// ===== ROTAS DE DEBUG PARA VERIFICAR MÉTRICAS =====

// Verificar se métricas estão sendo salvas
router.get("/verificar-metricas", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { periodo = "mensal" } = req.query;
    const agora = new Date();

    console.log(`🔍 Verificando métricas para loja ${req.loja.codigo}...`);

    // Contar registros em cada coleção de métricas
    const [
      totalMetricasUsuario,
      totalMetricasLoja,
      totalMetricasAuditoria,
      totalMetricasGlobais,
      totalAuditorias,
      ultimasMetricasUsuario,
      ultimasMetricasLoja,
    ] = await Promise.all([
      MetricasUsuario.countDocuments({ loja: req.loja._id }),
      MetricasLoja.countDocuments({ loja: req.loja._id }),
      MetricasAuditoria.countDocuments(),
      MetricasGlobais.countDocuments(),
      Auditoria.countDocuments({ loja: req.loja._id }),
      MetricasUsuario.find({ loja: req.loja._id }).sort({ ultimaAtualizacao: -1 }).limit(5),
      MetricasLoja.find({ loja: req.loja._id }).sort({ ultimaAtualizacao: -1 }).limit(3),
    ]);

    // Verificar últimas auditorias
    const ultimasAuditorias = await Auditoria.find({ loja: req.loja._id })
      .sort({ data: -1 })
      .limit(10)
      .select('usuarioId usuarioNome tipo data situacao');

    // Verificar se existem métricas para hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const metricasHoje = await Promise.all([
      MetricasUsuario.countDocuments({
        loja: req.loja._id,
        dataInicio: { $gte: hoje, $lt: amanha }
      }),
      MetricasLoja.countDocuments({
        loja: req.loja._id,
        dataInicio: { $gte: hoje, $lt: amanha }
      }),
    ]);

    // Status das coleções
    const status = {
      timestamp: agora,
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
      collections_status: {
        auditorias: {
          total: totalAuditorias,
          status: totalAuditorias > 0 ? "✅ Com dados" : "⚠️ Vazia",
        },
        metricas_usuario: {
          total: totalMetricasUsuario,
          hoje: metricasHoje[0],
          status: totalMetricasUsuario > 0 ? "✅ Com dados" : "⚠️ Vazia",
        },
        metricas_loja: {
          total: totalMetricasLoja,
          hoje: metricasHoje[1],
          status: totalMetricasLoja > 0 ? "✅ Com dados" : "⚠️ Vazia",
        },
        metricas_auditoria: {
          total: totalMetricasAuditoria,
          status: totalMetricasAuditoria > 0 ? "✅ Com dados" : "⚠️ Vazia",
        },
        metricas_globais: {
          total: totalMetricasGlobais,
          status: totalMetricasGlobais > 0 ? "✅ Com dados" : "⚠️ Vazia",
        },
      },
      ultimas_auditorias: ultimasAuditorias,
      ultimas_metricas_usuario: ultimasMetricasUsuario.map(m => ({
        usuarioId: m.usuarioId,
        usuarioNome: m.usuarioNome,
        periodo: m.periodo,
        dataInicio: m.dataInicio,
        totalItens: m.totais.totalItens,
        pontuacao: m.totais.pontuacaoTotal,
        ultimaAtualizacao: m.ultimaAtualizacao,
      })),
      ultimas_metricas_loja: ultimasMetricasLoja.map(m => ({
        periodo: m.periodo,
        dataInicio: m.dataInicio,
        totalItens: m.totais.totalItens,
        usuariosAtivos: m.totais.usuariosAtivos,
        pontuacao: m.ranking.pontuacaoTotal,
        ultimaAtualizacao: m.ultimaAtualizacao,
      })),
      recomendacoes: [],
    };

    // Adicionar recomendações
    if (totalAuditorias > 0 && totalMetricasUsuario === 0) {
      status.recomendacoes.push("🔄 Execute o cálculo de métricas manualmente");
    }
    if (totalAuditorias === 0) {
      status.recomendacoes.push("📋 Faça upload de uma planilha para testar");
    }
    if (metricasHoje[0] === 0 && totalAuditorias > 0) {
      status.recomendacoes.push("⏰ Métricas do dia não foram calculadas");
    }

    res.json(status);

  } catch (error) {
    console.error('❌ Erro ao verificar métricas:', error);
    res.status(500).json({
      erro: "Falha ao verificar métricas",
      detalhes: error.message
    });
  }
});

// Forçar cálculo de métricas para debug
router.post("/calcular-agora", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { periodo = "mensal", data } = req.body;
    const dataRef = data ? new Date(data) : new Date();

    console.log(`🔄 Forçando cálculo de métricas ${periodo} para loja ${req.loja.codigo}...`);

    const inicio = Date.now();

    const resultado = await metricsCalculationService.calcularTodasMetricas(periodo, dataRef);

    const tempoDecorrido = Date.now() - inicio;

    // Verificar o que foi criado
    const verificacao = await Promise.all([
      MetricasUsuario.countDocuments({
        loja: req.loja._id,
        periodo: "periodo_completo", // MetricasUsuario sempre usa periodo_completo
      }),
      MetricasLoja.countDocuments({
        loja: req.loja._id,
        periodo: resultado.periodo || periodo,
        dataInicio: resultado.dataInicio
      }),
      MetricasAuditoria.countDocuments({
        periodo: resultado.periodo || periodo,
        dataInicio: resultado.dataInicio
      }),
      MetricasGlobais.countDocuments({
        periodo: resultado.periodo || periodo,
        dataInicio: resultado.dataInicio
      }),
    ]);

    res.json({
      mensagem: "Cálculo de métricas executado com sucesso",
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
      periodo,
      data_referencia: dataRef,
      tempo_processamento: `${tempoDecorrido}ms`,
      resultado: {
        ...resultado,
        metricas_criadas: {
          usuarios: verificacao[0],
          loja: verificacao[1],
          auditorias: verificacao[2],
          globais: verificacao[3],
        },
      },
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('❌ Erro ao calcular métricas:', error);
    res.status(500).json({
      erro: "Falha ao calcular métricas",
      detalhes: error.message
    });
  }
});

// Limpar todas as métricas (apenas para debug)
router.delete("/limpar-metricas", async (req, res) => {
  try {
    const { confirmar } = req.body;

    if (confirmar !== "SIM_LIMPAR_TUDO") {
      return res.status(400).json({
        erro: "Confirmação necessária",
        instrucoes: "Envie { 'confirmar': 'SIM_LIMPAR_TUDO' } para limpar todas as métricas"
      });
    }

    console.log('🗑️ Limpando todas as métricas...');

    const resultado = await Promise.all([
      MetricasUsuario.deleteMany({}),
      MetricasLoja.deleteMany({}),
      MetricasAuditoria.deleteMany({}),
      MetricasGlobais.deleteMany({}),
    ]);

    res.json({
      mensagem: "Todas as métricas foram removidas",
      removidos: {
        usuarios: resultado[0].deletedCount,
        lojas: resultado[1].deletedCount,
        auditorias: resultado[2].deletedCount,
        globais: resultado[3].deletedCount,
      },
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('❌ Erro ao limpar métricas:', error);
    res.status(500).json({
      erro: "Falha ao limpar métricas",
      detalhes: error.message
    });
  }
});

// Estatísticas detalhadas por coleção
router.get("/estatisticas-detalhadas", verificarLojaObrigatoria, async (req, res) => {
  try {
    // Estatísticas de auditorias raw
    const statsAuditorias = await Auditoria.aggregate([
      { $match: { loja: req.loja._id } },
      {
        $group: {
          _id: "$tipo",
          total: { $sum: 1 },
          atualizados: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] }
          },
          ultimaData: { $max: "$data" },
        }
      }
    ]);

    // Estatísticas de usuários únicos
    const usuariosUnicos = await Auditoria.distinct("usuarioId", { loja: req.loja._id });

    // Estatísticas de métricas por período
    const metricasPorPeriodo = await Promise.all([
      MetricasUsuario.aggregate([
        { $match: { loja: req.loja._id } },
        { $group: { _id: "$periodo", total: { $sum: 1 } } }
      ]),
      MetricasLoja.aggregate([
        { $match: { loja: req.loja._id } },
        { $group: { _id: "$periodo", total: { $sum: 1 } } }
      ]),
    ]);

    // Top usuários por pontuação
    const topUsuarios = await MetricasUsuario.find({ loja: req.loja._id })
      .sort({ "totais.pontuacaoTotal": -1 })
      .limit(10)
      .select('usuarioId usuarioNome totais.pontuacaoTotal periodo dataInicio');

    res.json({
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
      auditorias_raw: {
        por_tipo: statsAuditorias,
        usuarios_unicos: usuariosUnicos.length,
        total_geral: statsAuditorias.reduce((sum, stat) => sum + stat.total, 0),
      },
      metricas_consolidadas: {
        usuarios_por_periodo: metricasPorPeriodo[0],
        loja_por_periodo: metricasPorPeriodo[1],
      },
      top_usuarios: topUsuarios,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas detalhadas:', error);
    res.status(500).json({
      erro: "Falha ao obter estatísticas detalhadas",
      detalhes: error.message
    });
  }
});

// Testar se o serviço de métricas está funcionando
router.get("/testar-servico", async (req, res) => {
  try {
    console.log('🧪 Testando serviço de métricas...');

    // Testar se o serviço está disponível
    const serviceAvailable = metricsCalculationService && typeof metricsCalculationService.calcularTodasMetricas === 'function';

    // Testar método obterPeriodo
    let periodoTest = null;
    try {
      periodoTest = metricsCalculationService.obterPeriodo("mensal", new Date());
    } catch (err) {
      periodoTest = { error: err.message };
    }

    // Verificar se existem dados para processar
    const totalAuditorias = await Auditoria.countDocuments();
    const totalUsuarios = await User.countDocuments();
    const totalLojas = await Loja.countDocuments();

    res.json({
      servico_metricas: {
        disponivel: serviceAvailable,
        tipo: typeof metricsCalculationService,
        metodo_calcular: typeof metricsCalculationService?.calcularTodasMetricas,
        metodo_obter_periodo: typeof metricsCalculationService?.obterPeriodo,
        teste_periodo: periodoTest,
      },
      dados_para_processar: {
        auditorias: totalAuditorias,
        usuarios: totalUsuarios,
        lojas: totalLojas,
        suficiente_para_calcular: totalAuditorias > 0 && totalLojas > 0,
      },
      status: serviceAvailable ? '✅ Serviço OK' : '❌ Serviço com problema',
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('❌ Erro ao testar serviço:', error);
    res.status(500).json({
      erro: "Falha ao testar serviço",
      detalhes: error.message,
      stack: error.stack,
    });
  }
});

// Testar conectividade com todas as coleções
router.get("/testar-conexoes", async (req, res) => {
  try {
    console.log('🔌 Testando conexões com todas as coleções...');

    const testes = await Promise.allSettled([
      Auditoria.findOne().limit(1),
      MetricasUsuario.findOne().limit(1),
      MetricasLoja.findOne().limit(1),
      MetricasAuditoria.findOne().limit(1),
      MetricasGlobais.findOne().limit(1),
      Loja.findOne().limit(1),
      User.findOne().limit(1),
    ]);

    const resultados = {
      auditoria: testes[0].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[0].reason}`,
      metricas_usuario: testes[1].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[1].reason}`,
      metricas_loja: testes[2].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[2].reason}`,
      metricas_auditoria: testes[3].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[3].reason}`,
      metricas_globais: testes[4].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[4].reason}`,
      loja: testes[5].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[5].reason}`,
      user: testes[6].status === 'fulfilled' ? '✅ OK' : `❌ ${testes[6].reason}`,
    };

    const todosOk = Object.values(resultados).every(r => r.includes('✅'));

    res.json({
      status_geral: todosOk ? '✅ Todas as conexões OK' : '⚠️ Algumas conexões com problema',
      conexoes: resultados,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('❌ Erro ao testar conexões:', error);
    res.status(500).json({
      erro: "Falha ao testar conexões",
      detalhes: error.message
    });
  }
});

// Testar novos campos de métricas de usuário
router.get("/testar-novos-campos", verificarLojaObrigatoria, async (req, res) => {
  try {
    console.log('🧪 Testando novos campos de métricas de usuário...');

    // Buscar algumas métricas de usuário da loja
    const metricasUsuarios = await MetricasUsuario.find({ loja: req.loja._id })
      .sort({ ultimaAtualizacao: -1 })
      .limit(5)
      .select('usuarioId usuarioNome contadoresAuditorias totaisAcumulados historicoRanking totais ranking');

    const resultado = {
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
      novos_campos_testados: {
        contadoresAuditorias: "Quantidade de auditorias por tipo",
        totaisAcumulados: "Totais históricos de itens lidos",
        historicoRanking: "Contador de posições no ranking (1º-10º)"
      },
      exemplos_usuarios: metricasUsuarios.map(m => ({
        usuarioId: m.usuarioId,
        usuarioNome: m.usuarioNome,

        // Contadores de auditorias
        auditorias_feitas: {
          etiquetas: m.contadoresAuditorias?.totalEtiquetas || 0,
          rupturas: m.contadoresAuditorias?.totalRupturas || 0,
          presencas: m.contadoresAuditorias?.totalPresencas || 0,
          total_geral: m.contadoresAuditorias?.totalGeral || 0
        },

        // Totais acumulados históricos
        itens_lidos_historico: {
          etiquetas: m.totaisAcumulados?.itensLidosEtiquetas || 0,
          rupturas: m.totaisAcumulados?.itensLidosRupturas || 0,
          presencas: m.totaisAcumulados?.itensLidosPresencas || 0,
          total: m.totaisAcumulados?.itensLidosTotal || 0
        },

        // Histórico de ranking
        ranking_historico: {
          posicao_atual: m.ranking?.posicaoLoja || "Não classificado",
          melhor_posicao: m.historicoRanking?.melhorPosicao || "Nunca no top 10",
          vezes_em_1o: m.historicoRanking?.posicao1 || 0,
          vezes_em_2o: m.historicoRanking?.posicao2 || 0,
          vezes_em_3o: m.historicoRanking?.posicao3 || 0,
          total_top10: m.historicoRanking?.totalTop10 || 0
        },

        // Métricas atuais para comparação
        metricas_periodo_atual: {
          total_itens: m.totais?.totalItens || 0,
          itens_lidos: m.totais?.itensLidos || 0,
          pontuacao: m.totais?.pontuacaoTotal || 0
        }
      })),

      estatisticas_gerais: {
        usuarios_com_dados: metricasUsuarios.length,
        usuarios_com_contadores: metricasUsuarios.filter(m => m.contadoresAuditorias?.totalGeral > 0).length,
        usuarios_com_historico: metricasUsuarios.filter(m => m.totaisAcumulados?.itensLidosTotal > 0).length,
        usuarios_ja_no_ranking: metricasUsuarios.filter(m => m.historicoRanking?.totalTop10 > 0).length
      },

      timestamp: new Date(),
    };

    res.json(resultado);

  } catch (error) {
    console.error('❌ Erro ao testar novos campos:', error);
    res.status(500).json({
      erro: "Falha ao testar novos campos",
      detalhes: error.message
    });
  }
});

// Ranking de lojas usando LojaDailyMetrics - rota simples para acessar os dados
router.get("/lojas-daily-ranking", async (req, res) => {
  try {
    const { limite = 50, regiao } = req.query;

    // Buscar todas as lojas com métricas diárias
    const ranking = await LojaDailyMetrics.find({})
      .populate("loja", "codigo nome cidade regiao")
      .sort({ "ranking.pontuacaoTotal": -1 })
      .limit(parseInt(limite));

    // Filtrar por região se especificado
    let rankingFiltrado = ranking;
    if (regiao && regiao !== 'todas') {
      rankingFiltrado = ranking.filter(loja => loja.loja?.regiao === regiao);
    }

    const rankingFormatado = rankingFiltrado.map((item, index) => ({
      posicao: index + 1,
      loja: {
        codigo: item.loja?.codigo || 'N/A',
        nome: item.loja?.nome || 'N/A',
        cidade: item.loja?.cidade || 'N/A',
        regiao: item.loja?.regiao || 'N/A',
      },
      pontuacao: item.ranking?.pontuacaoTotal || 0,
      notaQualidade: item.ranking?.notaQualidade || 0,
      eficienciaOperacional: item.ranking?.eficienciaOperacional || 0,

      // Totais consolidados
      totalItens: item.totais?.totalItens || 0,
      percentualConclusao: item.totais?.percentualConclusaoGeral || 0,
      usuariosAtivos: item.totais?.usuariosAtivos || 0,

      // Dados por tipo - direto do modelo
      etiquetas: item.etiquetas || {},
      rupturas: item.rupturas || {},
      presencas: item.presencas || {},

      // Outros dados
      alertas: item.alertas?.length || 0,
      locaisComProblemas: item.locaisEstatisticas?.filter(l =>
        l.prioridadeAtencao === 'alta' || l.prioridadeAtencao === 'critica'
      ).length || 0,
      ultimaAtualizacao: item.ultimaAtualizacao,
    }));

    res.json({
      regiao: regiao || 'todas',
      ranking: rankingFormatado,
      totalLojas: rankingFormatado.length,
      resumo: {
        melhorLoja: rankingFormatado[0] || null,
        mediaItens: rankingFormatado.length > 0 ? Math.round(rankingFormatado.reduce((acc, l) => acc + l.totalItens, 0) / rankingFormatado.length) : 0,
        mediaEficiencia: rankingFormatado.length > 0 ? Math.round(rankingFormatado.reduce((acc, l) => acc + l.percentualConclusao, 0) / rankingFormatado.length) : 0,
        totalUsuariosAtivos: rankingFormatado.reduce((acc, l) => acc + l.usuariosAtivos, 0),
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ranking LojaDailyMetrics:', error);
    res.status(500).json({
      erro: "Falha ao buscar ranking de lojas diárias",
      detalhes: error.message
    });
  }
});

export default router;