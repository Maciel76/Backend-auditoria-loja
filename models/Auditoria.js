// models/Auditoria.js
import mongoose from "mongoose";

const auditoriaSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      required: true,
    },
    contador: {
      type: Number,
      default: 0,
    },
    detalhes: [
      {
        codigo: String,
        produto: String,
        local: String,
        situacao: String,
        estoque: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Auditoria", auditoriaSchema);
