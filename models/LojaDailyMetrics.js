// models/LojaDailyMetrics.js - Métricas diárias da loja (período diário)
import mongoose from "mongoose";

// Schema para contadores de leitura por classe de produto - dinâmico
const classesLeituraSchema = new mongoose.Schema({
  // Dynamic keys will be added at runtime based on data from spreadsheets
}, {
  _id: false,
  strict: false  // Allow dynamic fields
});

// Schema para contadores de leitura por local - dinâmico
const locaisLeituraSchema = new mongoose.Schema({
  // Dynamic keys will be added at runtime based on data from spreadsheets
}, {
  _id: false,
  strict: false  // Allow dynamic fields
});

// Schema para métricas de etiquetas
const metricasEtiquetasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 }, // Quantidade total de itens da planilha
  itensValidos: { type: Number, default: 0 }, // [Atualizado]+[Não lidos com estoque]+[Lido sem estoque]
  itensAtualizados: { type: Number, default: 0 }, // Situação: Atualizado
  itensNaolidos: { type: Number, default: 0 }, // Situação: Não lidos com estoque
  itensDesatualizado: { type: Number, default: 0 }, // Situação: Desatualizado
  itensNaopertence: { type: Number, default: 0 }, // Situação: Lido não pertence
  itensLidosemestoque: { type: Number, default: 0 }, // Situação: Lido sem estoque
  itensNlidocomestoque: { type: Number, default: 0 }, // Situação: Não lidos com estoque
  itensSemestoque: { type: Number, default: 0 }, // Situação: Sem Estoque
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão = (itensAtualizados / itens válidos) * 100
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  percentualDesatualizado: { type: Number, default: 0 }, // % etiquetas desatualizadas = (itens desatualizados / itens válidos) * 100
  usuariosAtivos: { type: Number, default: 0 }, // Usuários únicos

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

  // Contadores de leitura por local
  locaisLeitura: { type: locaisLeituraSchema, default: () => ({}) },

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

// Schema para métricas de rupturas
const metricasRupturasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensLidos: { type: Number, default: 0 }, // Quantidade de itens com situação "Com Presença e com Estoque"
  itensNaoLidos: { type: Number, default: 0 }, // Quantidade de itens com situação "Sem Presença e Com Estoque" - substitui itensAtualizados
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão em relação a totalItens e itensLidos (continuação da auditoria de presença)
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  custoTotalRuptura: { type: Number, default: 0 }, // Valor do Custo da Ruptura dos itens com situação "Sem Presença e Com Estoque"
  usuariosAtivos: { type: Number, default: 0 },

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

  // Contadores de leitura por local
  locaisLeitura: { type: locaisLeituraSchema, default: () => ({}) },

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

// Schema para métricas de presenças
const metricasPresencasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensValidos: { type: Number, default: 0 }, // [Sem Presença e Com Estoque] + [Com Presença e Com Estoque]
  itensNaoLidos: { type: Number, default: 0 }, // [Sem Presença e Com Estoque]
  itensAtualizados: { type: Number, default: 0 }, // [Com Presença e Com Estoque]
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão = (itensAtualizados / itensValidos) * 100
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  custoRuptura: { type: Number, default: 0 }, // Valor total da ruptura dos itens [Sem Presença e Com Estoque]
  rupturaSemPresenca: { type: Number, default: 0 }, // Valor total da ruptura dos itens com situação original [Sem Presença e Com Estoque]
  presencasConfirmadas: { type: Number, default: 0 }, // [Com Presença e Com Estoque] + [Com Presença e sem Estoque] + [Lido não pertence]
  usuariosAtivos: { type: Number, default: 0 },

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

  // Contadores de leitura por local
  locaisLeitura: { type: locaisLeituraSchema, default: () => ({}) },

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

