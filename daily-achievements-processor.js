// daily-achievements-processor.js
// Processador diário de conquistas - EXECUTA APENAS UMA VEZ POR DIA
import achievementRulesService from "./services/achievementRulesService.js";
import { User } from "./models/User.js"; // Ajuste conforme seu modelo de usuário
import { UserAchievement } from "./models/UserAchievement.js";

class DailyAchievementsProcessor {
  constructor() {
    this.isProcessing = false;
  }

  // Executar processamento diário
  async processDailyAchievements() {
    if (this.isProcessing) {
      console.log("⚠️ Processamento diário já em andamento");
      return;
    }

    this.isProcessing = true;
    console.log("📅 Iniciando processamento diário de conquistas...");

    try {
      // Obter todas as lojas existentes
      const lojas = await this.getAllLojas();

      for (const loja of lojas) {
        console.log(`🏪 Processando conquistas para loja: ${loja.codigo}`);
        await this.processLojaAchievements(loja.codigo);
      }

      console.log("✅ Processamento diário de conquistas concluído");
    } catch (error) {
      console.error("❌ Erro no processamento diário de conquistas:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Processar conquistas para uma loja específica
  async processLojaAchievements(lojaCode) {
    try {
      // Obter todos os usuários que tiveram atividade na loja
      const userIds = await this.getUserIdsForLoja(lojaCode);

      console.log(`👥 Encontrados ${userIds.length} usuários para processar na loja ${lojaCode}`);

      for (const userId of userIds) {
        try {
          await achievementRulesService.evaluateUserAchievements(
            userId,
            lojaCode
          );
        } catch (error) {
          console.error(`Erro processando usuário ${userId} na loja ${lojaCode}:`, error);
        }
      }
    } catch (error) {
      console.error(`Erro processando loja ${lojaCode}:`, error);
    }
  }

  // Obter todas as lojas
  async getAllLojas() {
    // Ajuste conforme seu modelo de dados
    const Loja = await import("./models/Loja.js").then(m => m.default);
    return await Loja.find({}, { codigo: 1, _id: 1 });
  }

  // Obter IDs de usuários que tiveram atividade em uma loja
  async getUserIdsForLoja(lojaCode) {
    // Ajuste conforme seu modelo de dados - aqui estou usando o modelo de Auditoria
    const Auditoria = await import("./models/Auditoria.js").then(m => m.default);
    
    // Obter IDs de usuários com atividade recente na loja
    const userIds = await Auditoria.distinct("usuarioId", {
      loja: lojaCode,
      data: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 dias
    });

    return userIds;
  }

  // Iniciar processamento automático (opcional)
  scheduleDailyProcessing() {
    // Executar imediatamente
    this.processDailyAchievements();

    // Agendar para executar diariamente à meia-noite
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); // Próxima meia-noite
    
    const timeUntilMidnight = nextMidnight - now;

    console.log(`⏰ Próxima execução agendada para: ${nextMidnight.toLocaleString()}`);
    
    setTimeout(() => {
      this.processDailyAchievements();
      // Agendar execução subsequente a cada 24 horas
      setInterval(() => {
        this.processDailyAchievements();
      }, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
    }, timeUntilMidnight);
  }
}

// Criar e exportar instância
export const dailyAchievementsProcessor = new DailyAchievementsProcessor();

// Se este arquivo for executado diretamente, iniciar o processador
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("🚀 Iniciando processador diário de conquistas...");
  dailyAchievementsProcessor.scheduleDailyProcessing();
}