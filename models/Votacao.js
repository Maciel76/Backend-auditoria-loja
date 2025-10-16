// models/Votacao.js - Modelo para votações de melhorias
import mongoose from "mongoose";

const votacaoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    descricao: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    beneficios: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pendente', 'aprovado', 'ativo', 'finalizado', 'rejeitado'],
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
    dataInicio: {
      type: Date,
    },
    dataFim: {
      type: Date,
    },
    reactions: {
      like: {
        count: { type: Number, default: 0 },
        users: [{ type: String }] // IPs ou IDs de usuários
      },
      dislike: {
        count: { type: Number, default: 0 },
        users: [{ type: String }]
      },
      fire: {
        count: { type: Number, default: 0 },
        users: [{ type: String }]
      },
      heart: {
        count: { type: Number, default: 0 },
        users: [{ type: String }]
      }
    },
    comentarios: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comentario: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },
      data: {
        type: Date,
        default: Date.now,
      }
    }],
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
votacaoSchema.index({ status: 1, createdAt: -1 });
votacaoSchema.index({ loja: 1, createdAt: -1 });
votacaoSchema.index({ dataFim: 1 });

// Virtual para verificar se está ativa
votacaoSchema.virtual('ativa').get(function() {
  const agora = new Date();
  return this.status === 'ativo' &&
         this.dataInicio <= agora &&
         this.dataFim >= agora;
});

// Virtual para total de reações
votacaoSchema.virtual('totalReacoes').get(function() {
  if (!this.reactions) return 0;
  return Object.values(this.reactions).reduce((total, reaction) => {
    return total + (reaction.count || 0);
  }, 0);
});

// Virtual para reação mais popular
votacaoSchema.virtual('reacaoMaisPopular').get(function() {
  if (!this.reactions) return null;
  let maxCount = 0;
  let topReaction = null;

  Object.entries(this.reactions).forEach(([type, reaction]) => {
    if (reaction.count > maxCount) {
      maxCount = reaction.count;
      topReaction = type;
    }
  });

  return topReaction;
});

export default mongoose.model("Votacao", votacaoSchema);