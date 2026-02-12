/**
 * MODELO: MetricasDiarias
 * OBSERVAÇÃO: Este modelo é usado internamente pelo serviço metricasDiariasService
 * para processar métricas diárias de auditoria. Não possui endpoints próprios.
 */
// models/MetricasDiarias.js
import mongoose from "mongoose";

const metricasDiariasSchema = new mongoose.Schema(
  {
    // Referências básicas
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

    // Data específica da auditoria (não do cálculo)
    dataAuditoria: {
      type: Date,
      required: true,
      index: true,
    },

    // Tipo de auditoria para identificar qual métrica atualizar
    tipoAuditoria: {
      type: String,
      enum: ["etiqueta", "ruptura", "presenca"],
      required: true,
      index: true,
    },

    // MÉTRICAS ESPECÍFICAS POR TIPO - SEMPRE ATUALIZADAS COM A ÚLTIMA PLANILHA
    etiquetas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      itensDesatualizado: { type: Number, default: 0 },
      itensSemEstoque: { type: Number, default: 0 },
      itensNaopertence: { type: Number, default: 0 },
    },

    rupturas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      custoTotalRuptura: { type: Number, default: 0 },
      custoMedioRuptura: { type: Number, default: 0 },
    },

    presencas: {
      totalItens: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      itensSemEstoque: { type: Number, default: 0 },
      itensNaopertence: { type: Number, default: 0 },
      presencasConfirmadas: { type: Number, default: 0 },
    },

    // CONTADORES PARA FILTROS - ATUALIZADOS A CADA UPLOAD
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
          ["SECA SALGADO", 0],
          ["SECA SALGADO 2", 0],
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
          // ... (todos os locais do exemplo anterior)
        ]),
    },

    // TOTAIS CONSOLIDADOS DO DIA
    totais: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusaoGeral: { type: Number, default: 0 },
    },

    // METADATA
    ultimoUpload: {
      type: Date,
      default: Date.now,
    },
    nomeArquivo: {
      type: String,
      default: "",
    },
    versaoCalculo: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  },
);

// ÍNDICE ÚNICO: Garante apenas um registro por usuário/loja/data/tipo
metricasDiariasSchema.index(
  {
    loja: 1,
    usuarioId: 1,
    dataAuditoria: 1,
    tipoAuditoria: 1,
  },
  {
    unique: true,
    name: "unique_metricas_diarias",
  },
);

// Índices para performance
metricasDiariasSchema.index({ loja: 1, dataAuditoria: -1 });
metricasDiariasSchema.index({ usuarioId: 1, dataAuditoria: -1 });
metricasDiariasSchema.index({ tipoAuditoria: 1, dataAuditoria: -1 });

// Método para atualizar totais
metricasDiariasSchema.methods.atualizarTotais = function () {
  // Somar totais de todos os tipos de auditoria
  this.totais.totalItens =
    this.etiquetas.totalItens +
    this.rupturas.totalItens +
    this.presencas.totalItens;
  this.totais.itensLidos =
    (this.etiquetas.itensLidos || 0) +
    (this.rupturas.itensLidos || 0) +
    (this.presencas.totalItens || 0);
  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensAtualizados +
    this.presencas.itensAtualizados;

  if (this.totais.totalItens > 0) {
    this.totais.percentualConclusaoGeral = Math.round(
      (this.totais.itensAtualizados / this.totais.totalItens) * 100,
    );
  }

  this.ultimoUpload = new Date();
};

export default mongoose.model("MetricasDiarias", metricasDiariasSchema);
