# SISTEMA DE CONQUISTAS E GAMIFICAÇÃO - IMPLEMENTAÇÃO COMPLETA

**Data:** 17/11/2025
**Objetivo:** Criar sistema de conquistas, XP e níveis para usuários SEM AFETAR o processamento principal de auditorias

---

## ⚠️ IMPORTANTE: IMPLEMENTAÇÃO ISOLADA

Este sistema deve ser implementado de forma **COMPLETAMENTE SEPARADA** do processamento principal de auditorias.

**NÃO MODIFICAR:**

- ❌ `/routes/upload.js` - Deixar intacto
- ❌ Qualquer processamento existente de auditorias
- ❌ Modelos existentes (Auditoria, MetricasUsuario, etc)

**CRIAR NOVO:**

- ✅ Modelo UserAchievement (novo)
- ✅ Service achievementRulesService (novo)
- ✅ Rota `/api/achievements` (nova)
- ✅ Processador diário separado (opcional)

---

## 1. MODELO: UserAchievement.js

**Localização:** `/backend/models/UserAchievement.js`

```javascript
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
```

---

## 2. SERVICE: achievementRulesService.js

**Localização:** `/backend/services/achievementRulesService.js`

Este service é INDEPENDENTE e não deve afetar outros serviços.

```javascript
import { UserAchievement } from "../models/UserAchievement.js";
import Auditoria from "../models/Auditoria.js";
import Loja from "../models/Loja.js";

class AchievementRulesService {
  constructor() {
    // Definir regras de conquistas
    this.achievementRules = {
      "first-audit": {
        title: "Primeira Auditoria",
        description: "Concluiu sua primeira auditoria",
        icon: "🔍",
        category: "audits",
        difficulty: "easy",
        points: 10,
        criteria: {
          type: "count",
          target: 1,
          description: "Realizar 1 auditoria atualizada",
        },
      },
      "audit-enthusiast": {
        title: "Entusiasta de Auditoria",
        description: "Concluiu 10 auditorias atualizadas",
        icon: "📊",
        category: "audits",
        difficulty: "medium",
        points: 25,
        criteria: {
          type: "count",
          target: 10,
          description: "Realizar 10 auditorias atualizadas",
        },
      },
      "audit-master": {
        title: "Mestre de Auditoria",
        description: "Concluiu 50 auditorias atualizadas",
        icon: "🏆",
        category: "audits",
        difficulty: "hard",
        points: 50,
        criteria: {
          type: "count",
          target: 50,
          description: "Realizar 50 auditorias atualizadas",
        },
      },
      "consistent-auditor": {
        title: "Auditor Consistente",
        description: "Realizou auditorias por 5 dias consecutivos",
        icon: "📅",
        category: "consistency",
        difficulty: "medium",
        points: 30,
        criteria: {
          type: "streak",
          target: 5,
          description: "Realizar auditorias por 5 dias consecutivos",
        },
      },
      "weekly-warrior": {
        title: "Guerreiro Semanal",
        description: "Realizou 5 auditorias em uma semana",
        icon: "🔥",
        category: "performance",
        difficulty: "medium",
        points: 20,
        criteria: {
          type: "count",
          target: 5,
          period: 7,
          description: "Realizar 5 auditorias em uma semana",
        },
      },
      "item-collector-100": {
        title: "Colecionador",
        description: "Leu 100 itens",
        icon: "💯",
        category: "performance",
        difficulty: "easy",
        points: 15,
        criteria: {
          type: "count",
          target: 100,
          description: "Ler 100 itens",
        },
      },
      "item-collector-500": {
        title: "Meta Batida",
        description: "Leu 500 itens",
        icon: "🎯",
        category: "performance",
        difficulty: "medium",
        points: 50,
        criteria: {
          type: "count",
          target: 500,
          description: "Ler 500 itens",
        },
      },
      "item-collector-1000": {
        title: "Maratona",
        description: "Leu 1000 itens",
        icon: "🏅",
        category: "performance",
        difficulty: "hard",
        points: 100,
        criteria: {
          type: "count",
          target: 1000,
          description: "Ler 1000 itens",
        },
      },
      "perfect-accuracy": {
        title: "Precisão Perfeita",
        description: "Manteve 95% de precisão",
        icon: "🎯",
        category: "performance",
        difficulty: "hard",
        points: 40,
        criteria: {
          type: "percentage",
          target: 95,
          description: "Manter 95% de precisão",
        },
      },
      "team-player": {
        title: "Jogador de Equipe",
        description: "Trabalhou em 3 setores diferentes",
        icon: "🤝",
        category: "participation",
        difficulty: "medium",
        points: 20,
        criteria: {
          type: "count",
          target: 3,
          description: "Trabalhar em 3 setores diferentes",
        },
      },
    };
  }

  // Inicializar conquistas para um usuário
  async initializeUserAchievements(
    userId,
    lojaCode,
    dataReferencia = new Date()
  ) {
    const userName = await this.getUserName(userId);

    const inicioDia = new Date(dataReferencia);
    inicioDia.setHours(0, 0, 0, 0);

    // Criar array de conquistas iniciais
    const achievements = Object.keys(this.achievementRules).map(
      (achievementId) => ({
        achievementId,
        unlocked: false,
        progress: {
          current: 0,
          target: this.achievementRules[achievementId].criteria.target,
          percentage: 0,
        },
        achievementData: this.achievementRules[achievementId],
      })
    );

    // Criar documento
    const userAchievement = new UserAchievement({
      userId,
      userName,
      loja: lojaCode,
      dataReferencia: inicioDia,
      achievements,
      xp: {
        total: 0,
        fromAchievements: 0,
        fromActivities: 0,
      },
      level: {
        current: 1,
        title: "Novato",
        xpForNextLevel: 100,
        progressPercentage: 0,
      },
      stats: {
        totalUnlockedAchievements: 0,
        totalAudits: 0,
        totalItems: 0,
      },
    });

    await userAchievement.save();
    console.log(
      `✅ Initialized ${
        achievements.length
      } achievements for user ${userId} (${userName}) on ${inicioDia.toLocaleDateString()}`
    );

    return userAchievement;
  }

  // Avaliar e atualizar conquistas de um usuário
  async evaluateUserAchievements(
    userId,
    lojaCode,
    dataReferencia = new Date()
  ) {
    const inicioDia = new Date(dataReferencia);
    inicioDia.setHours(0, 0, 0, 0);

    console.log(
      `🔍 Evaluating achievements for user ${userId} in loja ${lojaCode}`
    );

    // Get loja ObjectId
    const loja = await Loja.findOne({ codigo: lojaCode });
    if (!loja) {
      throw new Error(`Loja com código ${lojaCode} não encontrada`);
    }

    // ⚠️ Buscar ÚNICO registro do usuário (sem filtrar por data)
    let userAchievementDoc = await UserAchievement.findOne({
      userId,
      loja: lojaCode,
    });

    // Criar se não existir
    if (!userAchievementDoc) {
      console.log(`📝 Creating new UserAchievement for ${userId}`);
      await this.initializeUserAchievements(userId, lojaCode, inicioDia);
      userAchievementDoc = await UserAchievement.findOne({
        userId,
        loja: lojaCode,
      });
    } else {
      console.log(`🔄 Updating existing UserAchievement for ${userId}`);
      // Atualizar dataReferencia para refletir última atualização
      userAchievementDoc.dataReferencia = inicioDia;
    }

    let hasChanges = false;
    let newlyUnlocked = [];

    // Avaliar cada conquista
    for (const achievementId in this.achievementRules) {
      const rule = this.achievementRules[achievementId];

      let achievement = userAchievementDoc.achievements.find(
        (a) => a.achievementId === achievementId
      );

      if (!achievement) {
        achievement = {
          achievementId,
          unlocked: false,
          progress: {
            current: 0,
            target: rule.criteria.target,
            percentage: 0,
          },
          achievementData: rule,
        };
        userAchievementDoc.achievements.push(achievement);
        hasChanges = true;
      }

      const wasUnlocked = achievement.unlocked;

      // Calcular progresso
      const progress = await this.calculateProgress(
        userId,
        loja._id,
        achievementId,
        rule
      );

      if (progress > achievement.progress.current) {
        achievement.progress.current = progress;
        hasChanges = true;
        console.log(
          `🔄 Updated achievement ${achievementId} for user ${userId}, progress: ${progress}/${rule.criteria.target}`
        );
      }

      // Verificar se desbloqueou
      if (!wasUnlocked && progress >= rule.criteria.target) {
        newlyUnlocked.push({
          achievementId,
          title: rule.title,
          xp: rule.points,
        });
      }
    }

    // ⚠️ Calcular XP de atividades (conta até a data especificada)
    const activityXp = await this.calculateActivityXp(
      userId,
      loja._id,
      lojaCode,
      inicioDia
    );
    userAchievementDoc.xp.fromActivities = activityXp.total;
    userAchievementDoc.stats.totalAudits = activityXp.totalAudits;
    userAchievementDoc.stats.totalItems = activityXp.totalItems;
    hasChanges = true;

    // Salvar (middleware calculará XP total e nível)
    if (hasChanges) {
      await userAchievementDoc.save();

      if (newlyUnlocked.length > 0) {
        console.log(
          `🎉 User ${userId} unlocked ${newlyUnlocked.length} achievement(s):`
        );
        newlyUnlocked.forEach((a) => {
          console.log(`   🏆 ${a.title} (+${a.xp} XP)`);
        });
      }

      console.log(
        `📊 User ${userId} - Level ${userAchievementDoc.level.current} (${userAchievementDoc.level.title})`
      );
      console.log(
        `   Total XP: ${userAchievementDoc.xp.total} (Activities: ${userAchievementDoc.xp.fromActivities}, Achievements: ${userAchievementDoc.xp.fromAchievements})`
      );
    }

    return {
      success: true,
      newlyUnlocked,
      xp: userAchievementDoc.xp,
      level: userAchievementDoc.level,
    };
  }

  // ⚠️ Calcular XP de atividades (APENAS ITENS LIDOS)
  async calculateActivityXp(userId, lojaId, lojaCode, dataReferencia) {
    const fimDia = new Date(dataReferencia);
    fimDia.setHours(23, 59, 59, 999);

    // Contar auditorias atualizadas até esta data (para estatísticas)
    const totalAudits = await Auditoria.countDocuments({
      usuarioId: userId,
      loja: lojaId,
      situacao: "Atualizado",
      data: { $lte: fimDia },
    });

    // Contar total de itens lidos até esta data
    const totalItems = await Auditoria.countDocuments({
      usuarioId: userId,
      loja: lojaId,
      data: { $lte: fimDia },
    });

    // ⚠️ XP DE ITENS: 1 XP por item lido (SOMENTE!)
    // XP de conquistas será adicionado automaticamente pelo middleware
    let xp = totalItems;

    return {
      total: xp, // XP apenas de itens lidos
      totalAudits,
      totalItems,
    };
  }

  // Calcular progresso de uma conquista específica
  async calculateProgress(userId, lojaId, achievementId, rule) {
    switch (achievementId) {
      case "first-audit":
      case "audit-enthusiast":
      case "audit-master":
        return await Auditoria.countDocuments({
          usuarioId: userId,
          loja: lojaId,
          situacao: "Atualizado",
        });

      case "item-collector-100":
      case "item-collector-500":
      case "item-collector-1000":
        return await Auditoria.countDocuments({
          usuarioId: userId,
          loja: lojaId,
        });

      case "consistent-auditor":
        // Contar dias únicos com auditorias
        const distinctDays = await Auditoria.distinct("data", {
          usuarioId: userId,
          loja: lojaId,
        });
        return distinctDays.length;

      case "weekly-warrior":
        // Auditorias nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return await Auditoria.countDocuments({
          usuarioId: userId,
          loja: lojaId,
          situacao: "Atualizado",
          data: { $gte: sevenDaysAgo },
        });

      case "perfect-accuracy":
        const totalAudits = await Auditoria.countDocuments({
          usuarioId: userId,
          loja: lojaId,
        });
        const updatedAudits = await Auditoria.countDocuments({
          usuarioId: userId,
          loja: lojaId,
          situacao: "Atualizado",
        });
        return totalAudits > 0
          ? Math.round((updatedAudits / totalAudits) * 100)
          : 0;

      case "team-player":
        const distinctSectors = await Auditoria.distinct("local", {
          usuarioId: userId,
          loja: lojaId,
        });
        return distinctSectors.length;

      default:
        return 0;
    }
  }

  // Helper para pegar nome do usuário
  async getUserName(userId) {
    try {
      // Buscar na primeira auditoria do usuário
      const auditoria = await Auditoria.findOne({ usuarioId: userId });
      return auditoria
        ? auditoria.usuarioNome || `User ${userId}`
        : `User ${userId}`;
    } catch (error) {
      console.error(`Error getting username for ${userId}:`, error);
      return `User ${userId}`;
    }
  }
}

export default new AchievementRulesService();
```

