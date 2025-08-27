import mongoose from "mongoose";

const auditoriaSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: String,
      required: true,
    },
    usuarioNome: {
      type: String,
      required: true,
    },
    data: {
      type: Date,
      required: true,
      default: Date.now,
    },
    tipo: {
      type: String,
      enum: ["etiqueta", "presenca", "ruptura"],
      default: "etiqueta",
    },
    local: {
      type: String,
      required: true,
    },
    codigo: String,
    produto: String,
    situacao: {
      type: String,
      default: "Não lido",
      // REMOVIDO: enum restritivo - agora aceita qualquer valor
    },
    estoque: String,
    contador: {
      type: Number,
      default: 0,
    },
    metadata: {
      planilhaOrigem: String,
      dataUpload: Date,
      linhaPlanilha: Number,
      sincronizado: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhor performance nas consultas
auditoriaSchema.index({ data: 1 });
auditoriaSchema.index({ usuarioId: 1, data: 1 });
auditoriaSchema.index({ tipo: 1, data: 1 });
auditoriaSchema.index({ local: 1, data: 1 });
auditoriaSchema.index({ situacao: 1 });

export default mongoose.model("Auditoria", auditoriaSchema);
