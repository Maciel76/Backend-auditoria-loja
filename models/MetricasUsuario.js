// models/MetricasUsuario.js - VERSÃO ATUALIZADA
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
      itensDesatualizado: { type: Number, default: 0 },
      itensSemEstoque: { type: Number, default: 0 },
      itensNaopertence: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 }, // % em relação ao total da loja
    },

    rupturas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      itensDesatualizado: { type: Number, default: 0 },
      itensSemEstoque: { type: Number, default: 0 },
      itensNaopertence: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 }, // % em relação ao total da loja
      custoTotalRuptura: { type: Number, default: 0 },
      custoMedioRuptura: { type: Number, default: 0 },
    },

    presencas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      itensDesatualizado: { type: Number, default: 0 },
      itensSemEstoque: { type: Number, default: 0 },
      itensNaopertence: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 }, // % em relação ao total da loja
      presencasConfirmadas: { type: Number, default: 0 },
      percentualPresenca: { type: Number, default: 0 },
    },

    // NOVOS CAMPOS ADICIONADOS
    ContadorClassesProduto: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["A CLASSIFICAR", 0],
          ["ALTO GIRO", 0],
          ["BAZAR", 0],
          ["DIVERSOS", 0],
          ["DPH", 0],
          ["FLV", 0],
          ["LATICINIOS 1", 0],
          ["LIQUIDA", 0],
          ["PERECIVEL 1", 0],
          ["PERECIVEL 2", 0],
          ["PERECIVEL 2 B", 0],
          ["PERECIVEL 3", 0],
          ["SECA DOCE", 0],
          ["SECA SALGADA", 0],
          ["SECA SALGADA 2", 0],
        ]),
    },

    ContadorLocais: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["C01 - C01", 0],
          ["CS01 - CS01", 0],
          ["F01 - F01", 0],
          ["F02 - F02", 0],
          ["FLV - FLV", 0],
          ["G01A - G01A", 0],
          ["G01B - G01B", 0],
          ["G02A - G02A", 0],
          ["G02B - G02B", 0],
          ["G03A - G03A", 0],
          ["G03B - G03B", 0],
          ["G04A - G04A", 0],
          ["G04B - G04B", 0],
          ["G05A - G05A", 0],
          ["G05B - G05B", 0],
          ["G06A - G06A", 0],
          ["G06B - G06B", 0],
          ["G07A - G07A", 0],
          ["G07B - G07B", 0],
          ["G08A - G08A", 0],
          ["G08B - G08B", 0],
          ["G09A - G09A", 0],
          ["G09B - G09B", 0],
          ["G10A - G10A", 0],
          ["G10B - G10B", 0],
          ["G11A - G11A", 0],
          ["G11B - G11B", 0],
          ["G12A - G12A", 0],
          ["G12B - G12B", 0],
          ["G13A - G13A", 0],
          ["G13B - G13B", 0],
          ["G14A - G14A", 0],
          ["G14B - G14B", 0],
          ["G15A - G15A", 0],
          ["G15B - G15B", 0],
          ["G16A - G16A", 0],
          ["G16B - G16B", 0],
          ["G17A - G17A", 0],
          ["G17B - G17B", 0],
          ["G18A - G18A", 0],
          ["G18B - G18B", 0],
          ["G19A - G19A", 0],
          ["G19B - G19B", 0],
          ["G20A - G20A", 0],
          ["G20B - G20B", 0],
          ["G21A - G21A", 0],
          ["G21B - G21B", 0],
          ["G22A - G22A", 0],
          ["G22B - G22B", 0],
          ["GELO - GELO", 0],
          ["I01 - I01", 0],
          ["PA01 - PA01", 0],
          ["PAO - PAO", 0],
          ["PF01 - PF01", 0],
          ["PF02 - PF02", 0],
          ["PF03 - PF03", 0],
          ["PL01 - PL01", 0],
          ["PL02 - PL02", 0],
          ["SORVETE - SORVETE", 0],
        ]),
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
      regularidade: { type: Number, default: 0 },
    },

    // Contadores de auditorias por tipo
    contadoresAuditorias: {
      totalEtiquetas: { type: Number, default: 0 },
      totalRupturas: { type: Number, default: 0 },
      totalPresencas: { type: Number, default: 0 },
      totalGeral: { type: Number, default: 0 },
    },

    // Totais acumulados de itens lidos
    totaisAcumulados: {
      itensLidosEtiquetas: { type: Number, default: 0 },
      itensLidosRupturas: { type: Number, default: 0 },
      itensLidosPresencas: { type: Number, default: 0 },
      itensLidosTotal: { type: Number, default: 0 },
    },

    // Histórico de posições no ranking
    historicoRanking: {
      posicao1: { type: Number, default: 0 },
      posicao2: { type: Number, default: 0 },
      posicao3: { type: Number, default: 0 },
      posicao4: { type: Number, default: 0 },
      posicao5: { type: Number, default: 0 },
      posicao6: { type: Number, default: 0 },
      posicao7: { type: Number, default: 0 },
      posicao8: { type: Number, default: 0 },
      posicao9: { type: Number, default: 0 },
      posicao10: { type: Number, default: 0 },
      ACIMA10: { type: Number, default: 0 }, // NOVO CAMPO
      totalTop10: { type: Number, default: 0 },
      melhorPosicao: { type: Number, default: null },
    },

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    versaoCalculo: {
      type: String,
      default: "2.0", // Atualizei a versão
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos
metricasUsuarioSchema.index({ loja: 1, periodo: 1, dataInicio: -1 });
metricasUsuarioSchema.index({ loja: 1, usuarioId: 1, periodo: 1 });
metricasUsuarioSchema.index({
  periodo: 1,
  dataInicio: -1,
  "totais.pontuacaoTotal": -1,
});
metricasUsuarioSchema.index({ loja: 1, "ranking.posicaoLoja": 1 });

// Índice único para evitar duplicatas
metricasUsuarioSchema.index(
  { loja: 1, usuarioId: 1, periodo: 1, dataInicio: 1 },
  { unique: true }
);

// Métodos estáticos
metricasUsuarioSchema.statics.obterRankingLoja = function (
  lojaId,
  periodo,
  dataInicio,
  dataFim
) {
  return this.find({
    loja: lojaId,
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .sort({ "totais.pontuacaoTotal": -1 })
    .limit(50);
};

metricasUsuarioSchema.statics.obterMetricasPeriodo = function (
  usuarioId,
  lojaId,
  periodo,
  dataInicio,
  dataFim
) {
  return this.findOne({
    usuarioId: usuarioId,
    loja: lojaId,
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  });
};

// Métodos de instância
metricasUsuarioSchema.methods.calcularPontuacaoTotal = function () {
  const pesos = {
    etiquetas: 1.0,
    rupturas: 1.5,
    presencas: 1.2,
  };

  let pontuacao = 0;
  pontuacao += this.etiquetas.itensAtualizados * pesos.etiquetas;
  pontuacao += this.rupturas.itensAtualizados * pesos.rupturas;
  pontuacao += this.presencas.itensAtualizados * pesos.presencas;

  // Bonus por consistência
  const tiposTrabalho = [
    this.etiquetas.totalItens > 0,
    this.rupturas.totalItens > 0,
    this.presencas.totalItens > 0,
  ].filter(Boolean).length;

  if (tiposTrabalho >= 2) {
    pontuacao *= 1.1;
  }
  if (tiposTrabalho === 3) {
    pontuacao *= 1.2;
  }

  this.totais.pontuacaoTotal = Math.round(pontuacao);
  return this.totais.pontuacaoTotal;
};

metricasUsuarioSchema.methods.atualizarTotais = function () {
  this.totais.totalItens =
    this.etiquetas.totalItens +
    this.rupturas.totalItens +
    this.presencas.totalItens;
  this.totais.itensLidos =
    this.etiquetas.itensLidos +
    this.rupturas.itensLidos +
    this.presencas.itensLidos;
  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensAtualizados +
    this.presencas.itensAtualizados;

  if (this.totais.totalItens > 0) {
    this.totais.percentualConclusaoGeral = Math.round(
      (this.totais.itensAtualizados / this.totais.totalItens) * 100
    );
  }

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();
};

export default mongoose.model("MetricasUsuario", metricasUsuarioSchema);
