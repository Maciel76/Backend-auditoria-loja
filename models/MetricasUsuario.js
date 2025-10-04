import mongoose from "mongoose";

const metricasUsuarioSchema = new mongoose.Schema(
  {
    // Referências obrigatórias
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
    usuarioId: {
      type: String,
      required: true,
      index: true,
    },
    usuarioNome: {
      type: String,
      required: true,
    },

    // Período das métricas
    periodo: {
      type: String,
      required: true,
      enum: ["diario", "semanal", "mensal"],
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

    // Métricas por tipo de auditoria
    etiquetas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      tempoMedioItem: { type: Number, default: 0 }, // em minutos
    },

    rupturas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      custoTotalRuptura: { type: Number, default: 0 },
      custoMedioRuptura: { type: Number, default: 0 },
    },

    presencas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      presencasConfirmadas: { type: Number, default: 0 },
      percentualPresenca: { type: Number, default: 0 },
    },

    // Métricas consolidadas
    totais: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusaoGeral: { type: Number, default: 0 },
      pontuacaoTotal: { type: Number, default: 0 },
    },

    // Desempenho e ranking
    ranking: {
      posicaoLoja: { type: Number, default: 0 },
      posicaoGeral: { type: Number, default: 0 },
      pontosPorItem: { type: Number, default: 0 },
      bonusConsistencia: { type: Number, default: 0 },
    },

    // Análise temporal
    tendencias: {
      melhoriaPercentual: { type: Number, default: 0 },
      diasAtivos: { type: Number, default: 0 },
      mediaItensPerDia: { type: Number, default: 0 },
      regularidade: { type: Number, default: 0 }, // 0-100
    },

    // Contadores de auditorias por tipo
    contadoresAuditorias: {
      totalEtiquetas: { type: Number, default: 0 }, // Quantas auditorias de etiqueta fez
      totalRupturas: { type: Number, default: 0 },  // Quantas auditorias de ruptura fez
      totalPresencas: { type: Number, default: 0 }, // Quantas auditorias de presença fez
      totalGeral: { type: Number, default: 0 },     // Total de auditorias realizadas
    },

    // Totais acumulados de itens lidos (dados históricos)
    totaisAcumulados: {
      itensLidosEtiquetas: { type: Number, default: 0 },
      itensLidosRupturas: { type: Number, default: 0 },
      itensLidosPresencas: { type: Number, default: 0 },
      itensLidosTotal: { type: Number, default: 0 },
    },

    // Histórico de posições no ranking (1º ao 10º lugar)
    historicoRanking: {
      posicao1: { type: Number, default: 0 }, // Quantas vezes ficou em 1º
      posicao2: { type: Number, default: 0 }, // Quantas vezes ficou em 2º
      posicao3: { type: Number, default: 0 }, // Quantas vezes ficou em 3º
      posicao4: { type: Number, default: 0 },
      posicao5: { type: Number, default: 0 },
      posicao6: { type: Number, default: 0 },
      posicao7: { type: Number, default: 0 },
      posicao8: { type: Number, default: 0 },
      posicao9: { type: Number, default: 0 },
      posicao10: { type: Number, default: 0 },
      totalTop10: { type: Number, default: 0 }, // Total de vezes no top 10
      melhorPosicao: { type: Number, default: null }, // Melhor posição já alcançada
    },

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    versaoCalculo: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas
metricasUsuarioSchema.index({ loja: 1, periodo: 1, dataInicio: -1 });
metricasUsuarioSchema.index({ loja: 1, usuarioId: 1, periodo: 1 });
metricasUsuarioSchema.index({ periodo: 1, dataInicio: -1, "totais.pontuacaoTotal": -1 });
metricasUsuarioSchema.index({ loja: 1, "ranking.posicaoLoja": 1 });

// Índice único para evitar duplicatas
metricasUsuarioSchema.index(
  { loja: 1, usuarioId: 1, periodo: 1, dataInicio: 1 },
  { unique: true }
);

// Métodos estáticos úteis
metricasUsuarioSchema.statics.obterRankingLoja = function(lojaId, periodo, dataInicio, dataFim) {
  return this.find({
    loja: lojaId,
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
  .sort({ "totais.pontuacaoTotal": -1 })
  .limit(50);
};

metricasUsuarioSchema.statics.obterMetricasPeriodo = function(usuarioId, lojaId, periodo, dataInicio, dataFim) {
  return this.findOne({
    usuarioId: usuarioId,
    loja: lojaId,
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  });
};

metricasUsuarioSchema.statics.obterTendenciaUsuario = function(usuarioId, lojaId, periodo, limite = 12) {
  return this.find({
    usuarioId: usuarioId,
    loja: lojaId,
    periodo: periodo,
  })
  .sort({ dataInicio: -1 })
  .limit(limite);
};

// Métodos de instância
metricasUsuarioSchema.methods.calcularPontuacaoTotal = function() {
  const pesos = {
    etiquetas: 1.0,
    rupturas: 1.5, // Rupturas têm peso maior
    presencas: 1.2,
  };

  let pontuacao = 0;
  pontuacao += this.etiquetas.itensAtualizados * pesos.etiquetas;
  pontuacao += this.rupturas.itensAtualizados * pesos.rupturas;
  pontuacao += this.presencas.itensAtualizados * pesos.presencas;

  // Bonus por consistência (ter trabalhado em todos os tipos)
  const tiposTrabalho = [
    this.etiquetas.totalItens > 0,
    this.rupturas.totalItens > 0,
    this.presencas.totalItens > 0,
  ].filter(Boolean).length;

  if (tiposTrabalho >= 2) {
    pontuacao *= 1.1; // 10% bonus
  }
  if (tiposTrabalho === 3) {
    pontuacao *= 1.2; // 20% bonus total
  }

  this.totais.pontuacaoTotal = Math.round(pontuacao);
  return this.totais.pontuacaoTotal;
};

metricasUsuarioSchema.methods.atualizarTotais = function() {
  this.totais.totalItens = this.etiquetas.totalItens + this.rupturas.totalItens + this.presencas.totalItens;
  this.totais.itensLidos = this.etiquetas.itensLidos + this.rupturas.itensLidos + this.presencas.itensLidos;
  this.totais.itensAtualizados = this.etiquetas.itensAtualizados + this.rupturas.itensAtualizados + this.presencas.itensAtualizados;

  if (this.totais.totalItens > 0) {
    this.totais.percentualConclusaoGeral = Math.round((this.totais.itensAtualizados / this.totais.totalItens) * 100);
  }

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();
};

export default mongoose.model("MetricasUsuario", metricasUsuarioSchema);