// models/UserDailyMetrics.js - Métricas diárias em tempo real do usuário (VERSÃO SIMPLIFICADA)
import mongoose from "mongoose";

const metricasEtiquetasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensLidos: { type: Number, default: 0 },
  itensAtualizados: { type: Number, default: 0 },
  itensDesatualizado: { type: Number, default: 0 },
  itensSemEstoque: { type: Number, default: 0 },
  itensNaopertence: { type: Number, default: 0 },
  percentualConclusao: { type: Number, default: 0 },

  // Contadores específicos de etiquetas
  contadorClasses: {
    "A CLASSIFICAR": { type: Number, default: 0 },
    "ALTO GIRO": { type: Number, default: 0 },
    BAZAR: { type: Number, default: 0 },
    DIVERSOS: { type: Number, default: 0 },
    DPH: { type: Number, default: 0 },
    FLV: { type: Number, default: 0 },
    "LATICINIOS 1": { type: Number, default: 0 },
    LIQUIDA: { type: Number, default: 0 },
    "PERECIVEL 1": { type: Number, default: 0 },
    "PERECIVEL 2": { type: Number, default: 0 },
    "PERECIVEL 2 B": { type: Number, default: 0 },
    "PERECIVEL 3": { type: Number, default: 0 },
    "SECA DOCE": { type: Number, default: 0 },
    "SECA SALGADA": { type: Number, default: 0 },
    "SECA SALGADA 2": { type: Number, default: 0 },
  },
  contadorLocais: {
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
  },
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

  // Contadores específicos de rupturas
  contadorClasses: {
    "A CLASSIFICAR": { type: Number, default: 0 },
    "ALTO GIRO": { type: Number, default: 0 },
    BAZAR: { type: Number, default: 0 },
    DIVERSOS: { type: Number, default: 0 },
    DPH: { type: Number, default: 0 },
    FLV: { type: Number, default: 0 },
    "LATICINIOS 1": { type: Number, default: 0 },
    LIQUIDA: { type: Number, default: 0 },
    "PERECIVEL 1": { type: Number, default: 0 },
    "PERECIVEL 2": { type: Number, default: 0 },
    "PERECIVEL 2 B": { type: Number, default: 0 },
    "PERECIVEL 3": { type: Number, default: 0 },
    "SECA DOCE": { type: Number, default: 0 },
    "SECA SALGADA": { type: Number, default: 0 },
    "SECA SALGADA 2": { type: Number, default: 0 },
  },
  contadorLocais: {
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
  },
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

  // Contadores específicos de presenças
  contadorClasses: {
    "A CLASSIFICAR": { type: Number, default: 0 },
    "ALTO GIRO": { type: Number, default: 0 },
    BAZAR: { type: Number, default: 0 },
    DIVERSOS: { type: Number, default: 0 },
    DPH: { type: Number, default: 0 },
    FLV: { type: Number, default: 0 },
    "LATICINIOS 1": { type: Number, default: 0 },
    LIQUIDA: { type: Number, default: 0 },
    "PERECIVEL 1": { type: Number, default: 0 },
    "PERECIVEL 2": { type: Number, default: 0 },
    "PERECIVEL 2 B": { type: Number, default: 0 },
    "PERECIVEL 3": { type: Number, default: 0 },
    "SECA DOCE": { type: Number, default: 0 },
    "SECA SALGADA": { type: Number, default: 0 },
    "SECA SALGADA 2": { type: Number, default: 0 },
  },
  contadorLocais: {
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
  },
});


