// models/UserAudit.js
import mongoose from "mongoose";

const auditoriaSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  contador: { type: Number, default: 0 },
  detalhes: [
    {
      codigo: String,
      produto: String,
      local: String,
      situacao: String,
      estoque: String,
      tipoAuditoria: {
        type: String,
        enum: ["etiqueta", "presenca", "ruptura"],
        default: "etiqueta",
      },
    },
  ],
});

const userAuditSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    nome: { type: String, required: true },
    email: { type: String },
    telefone: { type: String },
    cargo: { type: String },
    foto: { type: String },
    contadorTotal: { type: Number, default: 0 },
    auditorias: [auditoriaSchema],
  },
  { timestamps: true }
);

// Criar índice composto para melhor performance nas consultas
userAuditSchema.index({ userId: 1, "auditorias.data": 1 });

export default mongoose.model("UserAudit", userAuditSchema);