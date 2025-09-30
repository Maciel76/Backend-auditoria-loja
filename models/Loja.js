// models/Loja.js
import mongoose from "mongoose";

const lojaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nome: {
      type: String,
      required: true,
    },
    cidade: {
      type: String,
    },
    endereco: {
      type: String,
    },
    regiao: {
      type: String,
    },
    imagem: {
      type: String,
      default: "/images/lojas/default.jpg",
    },
    ativa: {
      type: Boolean,
      default: true,
    },
    metadata: {
      telefone: String,
      email: String,
      gerente: String,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para otimização
lojaSchema.index({ codigo: 1 });
lojaSchema.index({ ativa: 1 });

export default mongoose.model("Loja", lojaSchema);
