import MetricasUsuario from "../models/MetricasUsuario.js";
import AchievementConfig from "../models/AchievementConfig.js";

class AchievementUpdateService {
  /**
   * Atualiza os campos de uma conquista específica em todos os documentos existentes
   * @param {string} achievementId - ID da conquista a ser atualizada
   * @param {Object} updates - Objeto com os campos a serem atualizados
   * @returns {Object} - Resultado da operação
   */
  static async updateAchievementInAllDocuments(achievementId, updates) {
    try {
      // Atualizar a configuração no modelo de configuração
      const config = await AchievementConfig.updateConfig(achievementId, updates);
      
      // Encontrar todos os documentos de métricas de usuário
      const metricasUsuarios = await MetricasUsuario.find({});
      
      let updatedCount = 0;
      const errors = [];

      // Iterar por todos os documentos e atualizar a conquista específica
      for (const metrica of metricasUsuarios) {
        try {
          let achievementUpdated = false;

          // Procurar a conquista específica no array
          for (let i = 0; i < metrica.achievements.achievements.length; i++) {
            if (metrica.achievements.achievements[i].achievementId === achievementId) {
              console.log(`🔄 Atualizando conquista ${achievementId} no documento ${metrica._id}`);

              // Armazenar valores antigos para comparação
              const oldValues = {
                title: metrica.achievements.achievements[i].achievementData.title,
                description: metrica.achievements.achievements[i].achievementData.description,
                points: metrica.achievements.achievements[i].achievementData.points,
                rarity: metrica.achievements.achievements[i].achievementData.rarity,
              };

              // Atualizar os dados da conquista
              metrica.achievements.achievements[i].achievementData.title = updates.title;
              metrica.achievements.achievements[i].achievementData.description = updates.description;
              metrica.achievements.achievements[i].achievementData.points = updates.points;
              metrica.achievements.achievements[i].achievementData.rarity = updates.rarity;
              metrica.achievements.achievements[i].achievementData.icon = updates.icon;
              metrica.achievements.achievements[i].achievementData.category = updates.category;
              metrica.achievements.achievements[i].achievementData.difficulty = updates.difficulty;
              metrica.achievements.achievements[i].achievementData.criteria = updates.criteria;

              // Atualizar também os campos editáveis diretamente
              metrica.achievements.achievements[i].rarity = updates.rarity;
              metrica.achievements.achievements[i].fixedXpValue = updates.points;

              // Registrar alterações
              console.log(`📝 Conquista ${achievementId} atualizada:`);
              console.log(`   - Title: ${oldValues.title} -> ${updates.title}`);
              console.log(`   - Description: ${oldValues.description} -> ${updates.description}`);
              console.log(`   - Points: ${oldValues.points} -> ${updates.points}`);
              console.log(`   - Rarity: ${oldValues.rarity} -> ${updates.rarity}`);

              achievementUpdated = true;
              break;
            }
          }

          if (achievementUpdated) {
            await metrica.save();
            console.log(`💾 Documento ${metrica._id} salvo com sucesso`);
            updatedCount++;
          } else {
            console.log(`⚠️ Conquista ${achievementId} não encontrada no documento ${metrica._id}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao atualizar conquista no documento ${metrica._id}:`, error);
          errors.push({
            documentId: metrica._id,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Configuração da conquista ${achievementId} atualizada em ${updatedCount} registros`,
        updatedCount,
        errors,
        config
      };
    } catch (error) {
      console.error("Erro no serviço de atualização de conquistas:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém todas as configurações de conquistas atualizadas
   * @returns {Array} - Lista de configurações de conquistas
   */
  static async getAllAchievementConfigs() {
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
          });
        }
        
        // Retornar as configurações padrão
        return Object.keys(defaultRules).map(achievementId => ({
          achievementId: achievementId,
          ...defaultRules[achievementId],
          target: defaultRules[achievementId].criteria?.target || 1,
        }));
      } else {
        // Converter para o formato esperado
        return Object.keys(achievementRules).map(achievementId => ({
          achievementId: achievementId,
          title: achievementRules[achievementId].title,
          description: achievementRules[achievementId].description,
          points: achievementRules[achievementId].points,
          rarity: achievementRules[achievementId].rarity,
          icon: achievementRules[achievementId].icon,
          category: achievementRules[achievementId].category,
          difficulty: achievementRules[achievementId].difficulty,
          criteria: achievementRules[achievementId].criteria,
          target: achievementRules[achievementId].criteria?.target || 1,
        }));
      }
    } catch (error) {
      console.error("Erro ao obter configurações de conquistas:", error);
      throw error;
    }
  }

  /**
   * Atualiza os campos de todas as conquistas em todos os documentos com base nas configurações atuais
   * @returns {Object} - Resultado da operação
   */
  static async syncAllAchievementsWithConfigs() {
    try {
      // Obter todas as configurações atuais
      const configs = await this.getAllAchievementConfigs();
      
      // Converter array para objeto para facilitar a busca
      const configsMap = {};
      configs.forEach(config => {
        configsMap[config.achievementId] = config;
      });

      // Encontrar todos os documentos de métricas de usuário
      const metricasUsuarios = await MetricasUsuario.find({});
      
      let totalUpdated = 0;
      let totalDocuments = metricasUsuarios.length;

      // Iterar por todos os documentos e sincronizar as conquistas
      for (const metrica of metricasUsuarios) {
        let documentUpdated = false;

        console.log(`🔄 Sincronizando conquistas para o documento ${metrica._id} (Usuário: ${metrica.usuarioId})`);

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
              console.log(`📝 Atualizando conquista ${achievementId} no documento ${metrica._id}:`);
              console.log(`   - Antes: Title="${achievement.achievementData.title}", Points=${achievement.achievementData.points}`);
              console.log(`   - Depois: Title="${config.title}", Points=${config.points}`);

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
            } else {
              console.log(`✅ Conquista ${achievementId} já está atualizada`);
            }
          } else {
            console.log(`⚠️ Configuração não encontrada para a conquista ${achievementId}`);
          }
        }

        if (documentUpdated) {
          await metrica.save();
          console.log(`💾 Documento ${metrica._id} salvo com conquistas atualizadas`);
          totalUpdated++;
        } else {
          console.log(`✅ Documento ${metrica._id} já estava sincronizado`);
        }
      }

      return {
        success: true,
        message: `Sincronização concluída: ${totalUpdated} de ${totalDocuments} documentos atualizados`,
        totalDocuments,
        totalUpdated
      };
    } catch (error) {
      console.error("Erro ao sincronizar conquistas com configurações:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AchievementUpdateService;