// Schema principal das métricas diárias da loja
const lojaDailyMetricsSchema = new mongoose.Schema(
  {
    // Informações da loja
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
    lojaNome: {
      type: String,
      required: true,
      index: true,
    },

    // Data específica (período diário)
    data: {
      type: Date,
      required: true,
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
      usuariosTotais: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
      planilhasProcessadas: { type: Number, default: 0 },
    },

    // Ranking e desempenho do dia
    ranking: {
      posicaoGeral: { type: Number, default: 0 },
      pontuacaoTotal: { type: Number, default: 0 },
      notaQualidade: { type: Number, default: 0 }, // 0-10
      eficienciaOperacional: { type: Number, default: 0 }, // 0-100
    },

    // Análise por setores/locais do dia
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

    // Alertas do dia
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
      default: "2.0",
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas
lojaDailyMetricsSchema.index({ loja: 1, data: -1 });
lojaDailyMetricsSchema.index({ lojaNome: 1, data: -1 });
lojaDailyMetricsSchema.index({ data: -1, "ranking.pontuacaoTotal": -1 });
lojaDailyMetricsSchema.index({ loja: 1, "ranking.posicaoGeral": 1 });

// Índice único para evitar duplicatas - UM documento por loja (igual ao UserDailyMetrics)
lojaDailyMetricsSchema.index({ loja: 1 }, { unique: true });

// Métodos estáticos
lojaDailyMetricsSchema.statics.obterMetricasDiarias = function (
  lojaId,
  dataInicio,
  dataFim
) {
  return this.find({
    loja: lojaId,
    data: { $gte: dataInicio, $lte: dataFim },
  }).sort({ data: -1 });
};

lojaDailyMetricsSchema.statics.obterRankingDiario = function (
  data,
  limite = 50
) {
  const dataInicio = new Date(data);
  dataInicio.setHours(0, 0, 0, 0);
  const dataFim = new Date(data);
  dataFim.setHours(23, 59, 59, 999);

  return this.find({
    data: { $gte: dataInicio, $lte: dataFim },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "ranking.pontuacaoTotal": -1 })
    .limit(limite);
};

lojaDailyMetricsSchema.statics.obterTendenciaLoja = function (
  lojaId,
  limite = 30
) {
  return this.find({
    loja: lojaId,
  })
    .sort({ data: -1 })
    .limit(limite);
};

// Métodos de instância
lojaDailyMetricsSchema.methods.calcularPontuacaoTotal = function () {
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

lojaDailyMetricsSchema.methods.atualizarTotais = function () {
  this.totais.totalItens =
    this.etiquetas.totalItens +
    this.rupturas.totalItens +
    this.presencas.totalItens;

  // Usar itensValidos para etiquetas e presencas, e itensLidos para rupturas
  this.totais.itensLidos =
    this.etiquetas.itensValidos +
    this.rupturas.itensLidos +
    this.presencas.itensValidos;

  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensLidos +  // Em rupturas, itensLidos são itens que foram encontrados (com presença e com estoque)
    this.presencas.itensAtualizados;

  // Calcular percentual usando itensLidos como base
  if (this.totais.itensLidos > 0) {
    this.totais.percentualConclusaoGeral =
      (this.totais.itensAtualizados / this.totais.itensLidos) * 100;
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

// Método para processar auditorias do dia
lojaDailyMetricsSchema.methods.processarAuditorias = function (
  auditorias,
  tipo
) {
  if (!auditorias || auditorias.length === 0) return;

  // Adicionando logs de debug para identificar o problema
  console.log(`📊 Processando ${auditorias.length} auditorias do tipo: ${tipo}`);

  const situacaoMap = new Map();
  const usuariosUnicos = new Set();
  const classesMap = new Map();
  const locaisMap = new Map();

  // Contar situações, usuários, classes e locais
  auditorias.forEach((auditoria) => {
    const situacao = auditoria.situacao || auditoria.Situacao;
    situacaoMap.set(situacao, (situacaoMap.get(situacao) || 0) + 1);

    if (auditoria.usuarioId || auditoria.Usuario) {
      usuariosUnicos.add(auditoria.usuarioId || auditoria.Usuario);
    }

    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (classe) {
      classesMap.set(classe, (classesMap.get(classe) || 0) + 1);
    }

    const local = auditoria.local;
    if (local) {
      locaisMap.set(local, (locaisMap.get(local) || 0) + 1);
    }
  });

  // Log para verificar os dados mapeados
  console.log(`📋 Situações encontradas para ${tipo}:`, Object.fromEntries(situacaoMap));
  console.log(`👥 Usuários únicos: ${usuariosUnicos.size}`);
  console.log(`📊 Classes encontradas:`, Object.fromEntries(classesMap));
  console.log(`📍 Locais encontrados:`, Object.fromEntries(locaisMap));

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

    // Calcular itens válidos (itens que podem ser processados)
    // Itens válidos são aqueles que foram:
    // - Atualizados (itens com situação "Atualizado")
    // - Desatualizados (itens lidos mas marcados como desatualizados)
    // - Não lidos com estoque (itens não lidos mas com estoque no sistema)
    // - Lido não pertence (itens lidos mas que não pertencem à loja, também são válidos)
    this.etiquetas.itensValidos =
      this.etiquetas.itensAtualizados +
      this.etiquetas.itensDesatualizado +
      this.etiquetas.itensNaolidos +
      this.etiquetas.itensNaopertence;

    // Calcular percentuais (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itens lidos / itens válidos) * 100
    // Itens lidos = itens atualizados + itens desatualizados
    // Percentual restante = 100 - percentualConclusao (garante soma exata de 100%)
    // Percentual desatualizado = (itens desatualizados / itens válidos) * 100
    if (this.etiquetas.itensValidos > 0) {
      // Para etiquetas: itens lidos = itens atualizados + itens desatualizados
      const itensLidosEtiquetas = this.etiquetas.itensAtualizados + this.etiquetas.itensDesatualizado;
      this.etiquetas.percentualConclusao = (itensLidosEtiquetas / this.etiquetas.itensValidos) * 100;
      // Percentual de itens desatualizados em relação aos itens válidos
      this.etiquetas.percentualDesatualizado = (this.etiquetas.itensDesatualizado / this.etiquetas.itensValidos) * 100;
    } else {
      this.etiquetas.percentualDesatualizado = 0;
    }
    this.etiquetas.percentualRestante =
      100 - this.etiquetas.percentualConclusao;
    this.etiquetas.usuariosAtivos = usuariosUnicos.size;

    // Atualizar contadores
    for (const [classe, count] of classesMap) {
      if (this.etiquetas.contadorClasses.hasOwnProperty(classe)) {
        this.etiquetas.contadorClasses[classe] = count;
      }
    }

    for (const [local, count] of locaisMap) {
      if (this.etiquetas.contadorLocais.hasOwnProperty(local)) {
        this.etiquetas.contadorLocais[local] = count;
      }
    }
  }

  // Implementar lógica similar para rupturas e presenças
  if (tipo === "rupturas") {
    console.log(`🔄 Processando dados de ruptura...`);
    this.rupturas.totalItens = auditorias.length;

    // Calcular itens válidos: itens que podem ser processados
    // Baseado na lógica de ruptura, itens válidos seriam:
    // - itens com situação "Atualizado" (tem presença e tem estoque)
    // - itens com situação "Com problema" (não tem presença mas tem estoque - ausência de produto)
    this.rupturas.itensValidos = (situacaoMap.get("Atualizado") || 0) +
                                 (situacaoMap.get("Com problema") || 0);

    // itensLidos: quantidade de itens com situação "Com Presença e com Estoque"
    // Após normalização, essa situação se torna "Atualizado"
    this.rupturas.itensLidos = situacaoMap.get("Atualizado") || 0;

    // itensNaoLidos: quantidade de itens com situação "Sem Presença e Com Estoque"
    // Após normalização, essa situação se torna "Com problema"
    this.rupturas.itensNaoLidos = situacaoMap.get("Com problema") || 0;

    // custoTotalRuptura: soma do campo custoRuptura para itens com situação "Com problema"
    // A situação "Com problema" vem da normalização de "Sem Presença e Com Estoque"
    const itensRuptura = auditorias.filter(a => a.situacao === "Com problema");

    // Somar os valores de custoRuptura para esses itens
    let custoTotalRuptura = 0;
    for (const item of itensRuptura) {
      const valor = item.custoRuptura || 0;
      if (valor > 0) {
        custoTotalRuptura += valor;
      }
    }
    this.rupturas.custoTotalRuptura = custoTotalRuptura;

    console.log(`📈 Dados de ruptura antes do cálculo: totalItens=${this.rupturas.totalItens}, itensValidos=${this.rupturas.itensValidos}, itensLidos=${this.rupturas.itensLidos}, itensNaoLidos=${this.rupturas.itensNaoLidos}, custoTotalRuptura=${this.rupturas.custoTotalRuptura}`);

    // Calcular percentuais (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itensLidos / itensValidos) * 100
    if (this.rupturas.itensValidos > 0) {
      this.rupturas.percentualConclusao =
        (this.rupturas.itensLidos / this.rupturas.itensValidos) * 100;
      this.rupturas.percentualRestante =
        100 - this.rupturas.percentualConclusao;
    } else {
      this.rupturas.percentualConclusao = 0;
      this.rupturas.percentualRestante = 100;
    }

    this.rupturas.usuariosAtivos = usuariosUnicos.size;

    // Atualizar contadores
    for (const [classe, count] of classesMap) {
      if (this.rupturas.contadorClasses.hasOwnProperty(classe)) {
        this.rupturas.contadorClasses[classe] = count;
      }
    }

    for (const [local, count] of locaisMap) {
      if (this.rupturas.contadorLocais.hasOwnProperty(local)) {
        this.rupturas.contadorLocais[local] = count;
      }
    }

    console.log(`📋 Contadores de classes atualizados para ruptura:`, this.rupturas.contadorClasses);
  }

  if (tipo === "presencas") {
    this.presencas.totalItens = auditorias.length;

    // Calcular itens válidos: itens que podem ser processados
    // Baseado na lógica de presença, itens válidos seriam:
    // - itens com situação "Atualizado" (tem presença e tem estoque)
    // - itens com situação "Com problema" (não tem presença mas tem estoque - ausência de produto)
    this.presencas.itensValidos = (situacaoMap.get("Atualizado") || 0) +
                                  (situacaoMap.get("Com problema") || 0);

    // Calcular itens não lidos: itens com situação "Com problema" (ausência de produto)
    this.presencas.itensNaoLidos = situacaoMap.get("Com problema") || 0;

    // Calcular itens atualizados: itens com situação "Atualizado" (com presença e com estoque)
    this.presencas.itensAtualizados = situacaoMap.get("Atualizado") || 0;

    // Calcular presencas confirmadas: quantidade de itens com as situações:
    // [Com Presença e Com Estoque] + [Com Presença e sem Estoque] + [Lido não pertence]
    // [Com Presença e Com Estoque] → normalizado para "Atualizado"
    // [Lido não pertence] → já está normalizado como "Lido não pertence"
    // [Com Presença e sem Estoque] → pode não estar normalizado, então vamos checar o valor original ou o valor normalizado
    // Para esta situação específica, vamos contar:
    // - Itens com situação "Atualizado" (eram "Com Presença e Com Estoque")
    // - Itens com situação "Lido não pertence"
    // - Itens que poderiam ter sido originalmente "Com Presença e sem Estoque"

    // Contando itens com situação normalizada "Atualizado" e "Lido não pertence"
    const itensAtualizado = situacaoMap.get("Atualizado") || 0;
    const itensLidoNaoPertence = situacaoMap.get("Lido não pertence") || 0;

    // Para "Com Presença e sem Estoque", vamos procurar por possíveis valores normalizados ou originais
    // Pode ser que não esteja normalizado e permaneça com o nome original
    // A situação pode não estar normalizada e permanecer como "Com Presença e sem Estoque"
    const itensComPresencaSemEstoque = situacaoMap.get("Com Presença e sem Estoque") || 0;

    // Fazendo uma soma mais precisa das presenças confirmadas
    this.presencas.presencasConfirmadas = itensAtualizado + itensLidoNaoPertence + itensComPresencaSemEstoque;

    // Calcular custo de ruptura: soma do campo custoRuptura para itens de presença com situação "Com problema" (ausência de produto)
    // A situação "Com problema" vem da normalização de "Sem Presença e Com Estoque"
    const itensRuptura = auditorias.filter(a => a.situacao === "Com problema" && a.tipo === "presenca");

    // Somar os valores de custoRuptura para esses itens
    let custoTotalRuptura = 0;
    for (const item of itensRuptura) {
      const valor = item.custoRuptura || 0;
      if (valor > 0) {
        custoTotalRuptura += valor;
      }
    }
    this.presencas.custoRuptura = custoTotalRuptura;

    // Novo campo: rupturaSemPresenca - calcula o custo de ruptura especificamente para itens com situação original "Sem Presença e Com Estoque"
    // A abordagem é identificar itens com situação normalizada "Com problema" que tinham originalmente "sem presença e com estoque"
    // Vamos tentar uma abordagem mais direta para evitar duplicatas ou somas incorretas
    let rupturaSemPresencaTotal = 0;
    const itensRupturaSemPresenca = auditorias.filter(a => a.situacao === "Com problema" && a.tipo === "presenca");
    for (const item of itensRupturaSemPresenca) {
      const valor = item.custoRuptura || 0;
      if (valor > 0) {
        // Adicionando um log para debug caso seja necessário
        rupturaSemPresencaTotal += valor;
      }
    }
    this.presencas.rupturaSemPresenca = rupturaSemPresencaTotal;

    // Calcular percentual (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itensAtualizados / itensValidos) * 100
    if (this.presencas.itensValidos > 0) {
      this.presencas.percentualConclusao =
        (this.presencas.itensAtualizados / this.presencas.itensValidos) * 100;
    }
    this.presencas.percentualRestante =
      100 - this.presencas.percentualConclusao;
    this.presencas.usuariosAtivos = usuariosUnicos.size;

    // Atualizar contadores
    for (const [classe, count] of classesMap) {
      if (this.presencas.contadorClasses.hasOwnProperty(classe)) {
        this.presencas.contadorClasses[classe] = count;
      }
    }

    for (const [local, count] of locaisMap) {
      if (this.presencas.contadorLocais.hasOwnProperty(local)) {
        this.presencas.contadorLocais[local] = count;
      }
    }
  }

  console.log(`🔍 Iniciando cálculo de métricas por classe e local para ${tipo}`);
  // Calcular métricas por classe de produto
  this.calcularMetricasPorClasse(auditorias, tipo);

  // Calcular métricas por local
  this.calcularMetricasPorLocal(auditorias, tipo);

  // Atualizar totais após modificação
  this.atualizarTotais();

  console.log(`✅ Processamento de ${tipo} concluído. Totais atualizados.`);
};

// Método para calcular métricas por classe de produto
lojaDailyMetricsSchema.methods.calcularMetricasPorClasse = function (auditorias, tipo) {
  if (!auditorias || auditorias.length === 0) return;

  // Inicializar objeto para armazenar métricas por classe - dinamicamente
  const metricasPorClasse = {};

  // Primeiro, percorrer todas as auditorias para identificar todas as classes existentes
  for (const auditoria of auditorias) {
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (!classe) continue; // Pular se não tiver classe definida

    // Inicializar a classe no objeto se ainda não existir
    if (!metricasPorClasse.hasOwnProperty(classe)) {
      metricasPorClasse[classe] = { total: 0, itensValidos: 0, lidos: 0, usuarios: {} };
    }
  }

  // Processar cada auditoria
  let contadorDebug = 0;
  for (const auditoria of auditorias) {
    // Determinar classe do produto
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (!classe) continue; // Pular se não tiver classe definida

    // Determinar usuário da auditoria (ID e nome)
    const usuarioId = auditoria.usuarioId || auditoria.Usuario;
    const usuarioNome = auditoria.usuarioNome || auditoria.Nome; // Procurar por possíveis campos de nome

    // Agora a classe já está garantida no objeto de métricas
    if (metricasPorClasse.hasOwnProperty(classe)) {
      const situacao = auditoria.situacao || auditoria.Situacao;

      // Log de debug para as primeiras auditorias
      if (contadorDebug < 5 && (tipo === 'rupturas' || tipo === 'presencas')) {
        console.log(`🔍 [${tipo}] Processando auditoria ${contadorDebug + 1}:`, {
          classe: classe,
          situacao: situacao,
          codigo: auditoria.codigo
        });
        contadorDebug++;
      }

      // Incrementar total (todos os itens)
      metricasPorClasse[classe].total++;

      // Incrementar itens válidos (seguindo lógica específica por tipo de auditoria)
      if (tipo === 'etiquetas') {
        // Para etiquetas: itens válidos = Atualizado + Desatualizado + Não lidos com estoque + Lido não pertence
        // EXCLUINDO: "Sem Estoque" e "Lido sem estoque"
        if (
          situacao === "Atualizado" ||
          situacao === "Desatualizado" ||
          situacao === "Não lidos com estoque" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorClasse[classe].itensValidos++;
        }
      } else if (tipo === 'rupturas') {
        // Para rupturas: itens válidos = "Atualizado" (com presença e com estoque) + "Com problema" (sem presença mas com estoque)
        // Ambos representam itens que podem ser processados no contexto de ruptura
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema"
        ) {
          metricasPorClasse[classe].itensValidos++;
        }
      } else if (tipo === 'presencas') {
        // Para presenças: itens válidos devem incluir todos os itens que podem ter presença confirmada ou ausente
        // Para presença: itens válidos = "Atualizado" (com presença e estoque) +
        // "Com problema" (sem presença mas com estoque) +
        // "Lido não pertence" (lido mas não pertence) +
        // "Não lidos com estoque" (não lidos mas com estoque)
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema" ||
          situacao === "Lido não pertence" ||
          situacao === "Não lidos com estoque"
        ) {
          metricasPorClasse[classe].itensValidos++;
        }
      }

      // Incrementar itens lidos - definição varia por tipo de auditoria
      if (tipo === 'etiquetas') {
        // Para etiquetas: itens lidos = "Atualizado" + "Desatualizado" + "Lido não pertence"
        if (
          situacao === "Atualizado" ||
          situacao === "Desatualizado" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorClasse[classe].lidos++;
        }
      } else if (tipo === 'rupturas') {
        // Para rupturas: itens lidos = "Atualizado" (itens com presença e com estoque confirmados)
        if (situacao === "Atualizado") {
          metricasPorClasse[classe].lidos++;
        }
      } else if (tipo === 'presencas') {
        // Para presencas: itens lidos = "Atualizado" + "Com Presença e sem Estoque" + "Lido não pertence"
        // "Atualizado" representa "Com Presença e com Estoque" (normalizado)
        // "Com Presença e sem Estoque" pode estar em seu formato original
        // "Lido não pertence" permanece como está
        if (
          situacao === "Atualizado" ||
          situacao === "Com Presença e sem Estoque" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorClasse[classe].lidos++;
        }
      }

      // Incrementar contagem de usuários por classe (somente se tiver ID de usuário)
      if (usuarioId) { // Apenas se tiver ID de usuário
        // Usar o nome do usuário como chave e armazenar a contagem
        const usuarioChave = usuarioNome || `Usuário ${usuarioId}`; // Usar nome como chave

        if (metricasPorClasse[classe].usuarios[usuarioChave]) {
          // Se o usuário já existe na classe, apenas incrementar os itens lidos
          metricasPorClasse[classe].usuarios[usuarioChave]++;
        } else {
          // Se for a primeira vez do usuário na classe, adicionar com 1 item lido
          metricasPorClasse[classe].usuarios[usuarioChave] = 1;
        }
      } else {
        // Registrar log de auditoria sem usuário para debug
        console.log(`⚠️ Auditoria encontrada sem ID de usuário para tipo "${tipo}", classe "${classe}", situação "${situacao}", código "${auditoria.codigo}"`);
      }
    }
  }

  // Calcular percentuais e atualizar o campo correspondente
  const classesLeitura = {};
  for (const [classe, valores] of Object.entries(metricasPorClasse)) {
    // A fórmula correta para o percentual é (lidos / itensValidos)
    const percentual = valores.itensValidos > 0 ? (valores.lidos / valores.itensValidos) * 100 : 0;

    // Log de debug para classes com percentual > 100%
    if (percentual > 100) {
      console.log(`⚠️ [${tipo}] AVISO: Percentual > 100% na classe ${classe}:`, {
        total: valores.total,
        itensValidos: valores.itensValidos,
        lidos: valores.lidos,
        percentual: percentual
      });
    }

    classesLeitura[classe] = {
      total: valores.total,
      itensValidos: valores.itensValidos,
      lidos: valores.lidos,
      percentual: percentual,
      usuarios: valores.usuarios,
    };
  }

  // Atualizar os campos na estrutura correta para o tipo de auditoria
  if (tipo === 'etiquetas') {
    // Garantir que o objeto esteja completamente atualizado
    this.etiquetas.classesLeitura = JSON.parse(JSON.stringify(classesLeitura));
  } else if (tipo === 'rupturas') {
    // Garantir que o objeto esteja completamente atualizado
    console.log(`📊 Atualizando classesLeitura para rupturas:`, JSON.stringify(classesLeitura, null, 2));
    this.rupturas.classesLeitura = JSON.parse(JSON.stringify(classesLeitura));
    console.log(`✅ classesLeitura para rupturas atualizadas. Total de classes: ${Object.keys(this.rupturas.classesLeitura).length}`);
  } else if (tipo === 'presencas') {
    // Garantir que o objeto esteja completamente atualizado
    this.presencas.classesLeitura = JSON.parse(JSON.stringify(classesLeitura));
  }
};

// Método para calcular métricas por local (corredor)
lojaDailyMetricsSchema.methods.calcularMetricasPorLocal = function (auditorias, tipo) {
  if (!auditorias || auditorias.length === 0) return;

  // Inicializar objeto para armazenar métricas por local - dinamicamente
  const metricasPorLocal = {};

  // Primeiro, percorrer todas as auditorias para identificar todos os locais existentes
  for (const auditoria of auditorias) {
    const localValue = auditoria.local;
    if (!localValue) continue; // Pular se não tiver local definido

    // Inicializar o local no objeto se ainda não existir
    if (!metricasPorLocal.hasOwnProperty(localValue)) {
      metricasPorLocal[localValue] = { total: 0, itensValidos: 0, lidos: 0, usuarios: {} };
    }
  }

  // Processar cada auditoria
  for (const auditoria of auditorias) {
    const localValue = auditoria.local;
    if (!localValue) continue; // Pular se não tiver local definido

    // Determinar usuário da auditoria (ID e nome)
    const usuarioId = auditoria.usuarioId || auditoria.Usuario;
    const usuarioNome = auditoria.usuarioNome || auditoria.Nome; // Procurar por possíveis campos de nome

    // Agora o local já está garantido no objeto de métricas
    if (metricasPorLocal.hasOwnProperty(localValue)) {
      const situacao = auditoria.situacao || auditoria.Situacao;

      // Incrementar total (todos os itens)
      metricasPorLocal[localValue].total++;

      // Incrementar itens válidos (seguindo lógica específica por tipo de auditoria)
      if (tipo === 'etiquetas') {
        // Para etiquetas: itens válidos = Atualizado + Desatualizado + Não lidos com estoque + Lido não pertence
        // EXCLUINDO: "Sem Estoque" e "Lido sem estoque"
        if (
          situacao === "Atualizado" ||
          situacao === "Desatualizado" ||
          situacao === "Não lidos com estoque" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorLocal[localValue].itensValidos++;
        }
      } else if (tipo === 'rupturas') {
        // Para rupturas: itens válidos = "Atualizado" (com presença e com estoque) + "Com problema" (sem presença mas com estoque)
        // Ambos representam itens que podem ser processados no contexto de ruptura
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema"
        ) {
          metricasPorLocal[localValue].itensValidos++;
        }
      } else if (tipo === 'presencas') {
        // Para presenças: itens válidos devem incluir todos os itens que podem ter presença confirmada ou ausente
        // Para presença: itens válidos = "Atualizado" (com presença e estoque) +
        // "Com problema" (sem presença mas com estoque) +
        // "Lido não pertence" (lido mas não pertence) +
        // "Não lidos com estoque" (não lidos mas com estoque)
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema" ||
          situacao === "Lido não pertence" ||
          situacao === "Não lidos com estoque"
        ) {
          metricasPorLocal[localValue].itensValidos++;
        }
      }

      // Incrementar itens lidos - definição varia por tipo de auditoria
      if (tipo === 'etiquetas') {
        // Para etiquetas: itens lidos = "Atualizado" + "Desatualizado" + "Lido não pertence"
        if (
          situacao === "Atualizado" ||
          situacao === "Desatualizado" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorLocal[localValue].lidos++;
        }
      } else if (tipo === 'rupturas') {
        // Para rupturas: itens válidos = "Atualizado" + "Com problema" (itens que podem ser processados)
        // Para rupturas: itens lidos = "Atualizado" (itens com presença e com estoque confirmados)
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema"
        ) {
          metricasPorLocal[localValue].itensValidos++;
        }
        if (situacao === "Atualizado") {
          metricasPorLocal[localValue].lidos++;
        }
      } else if (tipo === 'presencas') {
        // Para presencas: itens lidos = "Atualizado" + "Com Presença e sem Estoque" + "Lido não pertence"
        // "Atualizado" representa "Com Presença e com Estoque" (normalizado)
        // "Com Presença e sem Estoque" pode estar em seu formato original
        // "Lido não pertence" permanece como está
        if (
          situacao === "Atualizado" ||
          situacao === "Com Presença e sem Estoque" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorLocal[localValue].lidos++;
        }

        // Adicionando contador específico para itens com presença confirmada (necessário para cálculo de percentual)
        // Itens com presença confirmada = "Atualizado" + "Lido não pertence" + "Com Presença e sem Estoque"
        if (situacao === "Atualizado" || situacao === "Lido não pertence" || situacao === "Com Presença e sem Estoque") {
          // Adicionando um campo temporário para armazenar itens com presença, se não existir
          if (!metricasPorLocal[localValue].itensComPresenca) {
            metricasPorLocal[localValue].itensComPresenca = 0;
          }
          metricasPorLocal[localValue].itensComPresenca++;
        }
      }

      // Incrementar contagem de usuários (somente se tiver ID de usuário)
      if (usuarioId) {
        // Usar o nome do usuário como chave e armazenar a contagem
        const usuarioChave = usuarioNome || `Usuário ${usuarioId}`; // Usar nome como chave

        if (metricasPorLocal[localValue].usuarios[usuarioChave]) {
          // Se o usuário já existe no local, apenas incrementar os itens lidos
          metricasPorLocal[localValue].usuarios[usuarioChave]++;
        } else {
          // Se for a primeira vez do usuário no local, adicionar com 1 item lido
          metricasPorLocal[localValue].usuarios[usuarioChave] = 1;
        }
      } else {
        // Registrar log de auditoria sem usuário para debug
        console.log(`⚠️ Auditoria encontrada sem ID de usuário para tipo "${tipo}", local "${localValue}", situação "${situacao}"`);
      }
    }
  }

  // Calcular percentuais e atualizar o campo correspondente
  const locaisLeitura = {};
  for (const [local, valores] of Object.entries(metricasPorLocal)) {
    // A fórmula para o percentual varia por tipo de auditoria
    let percentual = 0;
    if (valores.itensValidos > 0) {
      if (tipo === 'presencas') {
        // Para presenças, o percentual deve ser baseado na quantidade de itens com presença confirmada
        // Itens com presença confirmada = "Atualizado" + "Lido não pertence"
        // Precisamos contar separadamente porque "lidos" pode incluir "Com problema" que não é presença
        // Recontar itens com presença para este local
        let itensComPresenca = 0;
        // Neste estágio, precisamos confiar nos cálculos feitos anteriormente
        // O contador de itens com presença precisa ser implementado diretamente no loop acima
        // Adicionando contador temporário para itens com presença no objeto
        if (!valores.itensComPresenca) {
          valores.itensComPresenca = 0; // Inicializar se não existir
        }
        const itensPresenca = valores.itensComPresenca || 0;
        percentual = (itensPresenca / valores.itensValidos) * 100;
      } else {
        // Para etiquetas e rupturas, a fórmula padrão é (lidos / itensValidos)
        percentual = (valores.lidos / valores.itensValidos) * 100;
      }
    }

    // Garantir que o percentual não exceda 100%
    if (percentual > 100) {
      console.log(`⚠️ Percentual acima de 100% detectado: ${percentual}% para tipo ${tipo}, local ${local}`);
      console.log(`   Itens lidos: ${valores.lidos}, Itens válidos: ${valores.itensValidos}, Itens com presença: ${valores.itensComPresenca || 0}`);
      percentual = 100; // Limitar ao máximo de 100%
    }

    console.log(`[DIAGNÓSTICO CÁLCULO LOCAL] tipo: ${tipo}, local: ${local}, lidos: ${valores.lidos}, itensValidos: ${valores.itensValidos}, itensComPresenca: ${valores.itensComPresenca || 0}, percentual: ${percentual}`);

    locaisLeitura[local] = {
      total: valores.total,
      itensValidos: valores.itensValidos,
      lidos: valores.lidos,
      percentual: percentual,
      usuarios: valores.usuarios,
    };
  }

  // Atualizar os campos na estrutura correta para o tipo de auditoria
  if (tipo === 'etiquetas') {
    // Garantir que o objeto esteja completamente atualizado
    this.etiquetas.locaisLeitura = JSON.parse(JSON.stringify(locaisLeitura));
  } else if (tipo === 'rupturas') {
    // Garantir que o objeto esteja completamente atualizado
    console.log(`📍 Atualizando locaisLeitura para rupturas:`, JSON.stringify(locaisLeitura, null, 2));
    this.rupturas.locaisLeitura = JSON.parse(JSON.stringify(locaisLeitura));
    console.log(`✅ locaisLeitura para rupturas atualizadas. Total de locais: ${Object.keys(this.rupturas.locaisLeitura).length}`);
  } else if (tipo === 'presencas') {
    // Garantir que o objeto esteja completamente atualizado
    this.presencas.locaisLeitura = JSON.parse(JSON.stringify(locaisLeitura));
  }
};

export default mongoose.model("LojaDailyMetrics", lojaDailyMetricsSchema);