---

## 3. ROTA: achievements.js (SEPARADA E INDEPENDENTE)

**Localização:** `/backend/routes/achievements.js`

Esta rota é totalmente independente e não afeta outras rotas.

```javascript
import express from "express";
import achievementRulesService from "../services/achievementRulesService.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { extractLoja } from "../middleware/auth.js";

const router = express.Router();

// GET /api/achievements - Get all user achievements
router.get("/", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDoc = await UserAchievement.findOne({ userId, loja });

    if (!userDoc) {
      return res.json({
        success: true,
        achievements: [],
        message: "No achievements found for this user",
      });
    }

    res.json({
      success: true,
      achievements: userDoc.achievements,
      xp: userDoc.xp,
      level: userDoc.level,
      stats: userDoc.stats,
    });
  } catch (error) {
    console.error("Error getting user achievements:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/achievements/evaluate - Manually trigger achievement evaluation
router.post("/evaluate", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.user?.id || req.body.userId;
    const dataReferencia = req.body.dataReferencia
      ? new Date(req.body.dataReferencia)
      : new Date();

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await achievementRulesService.evaluateUserAchievements(
      userId,
      loja,
      dataReferencia
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error evaluating achievements:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/xp - Get user XP and level
router.get("/xp", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDoc = await UserAchievement.findOne({ userId, loja });

    if (!userDoc) {
      return res.json({
        success: true,
        xp: { total: 0, fromAchievements: 0, fromActivities: 0 },
        level: {
          current: 1,
          title: "Novato",
          xpForNextLevel: 100,
          progressPercentage: 0,
        },
        stats: { totalUnlockedAchievements: 0, totalAudits: 0, totalItems: 0 },
      });
    }

    res.json({
      success: true,
      userId: userDoc.userId,
      userName: userDoc.userName,
      xp: userDoc.xp,
      level: userDoc.level,
      stats: userDoc.stats,
    });
  } catch (error) {
    console.error("Error getting user XP:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/ranking - Get ranking by XP
router.get("/ranking", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const limit = parseInt(req.query.limit) || 10;

    const ranking = await UserAchievement.getRankingByXp(loja, limit);

    res.json({
      success: true,
      ranking: ranking.map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        userName: user.userName,
        xp: user.xp,
        level: user.level,
        stats: user.stats,
      })),
    });
  } catch (error) {
    console.error("Error getting ranking:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 4. INTEGRAÇÃO NO SERVER.JS

**Localização:** `/backend/server.js`

Adicionar APENAS a rota de achievements, sem modificar nada mais:

```javascript
// ... imports existentes ...
import achievementsRouter from "./routes/achievements.js";

