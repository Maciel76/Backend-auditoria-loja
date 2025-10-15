import mongoose from "mongoose";

const dashboardActivitySchema = new mongoose.Schema({
  // Identificação
  id: {
    type: String,
    required: true,
    unique: true
  },

  // Tipo de atividade
  type: {
    type: String,
    required: true,
    enum: ['feature', 'suggestion', 'update', 'bug-fix', 'maintenance']
  },

  // Conteúdo
  title: {
    type: String,
    required: true,
    maxLength: 200
  },

  description: {
    type: String,
    required: true,
    maxLength: 1000
  },

  // Badge/Status
  badge: {
    type: String,
    enum: ['new', 'update', 'hot', 'important', null],
    default: null
  },

  // Interações
  votes: {
    type: Number,
    default: 0,
    min: 0
  },

  comments: {
    type: Number,
    default: 0,
    min: 0
  },

  // Usuário (se foi sugestão de usuário)
  user: {
    name: {
      type: String,
      maxLength: 100
    },
    avatar: {
      type: String,
      maxLength: 10
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Resposta da administração
  adminResponse: {
    text: {
      type: String,
      maxLength: 500
    },
    badge: {
      type: String,
      maxLength: 100
    },
    respondedAt: {
      type: Date
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Metadados
  loja: {
    type: String,
    maxLength: 10
  },

  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },

  status: {
    type: String,
    enum: ['active', 'archived', 'hidden'],
    default: 'active'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Data de expiração para limpeza automática
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 dias
  }
});

// Índices para performance
dashboardActivitySchema.index({ type: 1, createdAt: -1 });
dashboardActivitySchema.index({ status: 1, priority: -1 });
dashboardActivitySchema.index({ loja: 1, createdAt: -1 });
dashboardActivitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware para atualizar updatedAt
dashboardActivitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos estáticos
dashboardActivitySchema.statics.getActiveByLoja = function(loja, limit = 10) {
  return this.find({
    $or: [
      { loja: loja },
      { loja: { $exists: false } } // Atividades globais
    ],
    status: 'active'
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit)
  .lean();
};

dashboardActivitySchema.statics.getByType = function(type, loja = null, limit = 10) {
  const query = { type, status: 'active' };

  if (loja) {
    query.$or = [
      { loja: loja },
      { loja: { $exists: false } }
    ];
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Métodos de instância
dashboardActivitySchema.methods.incrementVotes = function() {
  this.votes += 1;
  return this.save();
};

dashboardActivitySchema.methods.addAdminResponse = function(text, badge, adminId) {
  this.adminResponse = {
    text,
    badge,
    respondedAt: new Date(),
    respondedBy: adminId
  };
  return this.save();
};

const DashboardActivity = mongoose.model('DashboardActivity', dashboardActivitySchema);

export default DashboardActivity;