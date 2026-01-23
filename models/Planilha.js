/**
 * MODELO: Planilha
 * ENDPOINTS ASSOCIADOS:
 * - GET /dados-planilha - Buscar dados da planilha para uma loja
 * - GET /planilha/:id - Detalhes de uma planilha específica
 */
// models/Planilha.js - Metadata de arquivos processados
import mongoose from "mongoose";

const planilhaSchema = new mongoose.Schema(
  {
    // Referência à loja
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },

    // Informações do arquivo
    nomeArquivo: {
      type: String,
      required: true,
    },

    // Tipo de auditoria
    tipoAuditoria: {
      type: String,
      enum: ["etiqueta", "presenca", "ruptura"],
      required: true,
      index: true,
    },

    // Datas
    dataUpload: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dataAuditoria: {
      type: Date,
      required: true,
      index: true,
    },

    // Estatísticas do processamento
    totalItens: {
      type: Number,
      default: 0,
    },
    totalItensLidos: {
      type: Number,
      default: 0,
    },
    taxaConclusao: {
      type: Number,
      default: 0,
    },

    // Usuários envolvidos
    usuariosEnvolvidos: [String],

    // Metadata adicional
    metadata: {
      tamanhoArquivo: Number,
      formato: String,
      totalLinhas: Number,
      processamentoCompleto: {
        type: Boolean,
        default: false,
      },
      tempoProcessamento: Number, // em milissegundos
      erros: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas
planilhaSchema.index({ loja: 1, dataAuditoria: -1 });
planilhaSchema.index({ loja: 1, tipoAuditoria: 1, dataAuditoria: -1 });
planilhaSchema.index({ dataUpload: -1 });

// Middleware para calcular taxa de conclusão automaticamente
planilhaSchema.pre("save", function (next) {
  if (this.totalItens > 0) {
    this.taxaConclusao = Math.round(
      (this.totalItensLidos / this.totalItens) * 100
    );
  }
  next();
});

// Métodos úteis
planilhaSchema.methods.getEficiencia = function () {
  return this.taxaConclusao;
};

planilhaSchema.statics.buscarPorLoja = function (lojaId, tipo = null) {
  const query = { loja: lojaId };
  if (tipo) query.tipoAuditoria = tipo;
  return this.find(query).sort({ dataAuditoria: -1 });
};

planilhaSchema.statics.estatisticasGerais = function (lojaId) {
  return this.aggregate([
    { $match: { loja: lojaId } },
    {
      $group: {
        _id: "$tipoAuditoria",
        totalPlanilhas: { $sum: 1 },
        totalItens: { $sum: "$totalItens" },
        totalItensLidos: { $sum: "$totalItensLidos" },
        mediaEficiencia: { $avg: "$taxaConclusao" },
      },
    },
  ]);
};

export default mongoose.model("Planilha", planilhaSchema);
