// models/Aviso.js - Modelo para avisos importantes
import mongoose from "mongoose";

const avisoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    conteudo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    prioridade: {
      type: String,
      enum: ['baixa', 'media', 'alta', 'critica'],
      default: 'media',
    },
    status: {
      type: String,
      enum: ['pendente', 'aprovado', 'rejeitado', 'arquivado'],
      default: 'pendente',
    },
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      index: true,
    },
    autor: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dataPublicacao: {
      type: Date,
    },
    dataExpiracao: {
      type: Date,
    },
    visualizacoes: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para otimizar consultas
avisoSchema.index({ status: 1, prioridade: 1 });
avisoSchema.index({ loja: 1, createdAt: -1 });
avisoSchema.index({ createdAt: -1 });
avisoSchema.index({ dataExpiracao: 1 });

// Virtual para verificar se está expirado
avisoSchema.virtual('expirado').get(function() {
  return this.dataExpiracao && this.dataExpiracao < new Date();
});

// Virtual para formatação da data
avisoSchema.virtual('dataFormatada').get(function() {
  return this.createdAt.toLocaleDateString('pt-BR');
});

export default mongoose.model("Aviso", avisoSchema);