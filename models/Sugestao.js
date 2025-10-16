// models/Sugestao.js - Modelo para sugestões de melhorias
import mongoose from "mongoose";

const sugestaoSchema = new mongoose.Schema(
  {
    sugestao: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    nome: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          // Email é opcional, mas se fornecido deve ser válido
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email inválido'
      }
    },
    tipo: {
      type: String,
      enum: ['dashboard', 'geral', 'ranking', 'auditoria', 'relatorios', 'voting'],
      default: 'geral',
    },
    status: {
      type: String,
      enum: ['pendente', 'analisando', 'implementado', 'rejeitado'],
      default: 'pendente',
    },
    prioridade: {
      type: String,
      enum: ['baixa', 'media', 'alta', 'critica'],
      default: 'media',
    },
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      index: true,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comentarioAdmin: {
      type: String,
      trim: true,
    },
    dataImplementacao: {
      type: Date,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    votos: {
      type: Number,
      default: 0,
    },
    votosUsuarios: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      voto: {
        type: Number,
        enum: [1, -1], // 1 para upvote, -1 para downvote
      },
      data: {
        type: Date,
        default: Date.now,
      }
    }],
    // Sistema de reações
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para otimizar consultas
sugestaoSchema.index({ tipo: 1, status: 1 });
sugestaoSchema.index({ loja: 1, createdAt: -1 });
sugestaoSchema.index({ status: 1, prioridade: 1 });
sugestaoSchema.index({ createdAt: -1 });

// Virtual para formatação da data
sugestaoSchema.virtual('dataFormatada').get(function() {
  return this.createdAt.toLocaleDateString('pt-BR');
});

// Virtual para tempo decorrido
sugestaoSchema.virtual('tempoDecorrido').get(function() {
  const agora = new Date();
  const diff = agora - this.createdAt;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 7) return `${dias} dias atrás`;
  if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
  return `${Math.floor(dias / 30)} meses atrás`;
});

// Middleware para atualizar votos
sugestaoSchema.pre('save', function(next) {
  if (this.isModified('votosUsuarios')) {
    this.votos = this.votosUsuarios.reduce((total, voto) => total + voto.voto, 0);
  }
  next();
});

export default mongoose.model("Sugestao", sugestaoSchema);