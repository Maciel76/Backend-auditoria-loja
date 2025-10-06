// models/UserDailyMetrics.js - Métricas diárias em tempo real do usuário
import mongoose from "mongoose";

const metricasEtiquetasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensLidos: { type: Number, default: 0 },
  itensAtualizados: { type: Number, default: 0 },
  itensDesatualizado: { type: Number, default: 0 },
  itensSemEstoque: { type: Number, default: 0 },
  itensNaopertence: { type: Number, default: 0 },
  percentualConclusao: { type: Number, default: 0 },
});

const metricasRupturasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensLidos: { type: Number, default: 0 },
  itensAtualizados: { type: Number, default: 0 },
  itensDesatualizado: { type: Number, default: 0 },
  itensSemEstoque: { type: Number, default: 0 },
  itensNaopertence: { type: Number, default: 0 },
  percentualConclusao: { type: Number, default: 0 },
  custoTotalRuptura: { type: Number, default: 0 },
  custoMedioRuptura: { type: Number, default: 0 },
});

const metricasPresencasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensLidos: { type: Number, default: 0 },
  itensAtualizados: { type: Number, default: 0 },
  itensDesatualizado: { type: Number, default: 0 },
  itensSemEstoque: { type: Number, default: 0 },
  itensNaopertence: { type: Number, default: 0 },
  percentualConclusao: { type: Number, default: 0 },
  presencasConfirmadas: { type: Number, default: 0 },
  percentualPresenca: { type: Number, default: 0 },
});

const contadoresClassesSchema = new mongoose.Schema({
  "A CLASSIFICAR": { type: Number, default: 0 },
  "ALTO GIRO": { type: Number, default: 0 },
  "BAZAR": { type: Number, default: 0 },
  "DIVERSOS": { type: Number, default: 0 },
  "DPH": { type: Number, default: 0 },
  "FLV": { type: Number, default: 0 },
  "LATICINIOS 1": { type: Number, default: 0 },
  "LIQUIDA": { type: Number, default: 0 },
  "PERECIVEL 1": { type: Number, default: 0 },
  "PERECIVEL 2": { type: Number, default: 0 },
  "PERECIVEL 2 B": { type: Number, default: 0 },
  "PERECIVEL 3": { type: Number, default: 0 },
  "SECA DOCE": { type: Number, default: 0 },
  "SECA SALGADA": { type: Number, default: 0 },
  "SECA SALGADA 2": { type: Number, default: 0 },
}, { _id: false });

const contadoresLocaisSchema = new mongoose.Schema({
  "C01 - C01": { type: Number, default: 0 },
  "CS01 - CS01": { type: Number, default: 0 },
  "F01 - F01": { type: Number, default: 0 },
  "F02 - F02": { type: Number, default: 0 },
  "FLV - FLV": { type: Number, default: 0 },
  "G01A - G01A": { type: Number, default: 0 },
  "G01B - G01B": { type: Number, default: 0 },
  "G02A - G02A": { type: Number, default: 0 },
  "G02B - G02B": { type: Number, default: 0 },
  "G03A - G03A": { type: Number, default: 0 },
  "G03B - G03B": { type: Number, default: 0 },
  "G04A - G04A": { type: Number, default: 0 },
  "G04B - G04B": { type: Number, default: 0 },
  "G05A - G05A": { type: Number, default: 0 },
  "G05B - G05B": { type: Number, default: 0 },
  "G06A - G06A": { type: Number, default: 0 },
  "G06B - G06B": { type: Number, default: 0 },
  "G07A - G07A": { type: Number, default: 0 },
  "G07B - G07B": { type: Number, default: 0 },
  "G08A - G08A": { type: Number, default: 0 },
  "G08B - G08B": { type: Number, default: 0 },
  "G09A - G09A": { type: Number, default: 0 },
  "G09B - G09B": { type: Number, default: 0 },
  "G10A - G10A": { type: Number, default: 0 },
  "G10B - G10B": { type: Number, default: 0 },
  "G11A - G11A": { type: Number, default: 0 },
  "G11B - G11B": { type: Number, default: 0 },
  "G12A - G12A": { type: Number, default: 0 },
  "G12B - G12B": { type: Number, default: 0 },
  "G13A - G13A": { type: Number, default: 0 },
  "G13B - G13B": { type: Number, default: 0 },
  "G14A - G14A": { type: Number, default: 0 },
  "G14B - G14B": { type: Number, default: 0 },
  "G15A - G15A": { type: Number, default: 0 },
  "G15B - G15B": { type: Number, default: 0 },
  "G16A - G16A": { type: Number, default: 0 },
  "G16B - G16B": { type: Number, default: 0 },
  "G17A - G17A": { type: Number, default: 0 },
  "G17B - G17B": { type: Number, default: 0 },
  "G18A - G18A": { type: Number, default: 0 },
  "G18B - G18B": { type: Number, default: 0 },
  "G19A - G19A": { type: Number, default: 0 },
  "G19B - G19B": { type: Number, default: 0 },
  "G20A - G20A": { type: Number, default: 0 },
  "G20B - G20B": { type: Number, default: 0 },
  "G21A - G21A": { type: Number, default: 0 },
  "G21B - G21B": { type: Number, default: 0 },
  "G22A - G22A": { type: Number, default: 0 },
  "G22B - G22B": { type: Number, default: 0 },
  "GELO - GELO": { type: Number, default: 0 },
  "I01 - I01": { type: Number, default: 0 },
  "PA01 - PA01": { type: Number, default: 0 },
  "PAO - PAO": { type: Number, default: 0 },
  "PF01 - PF01": { type: Number, default: 0 },
  "PF02 - PF02": { type: Number, default: 0 },
  "PF03 - PF03": { type: Number, default: 0 },
  "PL01 - PL01": { type: Number, default: 0 },
  "PL02 - PL02": { type: Number, default: 0 },
  "SORVETE - SORVETE": { type: Number, default: 0 },
}, { _id: false });

const metricasDiariaSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: true,
    index: true,
  },
  // Métricas por tipo de auditoria
  etiquetas: metricasEtiquetasSchema,
  rupturas: metricasRupturasSchema,
  presencas: metricasPresencasSchema,

  // Contadores por classificação e local
  contadorClasses: contadoresClassesSchema,
  contadorLocais: contadoresLocaisSchema,

  // Métricas consolidadas do dia
  totais: {
    totalItens: { type: Number, default: 0 },
    itensLidos: { type: Number, default: 0 },
    itensAtualizados: { type: Number, default: 0 },
    percentualConclusaoGeral: { type: Number, default: 0 },
    pontuacaoTotal: { type: Number, default: 0 },
  },

  // Contadores de auditorias realizadas
  contadoresAuditorias: {
    totalEtiquetas: { type: Number, default: 0 },
    totalRupturas: { type: Number, default: 0 },
    totalPresencas: { type: Number, default: 0 },
    totalGeral: { type: Number, default: 0 },
  },

  // Ranking do dia
  ranking: {
    posicaoLoja: { type: Number, default: 0 },
    posicaoGeral: { type: Number, default: 0 },
    pontosPorItem: { type: Number, default: 0 },
  },

  // Análise temporal
  tendencias: {
    diasAtivos: { type: Number, default: 0 },
    mediaItensPerDia: { type: Number, default: 0 },
    melhoriaPercentual: { type: Number, default: 0 },
  },

  // Timestamp da última atualização dos dados do dia
  ultimaAtualizacao: {
    type: Date,
    default: Date.now,
  },
});

const userDailyMetricsSchema = new mongoose.Schema(
  {
    // Informações do usuário
    usuarioId: {
      type: String,
      required: true,
    },
    usuarioNome: {
      type: String,
      required: true,
    },

    // Referência à loja
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
    lojaNome: {
      type: String,
      required: true,
    },

    // Array de métricas diárias
    metricasDiarias: [metricasDiariaSchema],

    // Resumo geral (última auditoria)
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
userDailyMetricsSchema.index({ loja: 1, usuarioId: 1 });
userDailyMetricsSchema.index({ loja: 1, usuarioNome: 1 });
userDailyMetricsSchema.index({ "metricasDiarias.data": -1 });
userDailyMetricsSchema.index({ loja: 1, "metricasDiarias.totais.pontuacaoTotal": -1 });

// Índice único para evitar duplicatas por usuário e loja
userDailyMetricsSchema.index(
  { loja: 1, usuarioId: 1 },
  { unique: true }
);

// Métodos estáticos
userDailyMetricsSchema.statics.obterMetricasAtuais = function (lojaId, usuarioId) {
  return this.findOne({
    loja: lojaId,
    usuarioId: usuarioId,
  });
};

userDailyMetricsSchema.statics.obterRankingLoja = function (lojaId, data) {
  const dataString = data.toDateString();
  return this.find({
    loja: lojaId,
    "metricasDiarias.data": {
      $gte: new Date(dataString),
      $lt: new Date(new Date(dataString).getTime() + 24 * 60 * 60 * 1000),
    },
  })
    .sort({ "metricasDiarias.totais.pontuacaoTotal": -1 })
    .limit(50);
};

// Métodos de instância
userDailyMetricsSchema.methods.obterMetricasDia = function (data) {
  const dataString = data.toDateString();
  return this.metricasDiarias.find(
    (m) => m.data.toDateString() === dataString
  );
};

userDailyMetricsSchema.methods.calcularPontuacaoTotal = function (metricas) {
  const pesos = {
    etiquetas: 1.0,
    rupturas: 1.5,
    presencas: 1.2,
  };

  let pontuacao = 0;
  pontuacao += metricas.etiquetas.itensAtualizados * pesos.etiquetas;
  pontuacao += metricas.rupturas.itensAtualizados * pesos.rupturas;
  pontuacao += metricas.presencas.itensAtualizados * pesos.presencas;

  // Bonus por consistência
  const tiposTrabalho = [
    metricas.etiquetas.totalItens > 0,
    metricas.rupturas.totalItens > 0,
    metricas.presencas.totalItens > 0,
  ].filter(Boolean).length;

  if (tiposTrabalho >= 2) {
    pontuacao *= 1.1;
  }
  if (tiposTrabalho === 3) {
    pontuacao *= 1.2;
  }

  return Math.round(pontuacao);
};

userDailyMetricsSchema.methods.atualizarTotaisDia = function (metricas) {
  metricas.totais.totalItens =
    metricas.etiquetas.totalItens +
    metricas.rupturas.totalItens +
    metricas.presencas.totalItens;

  metricas.totais.itensLidos =
    metricas.etiquetas.itensLidos +
    metricas.rupturas.itensLidos +
    metricas.presencas.itensLidos;

  metricas.totais.itensAtualizados =
    metricas.etiquetas.itensAtualizados +
    metricas.rupturas.itensAtualizados +
    metricas.presencas.itensAtualizados;

  if (metricas.totais.totalItens > 0) {
    metricas.totais.percentualConclusaoGeral = Math.round(
      (metricas.totais.itensAtualizados / metricas.totais.totalItens) * 100
    );
  }

  metricas.totais.pontuacaoTotal = this.calcularPontuacaoTotal(metricas);
  metricas.ultimaAtualizacao = new Date();
  this.ultimaAtualizacao = new Date();
};

export default mongoose.model("UserDailyMetrics", userDailyMetricsSchema);