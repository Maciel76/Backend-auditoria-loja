import express from "express";
import AchievementUpdateService from "../services/achievementUpdateService.js";
import AchievementConfig from "../models/AchievementConfig.js";
import MetricasUsuario from "../models/MetricasUsuario.js";

const router = express.Router();

/**
 * @route PUT /api/achievements/config/:achievementId
 * @desc Atualizar configuração de uma conquista específica
 * @param {string} achievementId - ID da conquista a ser atualizada
 * @body {string} title - Novo título da conquista
 * @body {string} description - Nova descrição da conquista
 * @body {number} points - Novos pontos da conquista
 * @body {string} rarity - Nova raridade da conquista
 * @body {string} icon - Novo ícone da conquista
 */
router.put("/config/:achievementId", async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { title, description, points, rarity, icon, category, difficulty, criteria } = req.body;

    // Validar campos obrigatórios
    if (!title || points === undefined || !rarity) {
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios ausentes: title, points, rarity",
      });
    }

    // Validar raridade
    const validRarities = ["Basica", "Comum", "Raro", "Epico", "Lendario", "Diamante", "Especial"];
    if (!validRarities.includes(rarity)) {
      return res.status(400).json({
        success: false,
        error: `Raridade inválida. Valores válidos: ${validRarities.join(", ")}`,
      });
    }

    // Preparar dados para atualização
    const updateData = {
      title,
      description,
      points,
      rarity,
      icon: icon || '🏆', // valor padrão
      category: category || 'audits', // valor padrão
      difficulty: difficulty || 'medium', // valor padrão
      criteria: criteria || { type: "count", target: 1, description: "Critério padrão" }, // valor padrão
      target: criteria?.target || 1
    };

    // Atualizar a configuração no modelo de configuração
    const config = await AchievementConfig.updateConfig(achievementId, updateData, req.user?.id || "admin");

    // Atualizar a configuração padrão das conquistas em todos os documentos existentes
    // Primeiro, vamos encontrar todos os documentos e atualizar individualmente
    const metricasUsuarios = await MetricasUsuario.find({});

    let updatedCount = 0;
    let errors = [];

    for (const metrica of metricasUsuarios) {
      try {
        const achievementIndex = metrica.achievements.achievements.findIndex(
          a => a.achievementId === achievementId
        );

        if (achievementIndex !== -1) {
          // Atualizar os dados da conquista
          metrica.achievements.achievements[achievementIndex].achievementData.title = title;
          metrica.achievements.achievements[achievementIndex].achievementData.description = description;
          metrica.achievements.achievements[achievementIndex].achievementData.points = points;
          metrica.achievements.achievements[achievementIndex].achievementData.rarity = rarity;
          metrica.achievements.achievements[achievementIndex].achievementData.icon = icon;
          metrica.achievements.achievements[achievementIndex].achievementData.category = category;
          metrica.achievements.achievements[achievementIndex].achievementData.difficulty = difficulty;
          metrica.achievements.achievements[achievementIndex].achievementData.criteria = criteria;

          // Atualizar também os campos editáveis diretamente
          metrica.achievements.achievements[achievementIndex].rarity = rarity;
          metrica.achievements.achievements[achievementIndex].fixedXpValue = points;

          await metrica.save();
          updatedCount++;
        }
      } catch (error) {
        console.error(`Erro ao atualizar conquista no documento ${metrica._id}:`, error);
        errors.push({
          documentId: metrica._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Configuração da conquista ${achievementId} atualizada em ${updatedCount} registros`,
      updatedCount: updatedCount,
      config: config,
      errors: errors
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar configuração da conquista:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar configuração da conquista",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/achievements/config
 * @desc Obter configurações de todas as conquistas
 */
router.get("/config", async (req, res) => {
  try {
    // Obter as configurações do modelo de configuração
    const achievementRules = await AchievementConfig.getAllConfigs();

    // Se não houver configurações no modelo AchievementConfig, usar as padrão
    if (Object.keys(achievementRules).length === 0) {
      const defaultRules = MetricasUsuario.getConfiguracoesPadrao();

      // Salvar as configurações padrão no modelo AchievementConfig
      for (const [achievementId, rule] of Object.entries(defaultRules)) {
        await AchievementConfig.updateConfig(achievementId, {
          ...rule,
          target: rule.criteria?.target || 1
        }, "system");
      }

      // Retornar as configurações padrão
      const defaultConfigs = Object.keys(defaultRules).map(achievementId => ({
        achievementId: achievementId,
        ...defaultRules[achievementId],
        target: defaultRules[achievementId].criteria?.target || 1,
      }));

      res.json({
        success: true,
        configs: defaultConfigs,
        total: defaultConfigs.length,
      });
    } else {
      // Converter para o formato esperado
      const configs = Object.keys(achievementRules).map(achievementId => ({
        achievementId: achievementId,
        title: achievementRules[achievementId].title,
        description: achievementRules[achievementId].description,
        points: achievementRules[achievementId].points,
        rarity: achievementRules[achievementId].rarity,
        icon: achievementRules[achievementId].icon,
        category: achievementRules[achievementId].category,
        difficulty: achievementRules[achievementId].difficulty,
        criteria: achievementRules[achievementId].criteria,
        target: achievementRules[achievementId].target || 1,
      }));

      res.json({
        success: true,
        configs: configs,
        total: configs.length,
      });
    }
  } catch (error) {
    console.error("❌ Erro ao obter configurações das conquistas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao obter configurações das conquistas",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/achievements/config/sync-all
 * @desc Sincronizar todas as conquistas com as configurações atuais
 */
router.post("/config/sync-all", async (req, res) => {
  try {
    // Usar o serviço para sincronizar todas as conquistas
    const result = await AchievementUpdateService.syncAllAchievementsWithConfigs();

    res.json(result);
  } catch (error) {
    console.error("❌ Erro ao sincronizar conquistas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao sincronizar conquistas",
      details: error.message,
    });
  }
});

export default router;