import mongoose from "mongoose";

// Schema para cada conquista individual
const achievementProgressSchema = new mongoose.Schema(
  {
    achievementId: {
      type: String,
      required: true,
    },

    // Status da conquista
    unlocked: {
      type: Boolean,
      default: false,
    },

    // Progresso atual
    progress: {
      current: {
        type: Number,
        default: 0,
      },
      target: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // Dados de desbloqueio
    unlockedAt: {
      type: Date,
    },

    unlockedBy: {
      type: String, // ID da ação que desbloqueou
    },

    // Dados da conquista (desnormalizados)
    achievementData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

// Schema principal - UM REGISTRO POR USUÁRIO
const userAchievementSchema = new mongoose.Schema({
  // Identificação do usuário
  userId: {
    type: String,
    required: true,
    index: true,
  },

  userName: {
    type: String,
    required: true,
  },

  loja: {
    type: String,
    required: true,
    index: true,
  },

  // Data de referência (última atualização)
  dataReferencia: {
    type: Date,
    required: true,
    index: true,
  },

  // Array de conquistas do usuário
  achievements: [achievementProgressSchema],

  // Sistema de XP e Nível
  xp: {
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    fromAchievements: {
      type: Number,
      default: 0,
      min: 0,
    },
    fromActivities: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  level: {
    current: {
      type: Number,
      default: 1,
      min: 1,
    },
    title: {
      type: String,
      default: "Novato",
    },
    xpForNextLevel: {
      type: Number,
      default: 100,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Estatísticas gerais
  stats: {
    totalUnlockedAchievements: {
      type: Number,
      default: 0,
    },
    totalAudits: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ⚠️ ÍNDICE ÚNICO: 1 registro por usuário+loja
userAchievementSchema.index({ userId: 1, loja: 1 }, { unique: true });
userAchievementSchema.index({ "achievements.achievementId": 1 });
userAchievementSchema.index({ "achievements.unlocked": 1 });
userAchievementSchema.index({ "xp.total": -1 }); // Para ranking por XP
userAchievementSchema.index({ "level.current": -1 }); // Para ranking por nível
userAchievementSchema.index({ loja: 1, "xp.total": -1 }); // Ranking por loja

// Helper: Calcular nível baseado no XP (PROGRESSÃO EXPONENCIAL)
function calculateLevel(xp) {
  // ⚠️ PROGRESSÃO EXPONENCIAL - Quanto maior o nível, mais XP necessário

  // OPÇÃO 1: Progressão por faixas (recomendado)
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  if (xp < 5500) return 10;
  if (xp < 6600) return 11;
  if (xp < 7800) return 12;
  if (xp < 9100) return 13;
  if (xp < 10500) return 14;
  if (xp < 12000) return 15;
  // ... continue conforme necessário

  // OPÇÃO 2: Fórmula de raiz quadrada (crescimento mais suave)
  // return Math.floor(Math.sqrt(xp / 10)) + 1;

  // OPÇÃO 3: Fórmula logarítmica (crescimento muito suave)
  // return Math.floor(Math.log(xp + 1) / Math.log(1.5)) + 1;

  // Fallback para níveis muito altos
  return Math.floor(Math.sqrt(xp / 10)) + 1;
}

// Helper: Obter título baseado no nível
function getLevelTitle(level) {
  const titles = {
    1: "Novato",
    2: "Iniciante",
    3: "Aprendiz",
    5: "Competente",
    8: "Experiente",
    12: "Veterano",
    16: "Especialista",
    20: "Mestre",
    25: "Auditor Senior",
    30: "Lenda",
    40: "Elite",
    50: "Supremo",
  };

  const sortedLevels = Object.keys(titles)
    .map(Number)
    .sort((a, b) => b - a);

  for (const minLevel of sortedLevels) {
    if (level >= minLevel) {
      return titles[minLevel];
    }
  }

  return "Auditor de Estoque";
}

// Middleware: Auto-calcular XP, nível e porcentagens antes de salvar
userAchievementSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  let totalXpFromAchievements = 0;
  let totalUnlocked = 0;

  // Processar cada conquista no array
  this.achievements.forEach((achievement) => {
    // Calcular porcentagem de progresso
    if (achievement.progress.target > 0) {
      achievement.progress.percentage = Math.min(
        Math.round(
          (achievement.progress.current / achievement.progress.target) * 100
        ),
        100
      );
    }

    // Desbloquear automaticamente se atingiu o target
    if (
      achievement.progress.current >= achievement.progress.target &&
      !achievement.unlocked
    ) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
    }

    // Contar XP de conquistas desbloqueadas
    if (achievement.unlocked && achievement.achievementData?.points) {
      totalXpFromAchievements += achievement.achievementData.points;
      totalUnlocked++;
    }
  });

  // Atualizar XP de conquistas
  this.xp.fromAchievements = totalXpFromAchievements;

  // XP total = atividades + conquistas
  this.xp.total = this.xp.fromActivities + this.xp.fromAchievements;

  // Calcular nível baseado no XP total
  const newLevel = calculateLevel(this.xp.total);
  this.level.current = newLevel;
  this.level.title = getLevelTitle(newLevel);

  // XP necessário para próximo nível
  const xpInCurrentLevel = this.xp.total % 100;
  this.level.xpForNextLevel = 100 - xpInCurrentLevel;
  this.level.progressPercentage = Math.round(xpInCurrentLevel);

  // Atualizar estatísticas
  this.stats.totalUnlockedAchievements = totalUnlocked;
  this.stats.lastActivityAt = new Date();

  next();
});

// Métodos estáticos para consultas
userAchievementSchema.statics.getUserAchievements = function (userId, loja) {
  return this.findOne({ userId, loja }).lean();
};

userAchievementSchema.statics.getRankingByXp = function (loja, limit = 10) {
  const query = loja ? { loja } : {};
  return this.find(query)
    .select("userId userName xp level stats")
    .sort({ "xp.total": -1 })
    .limit(limit)
    .lean();
};

userAchievementSchema.statics.getRankingByLevel = function (loja, limit = 10) {
  const query = loja ? { loja } : {};
  return this.find(query)
    .select("userId userName xp level stats")
    .sort({ "level.current": -1, "xp.total": -1 })
    .limit(limit)
    .lean();
};

const UserAchievement = mongoose.model(
  "UserAchievement",
  userAchievementSchema
);

export { UserAchievement };