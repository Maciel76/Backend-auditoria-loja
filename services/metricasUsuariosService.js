// services/metricasUsuariosService.js
import MetricasUsuario from "../models/MetricasUsuario.js";
import Auditoria from "../models/Auditoria.js";
import Loja from "../models/Loja.js";

class MetricasUsuariosService {
  constructor() {
    this.versaoCalculo = "3.0";
  }

  /**
   * Calcula e atualiza as métricas de todos os usuários (período completo)
   * Este método busca TODAS as auditorias e calcula métricas acumuladas
   */
  async calcularMetricasUsuarios(dataInicio = null, dataFim = null) {
    try {
      console.log(`📊 [MetricasUsuarios] Calculando métricas de usuários...`);

      // Buscar TODAS as auditorias para cálculo de período completo
      const auditorias = await Auditoria.find({}).populate('loja', 'codigo nome regiao');

      if (auditorias.length === 0) {
        console.log(`⚠️ [MetricasUsuarios] Nenhuma auditoria encontrada`);
        return { success: true, totalUsuarios: 0 };
      }

      console.log(`📦 [MetricasUsuarios] Processando ${auditorias.length} auditorias`);

      // Calcular totais por loja para cada tipo de auditoria (para percentuais)
      const totaisPorLoja = this.calcularTotaisPorLoja(auditorias);

      // Agrupar auditorias por usuário e loja
      const usuariosMap = this.agruparPorUsuarioELoja(auditorias);

      console.log(`👥 [MetricasUsuarios] ${usuariosMap.size} usuários encontrados`);

      // Determinar datas padrão se não fornecidas
      const dataInicioFinal = dataInicio || new Date(Math.min(...auditorias.map(a => a.data)));
      const dataFimFinal = dataFim || new Date();

      // Processar cada usuário
      let salvosComSucesso = 0;
      for (const [chave, dados] of usuariosMap) {
        try {
          await this.salvarMetricasUsuario(dados, totaisPorLoja, dataInicioFinal, dataFimFinal);
          salvosComSucesso++;
        } catch (error) {
          console.error(`❌ [MetricasUsuarios] Erro ao salvar ${dados.usuarioNome}:`, error.message);
        }
      }

      // Atualizar rankings após salvar todas as métricas
      await this.atualizarRankings();

      console.log(`✅ [MetricasUsuarios] ${salvosComSucesso}/${usuariosMap.size} usuários processados`);

      return {
        success: true,
        totalUsuarios: salvosComSucesso,
        totalAuditorias: auditorias.length
      };

    } catch (error) {
      console.error(`❌ [MetricasUsuarios] Erro ao calcular métricas:`, error);
      throw error;
    }
  }

  /**
   * Calcula totais por loja para cada tipo de auditoria
   */
  calcularTotaisPorLoja(auditorias) {
    const totaisPorLoja = {};

    for (const auditoria of auditorias) {
      const lojaId = auditoria.loja._id.toString();

      if (!totaisPorLoja[lojaId]) {
        totaisPorLoja[lojaId] = {
          etiquetas: { itensLidos: 0 },
          rupturas: { itensLidos: 0 },
          presencas: { itensLidos: 0 }
        };
      }

      // Contar itens lidos por tipo para cada loja
      if (auditoria.situacao && auditoria.situacao !== "Não lido") {
        if (auditoria.tipo === "etiqueta") {
          totaisPorLoja[lojaId].etiquetas.itensLidos++;
        } else if (auditoria.tipo === "ruptura") {
          totaisPorLoja[lojaId].rupturas.itensLidos++;
        } else if (auditoria.tipo === "presenca") {
          totaisPorLoja[lojaId].presencas.itensLidos++;
        }
      }
    }

    return totaisPorLoja;
  }

  /**
   * Agrupa auditorias por usuário e loja
   */
  agruparPorUsuarioELoja(auditorias) {
    const usuariosMap = new Map();

    for (const auditoria of auditorias) {
      const chaveUsuario = `${auditoria.usuarioId}_${auditoria.loja._id}`;

      if (!usuariosMap.has(chaveUsuario)) {
        usuariosMap.set(chaveUsuario, {
          usuarioId: auditoria.usuarioId,
          usuarioNome: auditoria.usuarioNome,
          loja: auditoria.loja,
          etiquetas: this.criarMetricasVazias(),
          rupturas: this.criarMetricasVazias('ruptura'),
          presencas: this.criarMetricasVazias('presenca'),
          ContadorClassesProduto: new Map(),
          ContadorLocais: new Map(),
        });
      }

      const dadosUsuario = usuariosMap.get(chaveUsuario);

      // Processar por tipo de auditoria
      this.processarAuditoria(auditoria, dadosUsuario);

      // Contar classes de produto
      this.contarClasseProduto(auditoria, dadosUsuario);

      // Contar locais
      this.contarLocal(auditoria, dadosUsuario);
    }

    return usuariosMap;
  }

