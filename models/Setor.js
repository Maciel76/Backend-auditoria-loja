// models/Setor.js
import mongoose from "mongoose";

const SetorSchema = new mongoose.Schema(
  {
    codigo: String,
    produto: String,
    local: String,
    usuario: String,
    situacao: String,
    estoque: String,
    ultimaCompra: String,
    dataAuditoria: {
      type: Date,
      index: true,
    },
    // ATUALIZADO: loja agora é ObjectId
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para filtrar por loja e data
SetorSchema.index({ loja: 1, dataAuditoria: -1 });

export default mongoose.model("Setor", SetorSchema);