// ... código existente ...

// ⚠️ ADICIONAR APENAS ESTA LINHA (não modificar nada mais!)
try {
  app.use("/api/achievements", achievementsRouter);
  console.log("✅ Rotas de conquistas carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de conquistas:", error.message);
}

// ... resto do código ...
```

---

## 5. PROCESSADOR DIÁRIO SEPARADO (OPCIONAL)

**Localização:** `/backend/services/dailyAchievementProcessor.js`

Para processar conquistas automaticamente uma vez por dia, SEM afetar uploads:

```javascript
import achievementRulesService from "./achievementRulesService.js";
import Auditoria from "../models/Auditoria.js";
import Loja from "../models/Loja.js";

class DailyAchievementProcessor {
  async processAllUsersAchievements() {
    console.log("🔄 Iniciando processamento diário de conquistas...");

    try {
      // Buscar todas as lojas
      const lojas = await Loja.find({});

      for (const loja of lojas) {
        console.log(`📍 Processando loja ${loja.codigo}...`);

        // Buscar usuários únicos que fizeram auditorias nesta loja
        const usuarios = await Auditoria.distinct("usuarioId", {
          loja: loja._id,
        });

        for (const userId of usuarios) {
          try {
            await achievementRulesService.evaluateUserAchievements(
              userId,
              loja.codigo
            );
            console.log(`✅ Conquistas processadas para usuário ${userId}`);
          } catch (error) {
            console.error(
              `❌ Erro ao processar usuário ${userId}:`,
              error.message
            );
          }
        }
      }

      console.log("✅ Processamento diário de conquistas concluído!");
    } catch (error) {
      console.error("❌ Erro no processamento diário:", error);
    }
  }

