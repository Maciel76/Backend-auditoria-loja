import express from "express";
import MetricasUsuario from "../models/MetricasUsuario.js";
import MetricasLoja from "../models/MetricasLoja.js";
import MetricasAuditoria from "../models/MetricasAuditoria.js";
import MetricasGlobais from "../models/MetricasGlobais.js";
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
router.get("/usuarios/:usuarioId", verificarLojaObrigatoria, async (req, res) => {
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
      }).populate('loja', 'codigo nome regiao');

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
    .populate('loja', 'codigo nome regiao')
    .sort({ dataInicio: -1 })
    .limit(parseInt(limite));

    // Calcular tendências
    const tendencias = historico.length >= 2 ? {
      melhoriaTotal: historico[0]?.totais.percentualConclusaoGeral - historico[1]?.totais.percentualConclusaoGeral,
      melhoriaEtiquetas: historico[0]?.etiquetas.percentualConclusao - historico[1]?.etiquetas.percentualConclusao,
      melhoriaRupturas: historico[0]?.rupturas.percentualConclusao - historico[1]?.rupturas.percentualConclusao,
      melhoriaPresencas: historico[0]?.presencas.percentualConclusao - historico[1]?.presencas.percentualConclusao,
    } : null;

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
    console.error('Erro ao buscar métricas do usuário:', error);
    res.status(500).json({
      erro: "Falha ao buscar métricas do usuário",
      detalhes: error.message
    });
  }
});

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
    .populate('loja', 'codigo nome')
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
    console.error('Erro ao buscar ranking de usuários:', error);
    res.status(500).json({
      erro: "Falha ao buscar ranking de usuários",
      detalhes: error.message
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
      }).populate('loja', 'codigo nome regiao');

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
    .populate('loja', 'codigo nome regiao')
    .sort({ dataInicio: -1 })
    .limit(parseInt(limite));

    // Calcular tendências
    const tendencias = historico.length >= 2 ? {
      melhoriaTotal: historico[0]?.totais.percentualConclusaoGeral - historico[1]?.totais.percentualConclusaoGeral,
      melhoriaRanking: historico[1]?.ranking.posicaoGeral - historico[0]?.ranking.posicaoGeral, // Melhoria = posição menor
      crescimentoUsuarios: historico[0]?.totais.usuariosAtivos - historico[1]?.totais.usuariosAtivos,
      melhoriaEficiencia: historico[0]?.ranking.eficienciaOperacional - historico[1]?.ranking.eficienciaOperacional,
    } : null;

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
    console.error('Erro ao buscar métricas da loja:', error);
    res.status(500).json({
      erro: "Falha ao buscar métricas da loja",
      detalhes: error.message
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
      .populate('loja', 'codigo nome regiao')
      .sort({ "ranking.pontuacaoTotal": -1 })
      .limit(parseInt(limite));

    // Filtrar por região se especificado
    let rankingFiltrado = ranking;
    if (regiao && regiao !== 'todas') {
      rankingFiltrado = ranking.filter(loja => loja.loja.regiao === regiao);
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
      alertas: loja.alertas.filter(a => a.severidade === 'alta' || a.severidade === 'critica').length,
      ultimaAtualizacao: loja.ultimaAtualizacao,
    }));

    res.json({
      periodo,
      data: data ? new Date(data) : null,
      regiao: regiao || 'todas',
      ranking: rankingFormatado,
      totalLojas: rankingFormatado.length,
    });

  } catch (error) {
    console.error('Erro ao buscar ranking de lojas:', error);
    res.status(500).json({
      erro: "Falha ao buscar ranking de lojas",
      detalhes: error.message
    });
  }
});

