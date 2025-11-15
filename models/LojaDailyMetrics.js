// models/LojaDailyMetrics.js - Métricas diárias da loja (período diário)
import mongoose from "mongoose";

// Schema para contadores de leitura por classe de produto
const classesLeituraSchema = new mongoose.Schema({
  "A CLASSIFICAR": {
    total: { type: Number, default: 0 },  // Total itens da classe (todos)
    itensValidos: { type: Number, default: 0 },  // Itens válidos da classe (excluindo "Sem Estoque")
    lidos: { type: Number, default: 0 },  // Quantidade de itens lidos (atualizados + desatualizado + nao_pertence)
    percentual: { type: Number, default: 0 }, // Percentual (lidos/itensValidos)
  },
  "ALTO GIRO": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  BAZAR: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  DIVERSOS: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  DPH: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  FLV: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "LATICINIOS 1": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  LIQUIDA: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "PERECIVEL 1": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "PERECIVEL 2": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "PERECIVEL 2 B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "PERECIVEL 3": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "SECA DOCE": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "SECA SALGADA": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
  "SECA SALGADA 2": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
  },
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
  itensLidos: { type: Number, default: 0 },
  itensAtualizados: { type: Number, default: 0 }, // Com Presença e com Estoque
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão = (itensAtualizados / itensLidos) * 100
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  percentualDesatualizado: { type: Number, default: 0 }, // % rupturas desatualizadas (não aplicável na maioria dos casos)
  custoTotalRuptura: { type: Number, default: 0 },
  rupturasCriticas: { type: Number, default: 0 },
  usuariosAtivos: { type: Number, default: 0 },

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

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
  itensLidos: { type: Number, default: 0 },
  itensAtualizados: { type: Number, default: 0 },
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão = (itensAtualizados / itensLidos) * 100
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  percentualDesatualizado: { type: Number, default: 0 }, // % presencas desatualizadas (não aplicável na maioria dos casos)
  presencasConfirmadas: { type: Number, default: 0 },
  percentualPresenca: { type: Number, default: 0 },
  usuariosAtivos: { type: Number, default: 0 },

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

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

  // Usar itensValidos para etiquetas e itensLidos para outros
  this.totais.itensLidos =
    this.etiquetas.itensValidos +
    this.rupturas.itensLidos +
    this.presencas.itensLidos;

  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensAtualizados +
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
    this.rupturas.totalItens = auditorias.length;
    this.rupturas.itensAtualizados =
      situacaoMap.get("Com Presença e com Estoque") || 0;
    this.rupturas.itensLidos = auditorias.filter(
      (a) => a.situacao !== "Não lido"
    ).length;

    // Calcular percentual (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itens atualizados / itens lidos) * 100
    // Percentual restante = 100 - percentualConclusao (garante soma exata de 100%)
    if (this.rupturas.itensLidos > 0) {
      this.rupturas.percentualConclusao =
        (this.rupturas.itensAtualizados / this.rupturas.itensLidos) * 100;
    }
    this.rupturas.percentualRestante = 100 - this.rupturas.percentualConclusao;
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
  }

  if (tipo === "presencas") {
    this.presencas.totalItens = auditorias.length;
    this.presencas.itensAtualizados = situacaoMap.get("Confirmado") || 0;
    this.presencas.itensLidos = auditorias.filter(
      (a) => a.situacao !== "Não lido"
    ).length;
    this.presencas.presencasConfirmadas = this.presencas.itensAtualizados;

    // Calcular percentual (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itens atualizados / itens lidos) * 100
    // Percentual restante = 100 - percentualConclusao (garante soma exata de 100%)
    if (this.presencas.itensLidos > 0) {
      this.presencas.percentualConclusao =
        (this.presencas.itensAtualizados / this.presencas.itensLidos) * 100;
      this.presencas.percentualPresenca = this.presencas.percentualConclusao;
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

  // Calcular métricas por classe de produto
  this.calcularMetricasPorClasse(auditorias, tipo);

  // Atualizar totais após modificação
  this.atualizarTotais();
};

// Método para calcular métricas por classe de produto
lojaDailyMetricsSchema.methods.calcularMetricasPorClasse = function (auditorias, tipo) {
  if (!auditorias || auditorias.length === 0) return;

  // Inicializar objeto para armazenar métricas por classe
  const metricasPorClasse = {
    "A CLASSIFICAR": { total: 0, itensValidos: 0, lidos: 0 },
    "ALTO GIRO": { total: 0, itensValidos: 0, lidos: 0 },
    BAZAR: { total: 0, itensValidos: 0, lidos: 0 },
    DIVERSOS: { total: 0, itensValidos: 0, lidos: 0 },
    DPH: { total: 0, itensValidos: 0, lidos: 0 },
    FLV: { total: 0, itensValidos: 0, lidos: 0 },
    "LATICINIOS 1": { total: 0, itensValidos: 0, lidos: 0 },
    LIQUIDA: { total: 0, itensValidos: 0, lidos: 0 },
    "PERECIVEL 1": { total: 0, itensValidos: 0, lidos: 0 },
    "PERECIVEL 2": { total: 0, itensValidos: 0, lidos: 0 },
    "PERECIVEL 2 B": { total: 0, itensValidos: 0, lidos: 0 },
    "PERECIVEL 3": { total: 0, itensValidos: 0, lidos: 0 },
    "SECA DOCE": { total: 0, itensValidos: 0, lidos: 0 },
    "SECA SALGADA": { total: 0, itensValidos: 0, lidos: 0 },
    "SECA SALGADA 2": { total: 0, itensValidos: 0, lidos: 0 },
  };

  // Processar cada auditoria
  for (const auditoria of auditorias) {
    // Determinar classe do produto
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (!classe) continue; // Pular se não tiver classe definida

    // Verificar se a classe está no objeto de métricas
    if (metricasPorClasse.hasOwnProperty(classe)) {
      const situacao = auditoria.situacao || auditoria.Situacao;

      // Incrementar total (todos os itens)
      metricasPorClasse[classe].total++;

      // Incrementar itens válidos (seguindo mesma lógica de etiquetas.itensValidos)
      // Itens válidos = Atualizado + Desatualizado + Não lidos com estoque + Lido não pertence
      // EXCLUINDO: "Sem Estoque" e "Lido sem estoque"
      if (
        situacao === "Atualizado" ||
        situacao === "Desatualizado" ||
        situacao === "Não lidos com estoque" ||
        situacao === "Lido não pertence"
      ) {
        metricasPorClasse[classe].itensValidos++;
      }

      // Incrementar itens lidos
      // Itens lidos = Atualizado + Desatualizado + Lido não pertence
      if (
        situacao === "Atualizado" ||
        situacao === "Desatualizado" ||
        situacao === "Lido não pertence"
      ) {
        metricasPorClasse[classe].lidos++;
      }
    }
  }

  // Calcular percentuais e atualizar o campo correspondente
  const classesLeitura = {};
  for (const [classe, valores] of Object.entries(metricasPorClasse)) {
    // Percentual baseado em itensValidos (e não no total)
    classesLeitura[classe] = {
      total: valores.total,
      itensValidos: valores.itensValidos,
      lidos: valores.lidos,
      percentual: valores.itensValidos > 0 ? (valores.lidos / valores.itensValidos) * 100 : 0,
    };
  }

  // Atualizar os campos na estrutura correta para o tipo de auditoria
  if (tipo === 'etiquetas') {
    this.etiquetas.classesLeitura = classesLeitura;
  } else if (tipo === 'rupturas') {
    this.rupturas.classesLeitura = classesLeitura;
  } else if (tipo === 'presencas') {
    this.presencas.classesLeitura = classesLeitura;
  }
};

export default mongoose.model("LojaDailyMetrics", lojaDailyMetricsSchema);