  // Agendar para rodar 1x por dia (ex: meia-noite)
  scheduleDaily() {
    const INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

    setInterval(() => {
      this.processAllUsersAchievements();
    }, INTERVAL);

    // Executar uma vez ao iniciar
    this.processAllUsersAchievements();
  }
}

export default new DailyAchievementProcessor();
```

---

## 6. COMO USAR

### Opção 1: Processar Manualmente via API

```bash
# Avaliar conquistas de um usuário
curl -X POST http://localhost:3000/api/achievements/evaluate \
  -H "x-loja: 056" \
  -H "Content-Type: application/json" \
  -d '{"userId": "12345"}'

# Ver conquistas do usuário
curl -H "x-loja: 056" "http://localhost:3000/api/achievements?userId=12345"

# Ver XP e nível
curl -H "x-loja: 056" "http://localhost:3000/api/achievements/xp?userId=12345"

# Ver ranking
curl -H "x-loja: 056" "http://localhost:3000/api/achievements/ranking?limit=10"
```

### Opção 2: Processar Automaticamente (se quiser)

**APENAS se quiser processar conquistas após uploads**, adicionar em `upload.js`:

```javascript
import achievementRulesService from "../services/achievementRulesService.js";

// ... após processar upload com sucesso ...

// ⚠️ OPCIONAL: Processar conquistas após upload
try {
  await achievementRulesService.evaluateUserAchievements(
    usuarioId,
    loja.codigo,
    dataMetricas
  );
} catch (error) {
  console.error("Erro ao processar conquistas:", error);
  // Não interrompe o upload se der erro nas conquistas
}
```

### Opção 3: Processador Diário

No `server.js`, adicionar:

```javascript
import dailyAchievementProcessor from "./services/dailyAchievementProcessor.js";