  /**
   * Cria estrutura vazia de métricas
   */
  criarMetricasVazias(tipo = null) {
    const base = {
      totalItens: 0,
      itensLidos: 0,
      itensAtualizados: 0,
      itensDesatualizado: 0,
      itensSemEstoque: 0,
      itensNaopertence: 0,
      percentualConclusao: 0
    };

    if (tipo === 'ruptura') {
      return { ...base, custoTotal: 0, custoTotalRuptura: 0, custoMedioRuptura: 0 };
    }

    if (tipo === 'presenca') {
      return { ...base, presencasConfirmadas: 0, percentualPresenca: 0 };
    }

    return base;
  }

  /**
   * Processa uma auditoria e atualiza os dados do usuário
   */
  processarAuditoria(auditoria, dadosUsuario) {
    let metricas;

    // Selecionar métricas baseado no tipo
    if (auditoria.tipo === "etiqueta") {
      metricas = dadosUsuario.etiquetas;
    } else if (auditoria.tipo === "ruptura") {
      metricas = dadosUsuario.rupturas;
    } else if (auditoria.tipo === "presenca") {
      metricas = dadosUsuario.presencas;
    } else {
      return; // Tipo desconhecido
    }

    // Incrementar total
    metricas.totalItens++;

    // Contar itens lidos
    if (auditoria.situacao && auditoria.situacao !== "Não lido") {
      metricas.itensLidos++;
    }

    // Contar por situação específica
    switch (auditoria.situacao) {
      case "Atualizado":
        metricas.itensAtualizados++;
        break;
      case "Desatualizado":
        metricas.itensDesatualizado++;
        break;
      case "Sem estoque":
        metricas.itensSemEstoque++;
        break;
      case "Não pertence":
        metricas.itensNaopertence++;
        break;
    }

    // Campos específicos por tipo
    if (auditoria.tipo === "ruptura" && auditoria.custoRuptura) {
      metricas.custoTotal += auditoria.custoRuptura;
    }

    if (auditoria.tipo === "presenca" && auditoria.presenca) {
      metricas.presencasConfirmadas++;
    }
  }

  /**
   * Conta classe de produto
   */
  contarClasseProduto(auditoria, dadosUsuario) {
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;

    if (classe) {
      const classeNormalizada = classe.toUpperCase().trim();
      dadosUsuario.ContadorClassesProduto.set(
        classeNormalizada,
        (dadosUsuario.ContadorClassesProduto.get(classeNormalizada) || 0) + 1
      );
    }
  }

  /**
   * Conta local
   */
  contarLocal(auditoria, dadosUsuario) {
    if (auditoria.local) {
      const localNormalizado = auditoria.local.trim();
      dadosUsuario.ContadorLocais.set(
        localNormalizado,
        (dadosUsuario.ContadorLocais.get(localNormalizado) || 0) + 1
      );
    }
  }

