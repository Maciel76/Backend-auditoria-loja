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