/**
 * MODELO: Article
 * ENDPOINTS ASSOCIADOS:
 * - POST /api/articles - Criar novo artigo
 * - GET /api/articles - Listar artigos com filtros e paginação
 * - GET /api/articles/featured - Obter artigo em destaque
 * - GET /api/articles/:id - Obter detalhes de um artigo específico
 * - GET /api/articles/slug/:slug - Buscar artigo por slug
 * - GET /api/articles/:id/related - Buscar artigos relacionados
 * - PUT /api/articles/:id - Atualizar artigo
 * - PUT /api/articles/:id/publish - Publicar artigo
 * - PUT /api/articles/:id/feature - Tornar artigo destaque
 * - DELETE /api/articles/:id - Deletar artigo
 * - POST /api/articles/:id/react - Reagir a um artigo
 * - POST /api/articles/:id/comentarios - Adicionar comentário
 * - GET /api/articles/stats/overview - Estatísticas gerais
 */
import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    conteudo: {
      type: String,
      required: true,
    },
    resumo: {
      type: String,
      trim: true,
      maxlength: 500,
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
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      index: true,
    },
    categorias: [{
      type: String,
      enum: ['tecnologia', 'negocios', 'marketing', 'design', 'dicas', 'tutoriais', 'noticias', 'geral'],
      default: 'geral',
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    destaque: {
      type: Boolean,
      default: false,
      index: true,
    },
    dataPublicacao: {
      type: Date,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    imagem: {
      type: String, // URL da imagem
    },
    visualizacoes: {
      type: Number,
      default: 0,
    },
    tempoLeitura: {
      type: Number, // em minutos
      default: 5,
    },
    reactions: {
      like: {
        count: { type: Number, default: 0 },
        users: [{ type: String }]
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
      nome: {
        type: String,
        trim: true,
      },
      comentario: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
      data: {
        type: Date,
        default: Date.now,
      }
    }],
    seo: {
      metaDescricao: String,
      palavrasChave: [String],
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes para otimização de consultas
articleSchema.index({ categorias: 1, status: 1 });
articleSchema.index({ loja: 1, createdAt: -1 });
articleSchema.index({ status: 1, dataPublicacao: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ destaque: 1, status: 1 });
articleSchema.index({ titulo: 'text', conteudo: 'text', resumo: 'text' });

// Virtuals
articleSchema.virtual('dataFormatada').get(function() {
  const data = this.dataPublicacao || this.createdAt;
  return data.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

articleSchema.virtual('totalReacoes').get(function() {
  if (!this.reactions) return 0;
  return Object.values(this.reactions).reduce((total, reaction) => {
    return total + (reaction.count || 0);
  }, 0);
});

articleSchema.virtual('tempoDecorrido').get(function() {
  const dataRef = this.dataPublicacao || this.createdAt;
  const agora = new Date();
  const diff = agora - dataRef;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 7) return `${dias} dias atrás`;
  if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
  return `${Math.floor(dias / 30)} meses atrás`;
});

// Middleware pre-save
articleSchema.pre('save', function(next) {
  // Auto-definir data de publicação ao publicar
  if (this.isModified('status') && this.status === 'published' && !this.dataPublicacao) {
    this.dataPublicacao = new Date();
  }

  // Gerar slug se não existir
  if (!this.slug && this.titulo) {
    this.slug = this.titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífen
      .replace(/-+/g, '-'); // Remove hífens duplicados

    // Adiciona timestamp para garantir unicidade
    this.slug = `${this.slug}-${Date.now()}`;
  }

  next();
});

// Métodos estáticos
articleSchema.statics.buscarDestaque = function() {
  return this.findOne({
    status: 'published',
    destaque: true
  })
    .sort({ dataPublicacao: -1 })
    .populate('loja', 'nome codigo')
    .populate('usuario', 'nome email foto');
};

articleSchema.statics.buscarPublicados = function(filtros = {}, limite = 20, pagina = 1) {
  const skip = (pagina - 1) * limite;
  return this.find({ ...filtros, status: 'published' })
    .sort({ dataPublicacao: -1, createdAt: -1 })
    .skip(skip)
    .limit(limite)
    .populate('loja', 'nome codigo')
    .populate('usuario', 'nome email foto');
};

articleSchema.statics.buscarPorCategoria = function(categoria, limite = 20) {
  return this.find({
    status: 'published',
    categorias: categoria
  })
    .sort({ dataPublicacao: -1 })
    .limit(limite)
    .populate('loja', 'nome codigo');
};

articleSchema.statics.buscarPorTag = function(tag, limite = 20) {
  return this.find({
    status: 'published',
    tags: tag
  })
    .sort({ dataPublicacao: -1 })
    .limit(limite)
    .populate('loja', 'nome codigo');
};

articleSchema.statics.buscarRelacionados = function(artigoId, categorias, tags, limite = 3) {
  return this.find({
    _id: { $ne: artigoId },
    status: 'published',
    $or: [
      { categorias: { $in: categorias } },
      { tags: { $in: tags } }
    ]
  })
    .sort({ visualizacoes: -1 })
    .limit(limite)
    .populate('loja', 'nome codigo');
};

// Métodos de instância
articleSchema.methods.incrementarVisualizacoes = function() {
  this.visualizacoes += 1;
  return this.save();
};

articleSchema.methods.publicar = function() {
  this.status = 'published';
  if (!this.dataPublicacao) {
    this.dataPublicacao = new Date();
  }
  return this.save();
};

articleSchema.methods.tornarDestaque = async function() {
  // Remove destaque de outros artigos
  await this.constructor.updateMany(
    { destaque: true },
    { $set: { destaque: false } }
  );

  // Define este como destaque
  this.destaque = true;
  return this.save();
};

export default mongoose.model("Article", articleSchema);