// Depois de app.listen()
dailyAchievementProcessor.scheduleDaily();
```

---

## 7. REGRAS IMPORTANTES

### ✅ Comportamento Correto

1. **1 Registro por Usuário**: Cada usuário tem apenas 1 registro no UserAchievement por loja
2. **Sempre Atualiza**: Múltiplos uploads sempre atualizam o MESMO registro
3. **Acumulação de Itens**: totalItems conta TODAS as auditorias até a data atual
4. **Independente**: Sistema não afeta processamento de auditorias

### ⚠️ Como Funciona a Acumulação

- **Dia 1, Upload 1**: 30 itens → totalItems = 30
- **Dia 1, Upload 2**: +50 itens → totalItems = 80 (atualiza para total atual)
- **Dia 2, Upload 1**: +70 itens → totalItems = 150 (soma acumulada)
- **Dia 3, Upload 1**: +40 itens → totalItems = 190

### 📊 Sistema de XP

**2 FORMAS DE GANHAR XP:**

1. **Itens Lidos**: Cada item lido = 1 XP

   - Cada auditoria cadastrada vale 1 XP
   - Acumula automaticamente conforme usuário lê itens

2. **Conquistas Alcançadas**: XP das conquistas desbloqueadas
   - Primeira Auditoria: +10 XP
   - Entusiasta: +25 XP
   - Mestre: +50 XP
   - E outras conquistas...

**XP Total = XP de Itens Lidos + XP de Conquistas**

### 🚀 Progressão de Nível (EXPONENCIAL)

A progressão de nível é EXPONENCIAL, não linear!

**Fórmula sugerida:**

```javascript
// Exemplo de progressão exponencial
function calculateLevel(xp) {
  // Opção 1: Raiz quadrada (crescimento moderado)
  return Math.floor(Math.sqrt(xp / 10)) + 1;

  // Opção 2: Crescimento por faixas
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  // ... e assim por diante
}
```

**Tabela de Exemplo (Progressão Exponencial):**

- Nível 1: 0 - 99 XP (100 XP)
- Nível 2: 100 - 299 XP (200 XP)
- Nível 3: 300 - 599 XP (300 XP)
- Nível 4: 600 - 999 XP (400 XP)
- Nível 5: 1000 - 1499 XP (500 XP)
- Nível 10: 4500 - 5499 XP (1000 XP)
- Nível 20: 19000 - 20999 XP (2000 XP)

Quanto mais alto o nível, mais XP é necessário para subir!

---

## 8. TESTES

### Teste 1: Verificar Registro Único

```javascript
// Criar auditorias em 3 dias diferentes
// Processar conquistas 3 vezes
// Resultado esperado: 1 único registro com valores acumulados
```

### Teste 2: Verificar Acumulação

```javascript
// Dia 1: 30 itens → totalItems deve ser 30
// Dia 2: +50 itens → totalItems deve ser 80
// Dia 3: +40 itens → totalItems deve ser 120
```

### Teste 3: Verificar Rankings

```javascript
// Criar múltiplos usuários com diferentes XPs
// Verificar ordem correta no ranking
```

---

## 9. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar `/backend/models/UserAchievement.js`
- [ ] Criar `/backend/services/achievementRulesService.js`
- [ ] Criar `/backend/routes/achievements.js`
- [ ] Adicionar rota no `server.js`
- [ ] Testar endpoints via Postman/curl
- [ ] (Opcional) Adicionar processador diário
- [ ] (Opcional) Integrar com upload.js

---

## 10. RESUMO FINAL

**O que este sistema faz:**

- ✅ Rastreia conquistas dos usuários
- ✅ Calcula XP e níveis automaticamente
- ✅ Gera rankings
- ✅ Funciona de forma ISOLADA
- ✅ NÃO afeta processamento de auditorias

**O que NÃO fazer:**

- ❌ Não modificar upload.js (a menos que queira integração automática)
- ❌ Não modificar outros modelos
- ❌ Não modificar outros services

**Implementação segura:**

1. Criar os 3 arquivos novos
2. Adicionar 1 linha no server.js
3. Testar via API
4. (Opcional) Integrar com upload depois

---

## 11. ⚠️ REGRAS FUNDAMENTAIS DE XP E NÍVEL

### 🎯 AS 2 ÚNICAS FORMAS DE GANHAR XP

**1. Itens Lidos (Contador)**

```javascript
// Cada item de auditoria lido = 1 XP
totalItems = 150  →  XP de Itens = 150
totalItems = 1000 →  XP de Itens = 1000
```

**2. Conquistas Alcançadas**

```javascript
// Cada conquista desbloqueada dá XP
Primeira Auditoria desbloqueada    → +10 XP
Entusiasta desbloqueado           → +25 XP
Mestre desbloqueado               → +50 XP
Total XP de Conquistas            → 85 XP
```

**XP TOTAL:**

```javascript
xp.fromActivities = totalItems;  // Apenas itens lidos!
xp.fromAchievements = 85;        // Soma de todas conquistas
xp.total = 150 + 85 = 235;       // Total final
```

### 📈 PROGRESSÃO EXPONENCIAL (NÃO LINEAR!)

**❌ ERRADO (Linear):**

```
Nível 1: 0-100 XP    (100 XP)
Nível 2: 100-200 XP  (100 XP)
Nível 3: 200-300 XP  (100 XP)  ← Sempre o mesmo!
```

**✅ CORRETO (Exponencial):**

```
Nível 1:  0-99 XP      (100 XP necessário)
Nível 2:  100-299 XP   (200 XP necessário) ← Mais difícil!
Nível 3:  300-599 XP   (300 XP necessário) ← Ainda mais!
Nível 4:  600-999 XP   (400 XP necessário)
Nível 5:  1000-1499 XP (500 XP necessário)
Nível 10: 4500-5499 XP (1000 XP necessário)
Nível 20: 19000-20999 XP (2000 XP necessário) ← Muito difícil!
```

**Por que exponencial?**

- Mantém usuários engajados por mais tempo
- Recompensa dedicação de longo prazo
- Níveis altos são verdadeiras conquistas
- Evita que todos cheguem ao nível máximo rapidamente

### 💡 EXEMPLO PRÁTICO

**Usuário João:**

- Leu 500 itens → +500 XP (de itens)
- Desbloqueou 5 conquistas → +150 XP (de conquistas)
- **XP Total:** 650 XP
- **Nível:** 4 (entre 600-999 XP)
- **Progresso:** 50/400 para nível 5 (12.5%)

**Para João chegar ao nível 5:**

- Precisa de 1000 XP total
- Faltam 350 XP
- Pode conseguir lendo mais 350 itens OU
- Desbloqueando conquistas de alto valor OU
- Combinação dos dois

---

**FIM DO DOCUMENTO**
