import achievementRulesService from './achievementRulesService.js';
import { UserAchievement } from '../models/UserAchievement.js';
import Auditoria from '../models/Auditoria.js';

class AchievementMonitor {
  constructor() {
    this.init();
  }

  async init() {
    console.log('🎯 Achievement Monitor initialized');
  }

  // Method to monitor and update achievements after audit data is processed
  async onAuditDataProcessed(usuarioId, loja, tipoAuditoria, situacao) {
    try {
      console.log(`🎯 Monitoring audit for user ${usuarioId}, loja ${loja}, type ${tipoAuditoria}, situation ${situacao}`);
      
      // Update progress for audit-based achievements
      const achievementUpdates = [];

      // Check if this is an updated audit (which counts toward audit achievements)
      if (situacao === 'Atualizado') {
        achievementUpdates.push(
          this.updateAchievementProgress(usuarioId, loja, 'first-audit', 1),
          this.updateAchievementProgress(usuarioId, loja, 'audit-enthusiast', 1),
          this.updateAchievementProgress(usuarioId, loja, 'audit-master', 1),
          this.updateAchievementProgress(usuarioId, loja, 'weekly-warrior', 1)
        );
      }

      // Wait for all achievement updates to complete
      await Promise.all(achievementUpdates);
      
      // Evaluate all achievements for the user based on their metrics
      await achievementRulesService.evaluateUserAchievements(usuarioId, loja);
      
      console.log(`✅ Achievement monitoring completed for user ${usuarioId}`);
    } catch (error) {
      console.error('❌ Error in achievement monitoring:', error);
    }
  }

  // Method to monitor and update achievements after suggestion is added
  async onSuggestionAdded(usuarioId, lojaId) {
    try {
      // Convert ObjectId to string if needed
      const loja = typeof lojaId === 'string' ? lojaId : lojaId.toString();
      const userId = typeof usuarioId === 'string' ? usuarioId : (usuarioId ? usuarioId.toString() : null);

      if (!userId) {
        console.log(`💡 Suggestion added but no user ID provided for achievement tracking`);
        return;
      }

      console.log(`💡 Monitoring suggestion for user ${userId}, loja ${loja}`);

      // Update progress for suggestion-based achievements
      await this.updateAchievementProgress(userId, loja, 'active-suggester', 1);
      await this.updateAchievementProgress(userId, loja, 'innovation-leader', 1);

      // Evaluate all achievements for the user
      await achievementRulesService.evaluateUserAchievements(userId, loja);

      console.log(`✅ Suggestion achievement monitoring completed for user ${userId}`);
    } catch (error) {
      console.error('❌ Error in suggestion achievement monitoring:', error);
    }
  }

  // Method to update achievement progress
  async updateAchievementProgress(userId, loja, achievementId, increment = 1) {
    try {
      // Find the user achievement
      let userAchievement = await UserAchievement.findOne({
        userId,
        loja,
        achievementId
      });

      if (!userAchievement) {
        // If the achievement doesn't exist, initialize it
        await achievementRulesService.initializeUserAchievements(userId, loja);
        userAchievement = await UserAchievement.findOne({
          userId,
          loja,
          achievementId
        });
      }

      if (userAchievement) {
        // Increment progress if not already unlocked
        if (!userAchievement.unlocked) {
          await userAchievement.incrementProgress(increment);
          console.log(`🔄 Updated achievement ${achievementId} for user ${userId}, new progress: ${userAchievement.progress.current}/${userAchievement.progress.target}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating achievement progress for ${achievementId}:`, error);
    }
  }

  // Method to manually trigger achievement evaluation for all users in a loja
  async evaluateAllUsersAchievements(loja) {
    try {
      console.log(`🎯 Evaluating achievements for all users in loja ${loja}`);
      
      // Get all unique users who have performed audits in this loja
      const users = await Auditoria.distinct('usuarioId', { loja });
      
      for (const userId of users) {
        await achievementRulesService.evaluateUserAchievements(userId, loja);
      }
      
      console.log(`✅ Completed achievement evaluation for ${users.length} users in loja ${loja}`);
    } catch (error) {
      console.error('❌ Error evaluating all users achievements:', error);
    }
  }

  // Method to monitor user's access/rankings for streak-based achievements
  async onUserActivity(usuarioId, loja) {
    try {
      console.log(`⚡ Monitoring activity for user ${usuarioId}, loja ${loja}`);
      
      // This could be extended to update daily streak achievements
      // For now, we just trigger a general evaluation
      await achievementRulesService.triggerAchievementCheck(usuarioId, loja, 'user-activity');
    } catch (error) {
      console.error('❌ Error in user activity monitoring:', error);
    }
  }

  // Method to get achievement summary for a user
  async getUserAchievementSummary(userId, loja) {
    try {
      const allAchievements = await UserAchievement.getUserAchievements(userId, loja);
      const unlockedCount = allAchievements.filter(ua => ua.unlocked).length;
      const totalPoints = allAchievements
        .filter(ua => ua.unlocked)
        .reduce((sum, ua) => sum + (ua.achievementData.points || 0), 0);
      
      return {
        totalAchievements: allAchievements.length,
        unlockedCount,
        lockedCount: allAchievements.length - unlockedCount,
        totalPoints,
        progressPercentage: allAchievements.length > 0 
          ? Math.round((unlockedCount / allAchievements.length) * 100)
          : 0
      };
    } catch (error) {
      console.error('❌ Error getting achievement summary:', error);
      return {
        totalAchievements: 0,
        unlockedCount: 0,
        lockedCount: 0,
        totalPoints: 0,
        progressPercentage: 0
      };
    }
  }
}

export default new AchievementMonitor();