  /**
   * Salva as métricas de um usuário no banco
   */
  async salvarMetricasUsuario(dados, totaisPorLoja, dataInicio, dataFim) {
    const lojaId = dados.loja._id.toString();
    const totaisDaLoja = totaisPorLoja[lojaId] || {
      etiquetas: { itensLidos: 1 },
      rupturas: { itensLidos: 1 },
      presencas: { itensLidos: 1 }
    };

    // Calcular percentuais em relação ao total da loja
    const etiquetas = {
      ...dados.etiquetas,
      percentualConclusao: totaisDaLoja.etiquetas.itensLidos > 0
        ? Math.round((dados.etiquetas.itensLidos / totaisDaLoja.etiquetas.itensLidos) * 100)
        : 0,
    };

    const rupturas = {
      ...dados.rupturas,
      percentualConclusao: totaisDaLoja.rupturas.itensLidos > 0
        ? Math.round((dados.rupturas.itensLidos / totaisDaLoja.rupturas.itensLidos) * 100)
        : 0,
      custoTotalRuptura: dados.rupturas.custoTotal,
      custoMedioRuptura: dados.rupturas.totalItens > 0
        ? dados.rupturas.custoTotal / dados.rupturas.totalItens
        : 0,
    };

    const presencas = {
      ...dados.presencas,
      percentualConclusao: totaisDaLoja.presencas.itensLidos > 0
        ? Math.round((dados.presencas.itensLidos / totaisDaLoja.presencas.itensLidos) * 100)
        : 0,
      percentualPresenca: dados.presencas.totalItens > 0
        ? Math.round((dados.presencas.presencasConfirmadas / dados.presencas.totalItens) * 100)
        : 0,
    };

    // Buscar ou criar métricas do usuário - CORRIGIDO: busca única por loja e usuário
    let metricasUsuario = await MetricasUsuario.findOne({
      loja: dados.loja._id,
      usuarioId: dados.usuarioId,
      periodo: "periodo_completo",
    });

    if (!metricasUsuario) {
      console.log(`📝 [MetricasUsuarios] Criando novo registro para ${dados.usuarioNome}`);
      metricasUsuario = new MetricasUsuario({
        loja: dados.loja._id,
        usuarioId: dados.usuarioId,
        usuarioNome: dados.usuarioNome,
        lojaNome: dados.loja.nome,
        periodo: "periodo_completo",
        dataInicio,
        dataFim,
        versaoCalculo: this.versaoCalculo,
      });
    } else {
      console.log(`🔄 [MetricasUsuarios] Atualizando ${dados.usuarioNome}`);
      // Atualizar campos básicos
      metricasUsuario.usuarioNome = dados.usuarioNome;
      metricasUsuario.lojaNome = dados.loja.nome;
      metricasUsuario.dataFim = dataFim;

      // Atualizar dataInicio apenas se a nova for anterior
      if (!metricasUsuario.dataInicio || dataInicio < metricasUsuario.dataInicio) {
        metricasUsuario.dataInicio = dataInicio;
      }
    }

    // Atualizar métricas principais
    metricasUsuario.etiquetas = etiquetas;
    metricasUsuario.rupturas = rupturas;
    metricasUsuario.presencas = presencas;

    // Atualizar contadores
    metricasUsuario.ContadorClassesProduto = Object.fromEntries(dados.ContadorClassesProduto);
    metricasUsuario.ContadorLocais = Object.fromEntries(dados.ContadorLocais);

    // Calcular contadores de auditorias
    const contadores = await this.calcularContadoresAuditorias(dados.loja._id, dados.usuarioId);
    metricasUsuario.contadoresAuditorias = contadores;

    // Calcular totais acumulados
    const totaisAcumulados = this.calcularTotaisAcumulados(dados);
    metricasUsuario.totaisAcumulados = totaisAcumulados;

    // Calcular tendências
    const tendencias = await this.calcularTendencias(dados.loja._id, dados.usuarioId, dados);
    metricasUsuario.tendencias = tendencias;

    // Calcular totais e pontuação (também calcula achievements)
    metricasUsuario.atualizarTotais();

    // Salvar no banco
    await metricasUsuario.save();

    console.log(`✅ [MetricasUsuarios] ${dados.usuarioNome}: ${totaisAcumulados.itensLidosTotal} itens lidos`);
  }

