/**
 * MODELO: VotingItem
 * ENDPOINTS ASSOCIADOS:
 * - GET /api/dashboard/voting - Items de votação
 * - POST /api/dashboard/vote/:id - Votar em item
 * - GET /api/dashboard/stats - Estatísticas gerais (conta items em desenvolvimento)
 */
import mongoose from "mongoose";

const votingItemSchema = new mongoose.Schema({
  // Identificação
  id: {
    type: String,
    required: true,
    unique: true
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

  // Status do desenvolvimento
  status: {
    type: String,
    required: true,
    enum: ['new-idea', 'under-review', 'in-progress', 'testing', 'implemented', 'rejected'],
    default: 'new-idea'
  },

  // Votação
  votes: {
    type: Number,
    default: 0,
    min: 0
  },

  votedUsers: [{
    userId: {
      type: String,
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    },
    loja: String
  }],

  // Metadados
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },

  category: {
    type: String,
    enum: ['feature', 'improvement', 'bug-fix', 'integration', 'ui-ux', 'performance'],
    default: 'feature'
  },

  // Informações de desenvolvimento
  estimatedEffort: {
    type: String,
    enum: ['low', 'medium', 'high', 'very-high'],
    default: 'medium'
  },

  developmentNotes: {
    type: String,
    maxLength: 2000
  },

  // Status e visibilidade
  isActive: {
    type: Boolean,
    default: true
  },

  isVisible: {
    type: Boolean,
    default: true
  },

  // Quem criou/gerencia
  createdBy: {
    userId: String,
    name: String,
    role: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: 'user'
    }
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Datas importantes
  targetDate: {
    type: Date
  },

  completedDate: {
    type: Date
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

  // Status history for tracking changes
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
});

// Índices
votingItemSchema.index({ status: 1, votes: -1 });
votingItemSchema.index({ isActive: 1, isVisible: 1, votes: -1 });
votingItemSchema.index({ category: 1, priority: -1 });
votingItemSchema.index({ createdAt: -1 });

// Middleware
votingItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos estáticos
votingItemSchema.statics.getActiveItems = function(limit = 10) {
  return this.find({
    isActive: true,
    isVisible: true
  })
  .sort({ votes: -1, priority: -1, createdAt: -1 })
  .limit(limit)
  .lean();
};

votingItemSchema.statics.getByStatus = function(status, limit = 10) {
  return this.find({
    status: status,
    isActive: true,
    isVisible: true
  })
  .sort({ votes: -1, createdAt: -1 })
  .limit(limit)
  .lean();
};

votingItemSchema.statics.getTopVoted = function(limit = 5) {
  return this.find({
    isActive: true,
    isVisible: true,
    votes: { $gt: 0 }
  })
  .sort({ votes: -1, createdAt: -1 })
  .limit(limit)
  .lean();
};

// Métodos de instância
votingItemSchema.methods.addVote = function(userId, loja = null) {
  // Verificar se usuário já votou
  const existingVote = this.votedUsers.find(
    vote => vote.userId === userId
  );

  if (existingVote) {
    return { success: false, message: 'Usuário já votou neste item' };
  }

  // Adicionar voto
  this.votedUsers.push({
    userId,
    loja,
    votedAt: new Date()
  });

  this.votes = this.votedUsers.length;

  return this.save().then(() => ({
    success: true,
    message: 'Voto registrado com sucesso'
  }));
};

votingItemSchema.methods.removeVote = function(userId) {
  const initialLength = this.votedUsers.length;

  this.votedUsers = this.votedUsers.filter(
    vote => vote.userId !== userId
  );

  if (this.votedUsers.length === initialLength) {
    return { success: false, message: 'Voto não encontrado' };
  }

  this.votes = this.votedUsers.length;

  return this.save().then(() => ({
    success: true,
    message: 'Voto removido com sucesso'
  }));
};

votingItemSchema.methods.updateStatus = function(newStatus, userId, notes = '') {
  // Adicionar ao histórico
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    notes
  });

  this.status = newStatus;

  // Definir data de conclusão se implementado
  if (newStatus === 'implemented') {
    this.completedDate = new Date();
  }

  return this.save();
};

votingItemSchema.methods.hasUserVoted = function(userId) {
  return this.votedUsers.some(vote => vote.userId === userId);
};

const VotingItem = mongoose.model('VotingItem', votingItemSchema);

export default VotingItem;