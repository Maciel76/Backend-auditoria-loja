import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  // Identificação da conquista
  achievementId: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true,
    maxLength: 100
  },

  description: {
    type: String,
    required: true,
    maxLength: 300
  },

  icon: {
    type: String,
    required: true,
    maxLength: 10 // Para emojis ou códigos de ícones
  },

  // Tipo de conquista
  type: {
    type: String,
    enum: ['unlocked', 'progress', 'locked', 'special'],
    default: 'locked'
  },

  // Categoria da conquista
  category: {
    type: String,
    enum: ['audits', 'suggestions', 'participation', 'performance', 'consistency', 'leadership'],
    required: true
  },

  // Critérios para desbloqueio
  criteria: {
    // Tipo de critério
    type: {
      type: String,
      enum: ['count', 'streak', 'percentage', 'rank', 'special'],
      required: true
    },

    // Valor necessário
    target: {
      type: Number,
      required: true
    },

    // Descrição do critério
    description: String,

    // Período de avaliação (em dias, null = todos os tempos)
    period: Number
  },

  // Metadados
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'legendary'],
    default: 'medium'
  },

  points: {
    type: Number,
    default: 0,
    min: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userAchievementSchema = new mongoose.Schema({
  // Identificação do usuário
  userId: {
    type: String,
    required: true
  },

  userName: {
    type: String,
    required: true
  },

  loja: {
    type: String,
    required: true
  },

  // Referência à conquista
  achievementId: {
    type: String,
    required: true
  },

  // Status do usuário para esta conquista
  unlocked: {
    type: Boolean,
    default: false
  },

  // Progresso atual (para conquistas de progresso)
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Dados de desbloqueio
  unlockedAt: {
    type: Date
  },

  unlockedBy: {
    type: String, // ID da ação que desbloqueou
  },

  // Dados adicionais da conquista (desnormalizado para performance)
  achievementData: {
    title: String,
    description: String,
    icon: String,
    type: String,
    category: String,
    difficulty: String,
    points: Number
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices
achievementSchema.index({ category: 1, difficulty: 1 });
achievementSchema.index({ isActive: 1 });

userAchievementSchema.index({ userId: 1, loja: 1 });
userAchievementSchema.index({ achievementId: 1 });
userAchievementSchema.index({ unlocked: 1, unlockedAt: -1 });
userAchievementSchema.index({ userId: 1, unlocked: 1 });

// Middleware
userAchievementSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Calcular porcentagem de progresso
  if (this.progress.target > 0) {
    this.progress.percentage = Math.min(
      Math.round((this.progress.current / this.progress.target) * 100),
      100
    );
  }

  // Desbloquear automaticamente se atingiu o target
  if (this.progress.current >= this.progress.target && !this.unlocked) {
    this.unlocked = true;
    this.unlockedAt = new Date();
  }

  next();
});

// Métodos estáticos para Achievement
achievementSchema.statics.getActiveAchievements = function() {
  return this.find({ isActive: true }).sort({ category: 1, difficulty: 1 });
};

achievementSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ difficulty: 1 });
};

// Métodos estáticos para UserAchievement
userAchievementSchema.statics.getUserAchievements = function(userId, loja) {
  return this.find({ userId, loja })
    .sort({ 'achievementData.category': 1, unlocked: -1, 'progress.percentage': -1 })
    .lean();
};

userAchievementSchema.statics.getUnlockedAchievements = function(userId, loja) {
  return this.find({ userId, loja, unlocked: true })
    .sort({ unlockedAt: -1 })
    .lean();
};

userAchievementSchema.statics.getProgressAchievements = function(userId, loja) {
  return this.find({
    userId,
    loja,
    unlocked: false,
    'progress.percentage': { $gt: 0 }
  })
  .sort({ 'progress.percentage': -1 })
  .lean();
};

// Métodos de instância para UserAchievement
userAchievementSchema.methods.updateProgress = function(newValue, actionId = null) {
  this.progress.current = Math.max(0, newValue);

  if (actionId) {
    this.unlockedBy = actionId;
  }

  return this.save();
};

userAchievementSchema.methods.incrementProgress = function(amount = 1, actionId = null) {
  this.progress.current += amount;

  if (actionId) {
    this.unlockedBy = actionId;
  }

  return this.save();
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

export { Achievement, UserAchievement };