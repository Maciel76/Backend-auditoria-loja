import mongoose from "mongoose";

const planilhaSchema = new mongoose.Schema(
  {
    nomeArquivo: {
      type: String,
      required: true,
      index: true,
    },
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
    tipoAuditoria: {
      // ⬅️ NOVO CAMPO ADICIONADO
      type: String,
      enum: ["etiqueta", "presenca", "ruptura"],
      default: "etiqueta",
      index: true,
    },
    totalItens: {
      type: Number,
      default: 0,
    },
    totalItensLidos: {
      type: Number,
      default: 0,
    },
    taxaConclusao: {
      // ⬅️ CAMPO ADICIONADO (útil para relatórios)
      type: Number,
      default: 0,
    },
    usuariosEnvolvidos: [String],
    metadata: {
      // ⬅️ CAMPO ADICIONADO (para informações extras)
      tamanhoArquivo: Number,
      formato: String,
      totalLinhas: Number,
      processamentoCompleto: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true, // ⬅️ Adiciona createdAt e updatedAt automaticamente
  }
);

// Índice composto para consultas otimizadas
planilhaSchema.index({ dataAuditoria: 1, tipoAuditoria: 1 });
planilhaSchema.index({ dataUpload: -1 });
planilhaSchema.index({ usuariosEnvolvidos: 1 });

// Middleware para calcular taxa de conclusão automaticamente
planilhaSchema.pre("save", function (next) {
  if (this.totalItens > 0) {
    this.taxaConclusao = (this.totalItensLidos / this.totalItens) * 100;
  }
  next();
});

export default mongoose.model("Planilha", planilhaSchema);
