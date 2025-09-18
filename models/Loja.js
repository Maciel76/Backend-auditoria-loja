// models/Loja.js
import mongoose from "mongoose";

const lojaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
    },
    nome: {
      type: String,
      required: true,
    },
    endereco: String,
    regiao: String,
    ativa: {
      type: Boolean,
      default: true,
    },
    usuarios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Loja", lojaSchema);