  /**
   * Calcula contadores de auditorias por tipo
   */
  async calcularContadoresAuditorias(lojaId, usuarioId) {
    const auditoriasPorTipo = await Auditoria.aggregate([
      {
        $match: {
          loja: lojaId,
          usuarioId: usuarioId,
        },
      },
      {
        $group: {
          _id: {
            tipo: "$tipo",
            data: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.tipo",
          auditorias: { $sum: 1 }, // Conta dias únicos que fez cada tipo
        },
      },
    ]);

    const contadores = {
      totalEtiquetas: 0,
      totalRupturas: 0,
      totalPresencas: 0,
      totalGeral: 0,
    };

    auditoriasPorTipo.forEach((item) => {
      if (item._id === "etiqueta") contadores.totalEtiquetas = item.auditorias;
      if (item._id === "ruptura") contadores.totalRupturas = item.auditorias;
      if (item._id === "presenca") contadores.totalPresencas = item.auditorias;
    });

    contadores.totalGeral =
      contadores.totalEtiquetas +
      contadores.totalRupturas +
      contadores.totalPresencas;

    return contadores;
  }

  /**
   * Calcula totais acumulados
   */
  calcularTotaisAcumulados(dados) {
    return {
      itensLidosEtiquetas: dados.etiquetas.itensLidos,
      itensLidosRupturas: dados.rupturas.itensLidos,
      itensLidosPresencas: dados.presencas.itensLidos,
      itensLidosTotal:
        dados.etiquetas.itensLidos +
        dados.rupturas.itensLidos +
        dados.presencas.itensLidos,
    };
  }

  /**
   * Calcula tendências e análise temporal
   */
  async calcularTendencias(lojaId, usuarioId, dados) {
    // Calcular diasAtivos - dias únicos que o usuário fez auditoria
    const diasUnicos = await Auditoria.aggregate([
      {
        $match: {
          loja: lojaId,
          usuarioId: usuarioId,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
        },
      },
    ]);

    const diasAtivos = diasUnicos.length;
    const totalItensLidos =
      dados.etiquetas.itensLidos +
      dados.rupturas.itensLidos +
      dados.presencas.itensLidos;

    const mediaItensPerDia = diasAtivos > 0
      ? Math.round(totalItensLidos / diasAtivos)
      : 0;

    // Regularidade (0-100) baseada na frequência
    const regularidade = Math.min(100, diasAtivos * 2);

    return {
      melhoriaPercentual: 0, // Será calculado comparando com período anterior
      diasAtivos,
      mediaItensPerDia,
      regularidade,
    };
  }

  /**
   * Atualiza rankings de todos os usuários
   */
  async atualizarRankings() {
    try {
      console.log(`🏆 [MetricasUsuarios] Atualizando rankings...`);

      // Buscar todas as lojas
      const lojas = await Loja.find({ ativa: true });

      for (const loja of lojas) {
        // Ranking por loja
        const metricasLoja = await MetricasUsuario.find({
          loja: loja._id,
          periodo: "periodo_completo"
        }).sort({ "totais.pontuacaoTotal": -1 });

        // Atualizar posição na loja
        for (let i = 0; i < metricasLoja.length; i++) {
          metricasLoja[i].ranking.posicaoLoja = i + 1;
          await metricasLoja[i].save();
        }
      }

      // Ranking geral (todas as lojas)
      const todasMetricas = await MetricasUsuario.find({
        periodo: "periodo_completo"
      }).sort({ "totais.pontuacaoTotal": -1 });

      for (let i = 0; i < todasMetricas.length; i++) {
        todasMetricas[i].ranking.posicaoGeral = i + 1;

        // Atualizar histórico de ranking
        const posicao = i + 1;
        if (posicao <= 10) {
          const campo = `posicao${posicao}`;
          todasMetricas[i].historicoRanking[campo] =
            (todasMetricas[i].historicoRanking[campo] || 0) + 1;
        } else {
          todasMetricas[i].historicoRanking.ACIMA10 =
            (todasMetricas[i].historicoRanking.ACIMA10 || 0) + 1;
        }

        // Atualizar melhor posição
        if (!todasMetricas[i].historicoRanking.melhorPosicao ||
            posicao < todasMetricas[i].historicoRanking.melhorPosicao) {
          todasMetricas[i].historicoRanking.melhorPosicao = posicao;
        }

        await todasMetricas[i].save();
      }

      console.log(`✅ [MetricasUsuarios] Rankings atualizados`);
    } catch (error) {
      console.error(`❌ [MetricasUsuarios] Erro ao atualizar rankings:`, error);
      throw error;
    }
  }

  /**
   * Obtém métricas de um usuário específico
   */
  async obterMetricasUsuario(lojaId, usuarioId) {
    try {
      const metricas = await MetricasUsuario.findOne({
        loja: lojaId,
        usuarioId: usuarioId,
        periodo: "periodo_completo"
      }).populate('loja', 'nome codigo endereco imagem');

      return metricas;
    } catch (error) {
      console.error(`❌ [MetricasUsuarios] Erro ao obter métricas:`, error);
      throw error;
    }
  }

  /**
   * Obtém métricas de todos os usuários de uma loja
   */
  async obterMetricasLoja(lojaId, filtros = {}) {
    try {
      const query = {
        loja: lojaId,
        periodo: "periodo_completo"
      };

      // Aplicar filtros adicionais se fornecidos
      if (filtros.dataInicio) {
        query.dataInicio = { $gte: new Date(filtros.dataInicio) };
      }
      if (filtros.dataFim) {
        query.dataFim = { $lte: new Date(filtros.dataFim) };
      }

      const metricas = await MetricasUsuario.find(query)
        .populate('loja', 'nome codigo endereco imagem')
        .sort({ 'totaisAcumulados.itensLidosTotal': -1, 'ranking.posicaoGeral': 1 });

      return metricas;
    } catch (error) {
      console.error(`❌ [MetricasUsuarios] Erro ao obter métricas da loja:`, error);
      throw error;
    }
  }

  /**
   * Obtém todas as métricas (todas as lojas)
   */
  async obterTodasMetricas(filtros = {}) {
    try {
      const query = { periodo: "periodo_completo" };

      // Aplicar filtros
      if (filtros.dataInicio) {
        query.dataInicio = { $gte: new Date(filtros.dataInicio) };
      }
      if (filtros.dataFim) {
        query.dataFim = { $lte: new Date(filtros.dataFim) };
      }

      const metricas = await MetricasUsuario.find(query)
        .populate('loja', 'nome codigo endereco imagem')
        .sort({ 'totaisAcumulados.itensLidosTotal': -1 });

      return metricas;
    } catch (error) {
      console.error(`❌ [MetricasUsuarios] Erro ao obter todas as métricas:`, error);
      throw error;
    }
  }
}

// Exportar instância única
const metricasUsuariosService = new MetricasUsuariosService();
export default metricasUsuariosService;
