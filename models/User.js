// models/User.js - UNIFICADO (substitui User, UserAudit, userRuptura)
import mongoose from "mongoose";

const detalheAuditoriaSchema = new mongoose.Schema({
  codigo: String,
  produto: String,
  local: String,
  situacao: String,
  estoque: String,
  tipoAuditoria: {
    type: String,
    enum: ["etiqueta", "presenca", "ruptura"],
    required: true,
  },
});

const auditoriaSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: true,
    index: true,
  },
  contador: {
    type: Number,
    default: 0,
  },
  detalhes: [detalheAuditoriaSchema],
});

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true,
    },
    nome: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    telefone: {
      type: String,
    },
    cargo: {
      type: String,
    },
    foto: {
      type: String,
    },
    contadorTotal: {
      type: Number,
      default: 0,
    },
    auditorias: [auditoriaSchema],
    // CAMPO LOJA - ObjectId referenciando Loja
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Índices compostos para queries otimizadas
userSchema.index({ loja: 1, nome: 1 });
userSchema.index({ loja: 1, contadorTotal: -1 });
userSchema.index({ "auditorias.data": -1 });

export default mongoose.model("User", userSchema);