// Comparar múltiplas lojas
router.post("/lojas/comparar", async (req, res) => {
  try {
    const { lojasCodigos, periodo = "mensal", data } = req.body;

    if (!lojasCodigos || !Array.isArray(lojasCodigos) || lojasCodigos.length < 2) {
      return res.status(400).json({
        erro: "É necessário fornecer pelo menos 2 códigos de lojas para comparação"
      });
    }

    // Buscar lojas pelos códigos
    const Loja = (await import("../models/Loja.js")).default;
    const lojas = await Loja.find({ codigo: { $in: lojasCodigos } });

    if (lojas.length !== lojasCodigos.length) {
      return res.status(404).json({
        erro: "Uma ou mais lojas não foram encontradas",
        lojasEncontradas: lojas.map(l => l.codigo),
        lojasNaoEncontradas: lojasCodigos.filter(c => !lojas.find(l => l.codigo === c)),
      });
    }

    let filtroData = {};
    if (data) {
      const dataEspecifica = new Date(data);
      const { dataInicio } = obterPeriodo(periodo, dataEspecifica);
      filtroData = { dataInicio: { $gte: dataInicio, $lte: dataInicio } };
    }

    // Buscar métricas das lojas
    const lojasIds = lojas.map(l => l._id);
    const metricas = await MetricasLoja.find({
      loja: { $in: lojasIds },
      periodo,
      ...filtroData,
    }).populate('loja', 'codigo nome regiao');

    // Organizar comparação
    const comparacao = lojasCodigos.map(codigo => {
      const loja = lojas.find(l => l.codigo === codigo);
      const metrica = metricas.find(m => m.loja._id.toString() === loja._id.toString());

      return {
        loja: {
          codigo: loja.codigo,
          nome: loja.nome,
          regiao: loja.regiao,
        },
        metricas: metrica ? {
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
        } : null,
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
          return atual.metricas.pontuacao > melhor.metricas.pontuacao ? atual : melhor;
        }),
        maior_crescimento: comparacao.reduce((maior, atual) => {
          if (!atual.metricas) return maior;
          if (!maior.metricas) return atual;
          return atual.metricas.usuariosAtivos > maior.metricas.usuariosAtivos ? atual : maior;
        }),
      },
    });

  } catch (error) {
    console.error('Erro ao comparar lojas:', error);
    res.status(500).json({
      erro: "Falha ao comparar lojas",
      detalhes: error.message
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
        erro: "Tipo de auditoria inválido. Use: etiqueta, ruptura ou presenca"
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
    console.error('Erro ao buscar métricas de auditoria:', error);
    res.status(500).json({
      erro: "Falha ao buscar métricas de auditoria",
      detalhes: error.message
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

    const comparacao = tipos.map(tipo => {
      const metrica = metricas.find(m => m.tipo === tipo);
      return {
        tipo,
        metricas: metrica ? {
          totalItens: metrica.totais.totalItens,
          percentualConclusao: metrica.totais.percentualConclusao,
          lojasAtivas: metrica.totais.lojasAtivas,
          usuariosAtivos: metrica.totais.usuariosAtivos,
          padroesCriticos: metrica.padroesCriticos.length,
          insights: metrica.insights.length,
          tendencia: metrica.tendencias.melhoriaQualidade,
        } : null,
      };
    });

    // Resumo comparativo
    const resumo = {
      tipo_mais_ativo: comparacao.reduce((maior, atual) => {
        if (!atual.metricas) return maior;
        if (!maior.metricas) return atual;
        return atual.metricas.totalItens > maior.metricas.totalItens ? atual : maior;
      }),
      melhor_performance: comparacao.reduce((melhor, atual) => {
        if (!atual.metricas) return melhor;
        if (!melhor.metricas) return atual;
        return atual.metricas.percentualConclusao > melhor.metricas.percentualConclusao ? atual : melhor;
      }),
      mais_problematico: comparacao.reduce((problematico, atual) => {
        if (!atual.metricas) return problematico;
        if (!problematico.metricas) return atual;
        return atual.metricas.padroesCriticos > problematico.metricas.padroesCriticos ? atual : problematico;
      }),
    };

    res.json({
      periodo,
      data: data ? new Date(data) : null,
      comparacao,
      resumo,
    });

  } catch (error) {
    console.error('Erro ao comparar tipos de auditoria:', error);
    res.status(500).json({
      erro: "Falha ao comparar tipos de auditoria",
      detalhes: error.message
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
    .populate('rankings.melhorLoja.loja', 'codigo nome regiao')
    .populate('rankings.melhorUsuario.loja', 'codigo nome')
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
    console.error('Erro ao buscar dashboard executivo:', error);
    res.status(500).json({
      erro: "Falha ao buscar dashboard executivo",
      detalhes: error.message
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
    const dados_temporais = historico.reverse().map(metrica => ({
      data: metrica.dataInicio,
      percentual_conclusao: metrica.resumoExecutivo.percentualConclusaoGeral,
      usuarios_ativos: metrica.resumoExecutivo.usuariosAtivos,
      lojas_ativas: metrica.resumoExecutivo.lojasAtivas,
      itens_processados: metrica.resumoExecutivo.totalItensProcessados,
      custo_ruptura: metrica.porTipoAuditoria.rupturas.custoTotalRuptura,
      indice_plataforma: metrica.indicadoresNegocio.indicePlataforma,
    }));

    // Calcular crescimento médio
    const crescimento_medio = dados_temporais.length >= 2 ? {
      conclusao: ((dados_temporais[dados_temporais.length - 1].percentual_conclusao - dados_temporais[0].percentual_conclusao) / dados_temporais.length).toFixed(1),
      usuarios: ((dados_temporais[dados_temporais.length - 1].usuarios_ativos - dados_temporais[0].usuarios_ativos) / dados_temporais.length).toFixed(1),
      lojas: ((dados_temporais[dados_temporais.length - 1].lojas_ativas - dados_temporais[0].lojas_ativas) / dados_temporais.length).toFixed(1),
    } : null;

    res.json({
      periodo,
      dados_temporais,
      crescimento_medio,
      total_periodos: historico.length,
      primeira_data: dados_temporais[0]?.data,
      ultima_data: dados_temporais[dados_temporais.length - 1]?.data,
    });

  } catch (error) {
    console.error('Erro ao buscar tendências históricas:', error);
    res.status(500).json({
      erro: "Falha ao buscar tendências históricas",
      detalhes: error.message
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

    const resultado = await metricsCalculationService.calcularTodasMetricas(periodo, dataRef);

    res.json({
      mensagem: "Métricas recalculadas com sucesso",
      resultado,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Erro ao recalcular métricas:', error);
    res.status(500).json({
      erro: "Falha ao recalcular métricas",
      detalhes: error.message
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
    console.error('Erro ao verificar status das métricas:', error);
    res.status(500).json({
      erro: "Falha ao verificar status das métricas",
      detalhes: error.message
    });
  }
});

export default router;