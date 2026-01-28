import express from "express";
import MetricasUsuario from "../models/MetricasUsuario.js";
import AchievementConfig from "../models/AchievementConfig.js";

const router = express.Router();

// Endpoint para debug - obter informações detalhadas sobre as conquistas
router.get("/debug/achievements", async (req, res) => {
  try {
    console.log("🔍 Debug: Buscando informações sobre conquistas...");
    
    // Obter algumas métricas de usuário para verificar o estado atual
    const sampleMetricas = await MetricasUsuario.findOne({});
    
    if (!sampleMetricas) {
      return res.json({
        success: true,
        message: "Nenhum documento encontrado",
        configs: await AchievementConfig.getAllConfigs(),
        totalMetricas: 0
      });
    }
    
    // Pegar informações sobre as conquistas do primeiro documento
    const achievementsInfo = sampleMetricas.achievements.achievements.map(ach => ({
      achievementId: ach.achievementId,
      title: ach.achievementData?.title,
      description: ach.achievementData?.description,
      points: ach.achievementData?.points,
      rarity: ach.achievementData?.rarity,
      icon: ach.achievementData?.icon,
      unlocked: ach.unlocked,
      progress: ach.progress
    }));
    
    // Obter as configurações atuais
    const configs = await AchievementConfig.getAllConfigs();
    
    // Obter contagem total de documentos
    const totalMetricas = await MetricasUsuario.countDocuments();
    
    console.log("✅ Debug concluído com sucesso");
    
    res.json({
      success: true,
      totalMetricas,
      sampleUserId: sampleMetricas.usuarioId,
      sampleUserName: sampleMetricas.usuarioNome,
      achievementsInSample: achievementsInfo,
      configs,
      message: `Debug realizado com sucesso em ${totalMetricas} documentos`
    });
  } catch (error) {
    console.error("❌ Erro no debug de conquistas:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para forçar atualização de todas as conquistas
router.post("/debug/update-all-achievements", async (req, res) => {
  try {
    console.log("🔄 Iniciando atualização forçada de todas as conquistas...");
    
    // Obter todas as configurações atuais
    const configs = await AchievementConfig.getAllConfigs();
    
    if (Object.keys(configs).length === 0) {
      // Se não houver configurações no AchievementConfig, usar as padrão
      const defaultRules = MetricasUsuario.getConfiguracoesPadrao();
      
      // Salvar as configurações padrão no modelo AchievementConfig
      for (const [achievementId, rule] of Object.entries(defaultRules)) {
        await AchievementConfig.updateConfig(achievementId, {
          ...rule,
          target: rule.criteria?.target || 1
        });
      }
      
      // Atualizar configs após salvar
      const savedConfigs = await AchievementConfig.getAllConfigs();
      configs = savedConfigs;
    }
    
    // Converter array para objeto para facilitar a busca
    const configsMap = {};
    configs.forEach(config => {
      configsMap[config.achievementId] = config;
    });

    // Encontrar todos os documentos de métricas de usuário
    const metricasUsuarios = await MetricasUsuario.find({});
    
    let totalUpdated = 0;
    let totalDocuments = metricasUsuarios.length;
    const errors = [];

    console.log(`📝 Processando ${totalDocuments} documentos...`);

    // Iterar por todos os documentos e atualizar as conquistas
    for (const metrica of metricasUsuarios) {
      let documentUpdated = false;
      
      try {
        // Iterar pelas conquistas no documento
        for (let i = 0; i < metrica.achievements.achievements.length; i++) {
          const achievement = metrica.achievements.achievements[i];
          const achievementId = achievement.achievementId;
          const config = configsMap[achievementId];
          
          if (config) {
            // Verificar se os dados são diferentes antes de atualizar
            const needsUpdate = 
              achievement.achievementData.title !== config.title ||
              achievement.achievementData.description !== config.description ||
              achievement.achievementData.points !== config.points ||
              achievement.achievementData.rarity !== config.rarity ||
              achievement.achievementData.icon !== config.icon ||
              achievement.rarity !== config.rarity ||
              achievement.fixedXpValue !== config.points;
            
            if (needsUpdate) {
              // Atualizar os dados da conquista com base na configuração atual
              metrica.achievements.achievements[i].achievementData.title = config.title;
              metrica.achievements.achievements[i].achievementData.description = config.description;
              metrica.achievements.achievements[i].achievementData.points = config.points;
              metrica.achievements.achievements[i].achievementData.rarity = config.rarity;
              metrica.achievements.achievements[i].achievementData.icon = config.icon;
              metrica.achievements.achievements[i].achievementData.category = config.category;
              metrica.achievements.achievements[i].achievementData.difficulty = config.difficulty;
              metrica.achievements.achievements[i].achievementData.criteria = config.criteria;

              // Atualizar também os campos editáveis diretamente
              metrica.achievements.achievements[i].rarity = config.rarity;
              metrica.achievements.achievements[i].fixedXpValue = config.points;
              
              documentUpdated = true;
            }
          }
        }

        if (documentUpdated) {
          await metrica.save();
          totalUpdated++;
          console.log(`💾 Documento ${metrica.usuarioId} atualizado`);
        }
      } catch (docError) {
        console.error(`❌ Erro ao atualizar documento ${metrica.usuarioId}:`, docError);
        errors.push({
          userId: metrica.usuarioId,
          error: docError.message
        });
      }
    }

    console.log(`✅ Atualização forçada concluída: ${totalUpdated} de ${totalDocuments} documentos atualizados`);

    res.json({
      success: true,
      message: `Atualização forçada concluída: ${totalUpdated} de ${totalDocuments} documentos atualizados`,
      totalDocuments,
      totalUpdated,
      errors,
      configsApplied: Object.keys(configsMap)
    });
  } catch (error) {
    console.error("❌ Erro na atualização forçada de conquistas:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;