const metricasSchema = new mongoose.Schema({
  // Data da última atualização
  data: {
    type: Date,
    required: true,
    default: Date.now,
  },

  // Métricas por tipo de auditoria - CACHE DA ÚLTIMA AUDITORIA
  etiquetas: {
    type: metricasEtiquetasSchema,
    default: () => ({}),
  },
  rupturas: {
    type: metricasRupturasSchema,
    default: () => ({}),
  },
  presencas: {
    type: metricasPresencasSchema,
    default: () => ({}),
  },

  // Métricas consolidadas
  totais: {
    totalItens: { type: Number, default: 0 },
    itensLidos: { type: Number, default: 0 },
    itensAtualizados: { type: Number, default: 0 },
    percentualConclusaoGeral: { type: Number, default: 0 },
    pontuacaoTotal: { type: Number, default: 0 },
  },

  // Timestamp da última atualização
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

    // ÚNICA instância de métricas (não array) - CACHE DA ÚLTIMA AUDITORIA
    metricas: {
      type: metricasSchema,
      default: () => ({}),
    },

    // Timestamps
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

// Índices compostos para queries otimizadas
userDailyMetricsSchema.index({ loja: 1, usuarioId: 1 });
userDailyMetricsSchema.index({ loja: 1, usuarioNome: 1 });
userDailyMetricsSchema.index({ "metricas.data": -1 });
userDailyMetricsSchema.index({ loja: 1, "metricas.totais.pontuacaoTotal": -1 });

// Índice único para evitar duplicatas por usuário e loja
userDailyMetricsSchema.index({ loja: 1, usuarioId: 1 }, { unique: true });

// Métodos estáticos ATUALIZADOS
userDailyMetricsSchema.statics.obterMetricasAtuais = function (
  lojaId,
  usuarioId
) {
  return this.findOne({
    loja: lojaId,
    usuarioId: usuarioId,
  });
};

userDailyMetricsSchema.statics.obterRankingLoja = function (lojaId) {
  return this.find({ loja: lojaId })
    .sort({ "metricas.totais.pontuacaoTotal": -1 })
    .limit(50);
};

// Métodos de instância ATUALIZADOS
userDailyMetricsSchema.methods.calcularPontuacaoTotal = function () {
  const pesos = {
    etiquetas: 1.0,
    rupturas: 1.5,
    presencas: 1.2,
  };

  let pontuacao = 0;
  pontuacao +=
    (this.metricas.etiquetas?.itensAtualizados || 0) * pesos.etiquetas;
  pontuacao += (this.metricas.rupturas?.itensAtualizados || 0) * pesos.rupturas;
  pontuacao +=
    (this.metricas.presencas?.itensAtualizados || 0) * pesos.presencas;

  // Bonus por consistência
  const tiposTrabalho = [
    (this.metricas.etiquetas?.totalItens || 0) > 0,
    (this.metricas.rupturas?.totalItens || 0) > 0,
    (this.metricas.presencas?.totalItens || 0) > 0,
  ].filter(Boolean).length;

  if (tiposTrabalho >= 2) {
    pontuacao *= 1.1;
  }
  if (tiposTrabalho === 3) {
    pontuacao *= 1.2;
  }

  return Math.round(pontuacao);
};

userDailyMetricsSchema.methods.calcularContadorClassesProduto = function (auditorias) {
  const contadores = {
    "A CLASSIFICAR": 0,
    "ALTO GIRO": 0,
    "BAZAR": 0,
    "DIVERSOS": 0,
    "DPH": 0,
    "FLV": 0,
    "LATICINIOS 1": 0,
    "LIQUIDA": 0,
    "PERECIVEL 1": 0,
    "PERECIVEL 2": 0,
    "PERECIVEL 2 B": 0,
    "PERECIVEL 3": 0,
    "SECA DOCE": 0,
    "SECA SALGADA": 0,
    "SECA SALGADA 2": 0,
  };

  for (const auditoria of auditorias) {
    // Usar o campo ClasseProduto primeiro, fallback para classeProdutoRaiz
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (classe && contadores.hasOwnProperty(classe)) {
      contadores[classe]++;
    }
  }

  return contadores;
};

userDailyMetricsSchema.methods.calcularContadorLocais = function (auditorias) {
  const contadores = {
    "C01 - C01": 0,
    "CS01 - CS01": 0,
    "F01 - F01": 0,
    "F02 - F02": 0,
    "FLV - FLV": 0,
    "G01A - G01A": 0,
    "G01B - G01B": 0,
    "G02A - G02A": 0,
    "G02B - G02B": 0,
    "G03A - G03A": 0,
    "G03B - G03B": 0,
    "G04A - G04A": 0,
    "G04B - G04B": 0,
    "G05A - G05A": 0,
    "G05B - G05B": 0,
    "G06A - G06A": 0,
    "G06B - G06B": 0,
    "G07A - G07A": 0,
    "G07B - G07B": 0,
    "G08A - G08A": 0,
    "G08B - G08B": 0,
    "G09A - G09A": 0,
    "G09B - G09B": 0,
    "G10A - G10A": 0,
    "G10B - G10B": 0,
    "G11A - G11A": 0,
    "G11B - G11B": 0,
    "G12A - G12A": 0,
    "G12B - G12B": 0,
    "G13A - G13A": 0,
    "G13B - G13B": 0,
    "G14A - G14A": 0,
    "G14B - G14B": 0,
    "G15A - G15A": 0,
    "G15B - G15B": 0,
    "G16A - G16A": 0,
    "G16B - G16B": 0,
    "G17A - G17A": 0,
    "G17B - G17B": 0,
    "G18A - G18A": 0,
    "G18B - G18B": 0,
    "G19A - G19A": 0,
    "G19B - G19B": 0,
    "G20A - G20A": 0,
    "G20B - G20B": 0,
    "G21A - G21A": 0,
    "G21B - G21B": 0,
    "G22A - G22A": 0,
    "G22B - G22B": 0,
    "GELO - GELO": 0,
    "I01 - I01": 0,
    "PA01 - PA01": 0,
    "PAO - PAO": 0,
    "PF01 - PF01": 0,
    "PF02 - PF02": 0,
    "PF03 - PF03": 0,
    "PL01 - PL01": 0,
    "PL02 - PL02": 0,
    "SORVETE - SORVETE": 0,
  };

  for (const auditoria of auditorias) {
    const local = auditoria.local;
    if (local && contadores.hasOwnProperty(local)) {
      contadores[local]++;
    }
  }

  return contadores;
};

userDailyMetricsSchema.methods.atualizarTotais = function () {
  this.metricas.totais.totalItens =
    (this.metricas.etiquetas?.totalItens || 0) +
    (this.metricas.rupturas?.totalItens || 0) +
    (this.metricas.presencas?.totalItens || 0);

  this.metricas.totais.itensLidos =
    (this.metricas.etiquetas?.itensLidos || 0) +
    (this.metricas.rupturas?.itensLidos || 0) +
    (this.metricas.presencas?.itensLidos || 0);

  this.metricas.totais.itensAtualizados =
    (this.metricas.etiquetas?.itensAtualizados || 0) +
    (this.metricas.rupturas?.itensAtualizados || 0) +
    (this.metricas.presencas?.itensAtualizados || 0);

  if (this.metricas.totais.totalItens > 0) {
    this.metricas.totais.percentualConclusaoGeral = Math.round(
      (this.metricas.totais.itensAtualizados /
        this.metricas.totais.totalItens) *
        100
    );
  }

  this.metricas.totais.pontuacaoTotal = this.calcularPontuacaoTotal();
  this.metricas.ultimaAtualizacao = new Date();
  this.ultimaAtualizacao = new Date();
};

// Middleware para garantir que as métricas sejam inicializadas
userDailyMetricsSchema.pre("save", function (next) {
  if (!this.metricas) {
    this.metricas = {};
  }
  next();
});

export default mongoose.model("UserDailyMetrics", userDailyMetricsSchema);
