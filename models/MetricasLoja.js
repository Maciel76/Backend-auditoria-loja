/**
 * MODELO: MetricasLoja
 * ENDPOINTS ASSOCIADOS:
 * - GET /metricas/lojas - Obter métricas resumidas de uma loja específica
 * - GET /metricas/lojas/ranking - Obter ranking de todas as lojas
 */
// models/MetricasLoja.js - VERSÃO ATUALIZADA COM PERÍODO COMPLETO
import mongoose from "mongoose";

const metricasLojaSchema = new mongoose.Schema(
  {
    // Referência obrigatória
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
    },

    // NOVO: Nome da loja desnormalizado para consultas rápidas
    lojaNome: {
      type: String,
      required: true,
    },

    // Período das métricas - AGORA APENAS PERÍODO COMPLETO
    periodo: {
      type: String,
      required: true,
      enum: ["periodo_completo"],
      default: "periodo_completo",
      index: true,
    },
    dataInicio: {
      type: Date,
      required: true,
      index: true,
    },
    dataFim: {
      type: Date,
      required: true,
      index: true,
    },

    // Métricas por tipo de auditoria - ESTRUTURA ATUALIZADA
    etiquetas: {
      totalItens: { type: Number, default: 0 }, // Quantidade total de itens da planilha
      itensValidos: { type: Number, default: 0 }, // Itens que podem ser auditados: [Atualizado]+[Não lidos com estoque]+[Lido sem estoque]
      itensAtualizados: { type: Number, default: 0 }, // Situação: Atualizado
      itensNaolidos: { type: Number, default: 0 }, // Situação: Não lidos com estoque
      itensDesatualizado: { type: Number, default: 0 }, // Situação: Desatualizado
      itensNaopertence: { type: Number, default: 0 }, // Situação: Lido não pertence
      itensLidosemestoque: { type: Number, default: 0 }, // Situação: Lido sem estoque
      itensNlidocomestoque: { type: Number, default: 0 }, // Situação: Não lidos com estoque
      itensSemestoque: { type: Number, default: 0 }, // Situação: Sem Estoque
      percentualConclusao: { type: Number, default: 0 }, // % de itensAtualizados em relação aos itensValidos
      percentualRestante: { type: Number, default: 0 }, // % que ainda falta concluir
      usuariosAtivos: { type: Number, default: 0 }, // Quantidade de usuários únicos nas auditorias
    },

    rupturas: {
      totalItens: { type: Number, default: 0 }, // Quantidade total de itens da planilha de ruptura
      itensLidos: { type: Number, default: 0 }, // Quantidade de itens lidos na auditoria
      itensAtualizados: { type: Number, default: 0 }, // Situação: Com Presença e com Estoque
      percentualConclusao: { type: Number, default: 0 }, // % de conclusão
      percentualRestante: { type: Number, default: 0 }, // % restante
      custoTotalRuptura: { type: Number, default: 0 },
      rupturasCriticas: { type: Number, default: 0 }, // > R$ 100
      usuariosAtivos: { type: Number, default: 0 }, // Quantidade de usuários únicos nas auditorias
    },

    presencas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      presencasConfirmadas: { type: Number, default: 0 },
      percentualPresenca: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
    },

    // Métricas consolidadas da loja
    totais: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusaoGeral: { type: Number, default: 0 },
      usuariosTotais: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
      planilhasProcessadas: { type: Number, default: 0 },
    },

    // Ranking e desempenho
    ranking: {
      posicaoGeral: { type: Number, default: 0 },
      pontuacaoTotal: { type: Number, default: 0 },
      notaQualidade: { type: Number, default: 0 }, // 0-10
      eficienciaOperacional: { type: Number, default: 0 }, // 0-100
    },

    // Análise de usuários
    usuariosEstatisticas: {
      melhorUsuario: {
        usuarioId: String,
        usuarioNome: String,
        pontuacao: { type: Number, default: 0 },
      },
      usuarioMaisAtivo: {
        usuarioId: String,
        usuarioNome: String,
        itensProcessados: { type: Number, default: 0 },
      },
      mediaItensPerUsuario: { type: Number, default: 0 },
      produtividadeMedia: { type: Number, default: 0 },
    },

    // Análise por setores/locais
    locaisEstatisticas: [
      {
        local: String,
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        problemasFrecuentes: { type: Number, default: 0 },
      },
    ],

    // Tendências e comparações
    tendencias: {
      crescimentoSemanal: { type: Number, default: 0 }, // %
      melhoriaQualidade: { type: Number, default: 0 }, // %
      consistenciaOperacional: { type: Number, default: 0 }, // 0-100
      tendenciaUsuarios: { type: Number, default: 0 }, // crescimento de usuários ativos
    },

    // Alertas e problemas identificados
    alertas: [
      {
        tipo: {
          type: String,
          enum: [
            "baixa_produtividade",
            "alta_ruptura",
            "poucos_usuarios",
            "qualidade_baixa",
          ],
        },
        severidade: {
          type: String,
          enum: ["baixa", "media", "alta", "critica"],
          default: "media",
        },
        descricao: String,
        valor: Number,
        dataDeteccao: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    versaoCalculo: {
      type: String,
      default: "2.0", // Versão atualizada
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas - ATUALIZADOS PARA PERÍODO COMPLETO
metricasLojaSchema.index({ loja: 1, dataInicio: -1 });
metricasLojaSchema.index({
  dataInicio: -1,
  "ranking.pontuacaoTotal": -1,
});
metricasLojaSchema.index({ "ranking.posicaoGeral": 1 });
metricasLojaSchema.index({ lojaNome: 1 });

// Índice único para evitar duplicatas - APENAS LOJA (1 registro por loja para periodo_completo)
metricasLojaSchema.index({ loja: 1 }, { unique: true });

// Métodos estáticos úteis - ATUALIZADOS PARA PERÍODO COMPLETO
metricasLojaSchema.statics.obterRankingGeral = function (
  dataInicio,
  dataFim,
  limite = 50
) {
  return this.find({
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "ranking.pontuacaoTotal": -1 })
    .limit(limite);
};

metricasLojaSchema.statics.obterComparacaoLojas = function (
  lojasIds,
  dataInicio,
  dataFim
) {
  return this.find({
    loja: { $in: lojasIds },
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "ranking.pontuacaoTotal": -1 });
};

metricasLojaSchema.statics.obterTendenciaLoja = function (lojaId, limite = 12) {
  return this.find({
    loja: lojaId,
  })
    .sort({ dataInicio: -1 })
    .limit(limite);
};

metricasLojaSchema.statics.obterLojasComProblemas = function (
  dataInicio,
  dataFim
) {
  return this.find({
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
    "alertas.severidade": { $in: ["alta", "critica"] },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "alertas.severidade": -1 });
};

// NOVO MÉTODO: Obter métrica única da loja
metricasLojaSchema.statics.obterMetricaLoja = function (lojaId) {
  return this.findOne({ loja: lojaId }).populate(
    "loja",
    "codigo nome cidade regiao"
  );
};

// Métodos de instância
metricasLojaSchema.methods.calcularPontuacaoTotal = function () {
  const pesos = {
    conclusao: 0.4, // 40% - Taxa de conclusão
    qualidade: 0.3, // 30% - Qualidade do trabalho
    produtividade: 0.2, // 20% - Produtividade
    consistencia: 0.1, // 10% - Consistência
  };

  // Taxa de conclusão (0-100)
  const taxaConclusao = this.totais.percentualConclusaoGeral;

  // Qualidade baseada na proporção de diferentes tipos de auditoria
  const diversidade = [
    this.etiquetas.totalItens > 0,
    this.rupturas.totalItens > 0,
    this.presencas.totalItens > 0,
  ].filter(Boolean).length;

  const qualidade = (diversidade / 3) * 100;

  // Produtividade baseada em itens por usuário ativo
  const produtividade =
    this.totais.usuariosAtivos > 0
      ? Math.min(
          (this.totais.itensAtualizados / this.totais.usuariosAtivos) * 2,
          100
        )
      : 0;

  // Consistência baseada na regularidade de uso
  const consistencia = Math.min(this.totais.usuariosAtivos * 10, 100);

  const pontuacao =
    taxaConclusao * pesos.conclusao +
    qualidade * pesos.qualidade +
    produtividade * pesos.produtividade +
    consistencia * pesos.consistencia;

  this.ranking.pontuacaoTotal = Math.round(pontuacao);
  this.ranking.notaQualidade = Math.round(pontuacao / 10); // Nota de 0-10
  this.ranking.eficienciaOperacional = Math.round(pontuacao);

  return this.ranking.pontuacaoTotal;
};

metricasLojaSchema.methods.atualizarTotais = function () {
  this.totais.totalItens =
    this.etiquetas.totalItens +
    this.rupturas.totalItens +
    this.presencas.totalItens;

  // Usar itensValidos para etiquetas e itensLidos para outros
  this.totais.itensLidos =
    this.etiquetas.itensValidos +
    this.rupturas.itensLidos +
    this.presencas.itensLidos;

  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensAtualizados +
    this.presencas.itensAtualizados;

  // Calcular percentual usando itensValidos como base
  if (this.totais.itensLidos > 0) {
    this.totais.percentualConclusaoGeral = Math.round(
      (this.totais.itensAtualizados / this.totais.itensLidos) * 100
    );
  }

  // Calcular usuários ativos únicos (somar em vez de usar max)
  this.totais.usuariosAtivos =
    this.etiquetas.usuariosAtivos +
    this.rupturas.usuariosAtivos +
    this.presencas.usuariosAtivos;

  // Atualizar percentuais restantes
  this.etiquetas.percentualRestante = 100 - this.etiquetas.percentualConclusao;
  this.rupturas.percentualRestante = 100 - this.rupturas.percentualConclusao;
  this.presencas.percentualRestante = 100 - this.presencas.percentualConclusao;

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();
};

// NOVO MÉTODO: Atualizar com base nos dados de auditoria
metricasLojaSchema.methods.atualizarComAuditorias = function (
  auditorias,
  tipo
) {
  if (!auditorias || auditorias.length === 0) return;

  const situacaoMap = new Map();
  const usuariosUnicos = new Set();

  // Contar situações e usuários
  auditorias.forEach((auditoria) => {
    const situacao = auditoria.situacao || auditoria.Situacao;
    situacaoMap.set(situacao, (situacaoMap.get(situacao) || 0) + 1);

    if (auditoria.usuarioId || auditoria.Usuario) {
      usuariosUnicos.add(auditoria.usuarioId || auditoria.Usuario);
    }
  });

  if (tipo === "etiquetas") {
    this.etiquetas.totalItens = auditorias.length;
    this.etiquetas.itensAtualizados = situacaoMap.get("Atualizado") || 0;
    this.etiquetas.itensNaolidos =
      situacaoMap.get("Não lidos com estoque") || 0;
    this.etiquetas.itensDesatualizado = situacaoMap.get("Desatualizado") || 0;
    this.etiquetas.itensNaopertence = situacaoMap.get("Lido não pertence") || 0;
    this.etiquetas.itensLidosemestoque =
      situacaoMap.get("Lido sem estoque") || 0;
    this.etiquetas.itensNlidocomestoque =
      situacaoMap.get("Não lidos com estoque") || 0;
    this.etiquetas.itensSemestoque = situacaoMap.get("Sem Estoque") || 0;

    // Calcular itens válidos (que podem ser auditados)
    this.etiquetas.itensValidos =
      this.etiquetas.itensAtualizados +
      this.etiquetas.itensNaolidos +
      this.etiquetas.itensLidosemestoque;

    // Calcular percentuais
    if (this.etiquetas.itensValidos > 0) {
      this.etiquetas.percentualConclusao = Math.round(
        (this.etiquetas.itensAtualizados / this.etiquetas.itensValidos) * 100
      );
    }

    this.etiquetas.usuariosAtivos = usuariosUnicos.size;
  }

  // Implementar lógica similar para rupturas e presencas...
  if (tipo === "rupturas") {
    this.rupturas.totalItens = auditorias.length;
    this.rupturas.itensAtualizados =
      situacaoMap.get("Com Presença e com Estoque") || 0;
    this.rupturas.itensLidos = auditorias.filter(
      (a) => a.situacao !== "Não lido"
    ).length;

    if (this.rupturas.itensLidos > 0) {
      this.rupturas.percentualConclusao = Math.round(
        (this.rupturas.itensAtualizados / this.rupturas.itensLidos) * 100
      );
    }

    this.rupturas.usuariosAtivos = usuariosUnicos.size;
  }

  if (tipo === "presencas") {
    this.presencas.totalItens = auditorias.length;
    this.presencas.itensAtualizados = situacaoMap.get("Confirmado") || 0;
    this.presencas.itensLidos = auditorias.filter(
      (a) => a.situacao !== "Não lido"
    ).length;

    if (this.presencas.itensLidos > 0) {
      this.presencas.percentualConclusao = Math.round(
        (this.presencas.itensAtualizados / this.presencas.itensLidos) * 100
      );
    }

    this.presencas.usuariosAtivos = usuariosUnicos.size;
  }

  // Atualizar totais após modificação
  this.atualizarTotais();
};

metricasLojaSchema.methods.detectarAlertas = function () {
  this.alertas = []; // Limpar alertas anteriores

  // Alerta de baixa produtividade
  if (this.totais.percentualConclusaoGeral < 50) {
    this.alertas.push({
      tipo: "baixa_produtividade",
      severidade:
        this.totais.percentualConclusaoGeral < 25 ? "critica" : "alta",
      descricao: `Taxa de conclusão baixa: ${this.totais.percentualConclusaoGeral}%`,
      valor: this.totais.percentualConclusaoGeral,
    });
  }

  // Alerta de alta ruptura
  if (this.rupturas.custoTotalRuptura > 10000) {
    this.alertas.push({
      tipo: "alta_ruptura",
      severidade: this.rupturas.custoTotalRuptura > 50000 ? "critica" : "alta",
      descricao: `Custo de ruptura elevado: R$ ${this.rupturas.custoTotalRuptura.toLocaleString()}`,
      valor: this.rupturas.custoTotalRuptura,
    });
  }

  // Alerta de poucos usuários
  if (this.totais.usuariosAtivos < 3) {
    this.alertas.push({
      tipo: "poucos_usuarios",
      severidade: this.totais.usuariosAtivos === 1 ? "alta" : "media",
      descricao: `Poucos usuários ativos: ${this.totais.usuariosAtivos}`,
      valor: this.totais.usuariosAtivos,
    });
  }

  // Alerta de qualidade baixa
  if (this.ranking.notaQualidade < 5) {
    this.alertas.push({
      tipo: "qualidade_baixa",
      severidade: this.ranking.notaQualidade < 3 ? "critica" : "alta",
      descricao: `Nota de qualidade baixa: ${this.ranking.notaQualidade}/10`,
      valor: this.ranking.notaQualidade,
    });
  }
};

export default mongoose.model("MetricasLoja", metricasLojaSchema);
