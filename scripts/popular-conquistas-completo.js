// scripts/popular-conquistas-completo.js
import mongoose from "mongoose";
import Conquista from "../models/Conquista.js";
import conectarBanco from "../config/db.js";

/**
 * Script COMPLETO para popular TODAS as conquistas do sistema
 * Baseado nos componentes existentes em frontend/src/components/conquistas/
 * Mapeado para os campos corretos do modelo MetricasUsuario
 */

const conquistas = [
  // ==================== AUDITORIAS ====================
  {
    achievementId: "first-audit",
    title: "Primeira Auditoria",
    description: "Fez sua primeira auditoria",
    icon: "🎉",
    category: "audits",
    difficulty: "easy",
    points: 10,
    criteria: {
      type: "count",
      target: 1,
      description: "Realizar 1 auditoria completa",
    },
    sourceField: "contadoresAuditorias.totalGeral",
    ordem: 1,
  },
  {
    achievementId: "audit-enthusiast",
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
    sourceField: "contadoresAuditorias.totalGeral",
    ordem: 2,
  },
  {
    achievementId: "audit-master",
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
    sourceField: "contadoresAuditorias.totalGeral",
    ordem: 3,
  },
  {
    achievementId: "detetive",
    title: "Detetive",
    description: "Identificou 10 ou mais itens faltantes",
    icon: "🔍",
    category: "audits",
    difficulty: "medium",
    points: 20,
    criteria: {
      type: "count",
      target: 10,
      description: "Identificar 10 itens faltantes",
    },
    sourceField: "rupturas.itensSemEstoque",
    ordem: 4,
  },
  {
    achievementId: "guardiao-presenca",
    title: "Guardião da Presença",
    description: "Completou setor com cobertura e precisão totais",
    icon: "🛡️",
    category: "audits",
    difficulty: "hard",
    points: 75,
    criteria: {
      type: "percentage",
      target: 100,
      description: "Completar setor com 100% de cobertura e precisão",
    },
    sourceField: "presencas.percentualPresenca",
    ordem: 5,
  },

  // ==================== PERFORMANCE ====================
  {
    achievementId: "meta-100",
    title: "Centena",
    description: "Leu 100 itens em auditorias",
    icon: "💯",
    category: "performance",
    difficulty: "easy",
    points: 15,
    criteria: {
      type: "count",
      target: 100,
      description: "Ler 100 itens",
    },
    sourceField: "totaisAcumulados.itensLidosTotal",
    ordem: 6,
  },
  {
    achievementId: "meta-500",
    title: "Meta Batida",
    description: "Leu mais de 500 itens",
    icon: "🎯",
    category: "performance",
    difficulty: "medium",
    points: 50,
    criteria: {
      type: "count",
      target: 500,
      description: "Ler 500 itens",
    },
    sourceField: "totaisAcumulados.itensLidosTotal",
    ordem: 7,
  },
  {
    achievementId: "maratona",
    title: "Maratona",
    description: "Leu mais de 1000 itens",
    icon: "🏅",
    category: "performance",
    difficulty: "hard",
    points: 100,
    criteria: {
      type: "count",
      target: 1000,
      description: "Ler 1000 itens",
    },
    sourceField: "totaisAcumulados.itensLidosTotal",
    ordem: 8,
  },
  {
    achievementId: "perfect-accuracy",
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
    sourceField: "totais.percentualConclusaoGeral",
    ordem: 9,
  },
  {
    achievementId: "relampago",
    title: "Relâmpago",
    description: "Verificou 50 itens rapidamente (em menos de 1 hora)",
    icon: "⚡",
    category: "performance",
    difficulty: "medium",
    points: 35,
    criteria: {
      type: "custom",
      target: 50,
      description: "Verificar 50 itens em menos de 1 hora",
    },
    sourceField: "totaisAcumulados.itensLidosTotal",
    repeticao: "diaria",
    ordem: 10,
  },
  {
    achievementId: "zero-faltas",
    title: "Zero Faltas",
    description: "Completou auditoria sem itens faltantes",
    icon: "🛡️",
    category: "performance",
    difficulty: "medium",
    points: 30,
    criteria: {
      type: "custom",
      target: 0,
      description: "Completar auditoria sem itens faltantes",
    },
    sourceField: "rupturas.itensSemEstoque",
    repeticao: "diaria",
    ordem: 11,
  },
  {
    achievementId: "top-performer",
    title: "Top Performer",
    description: "Acima da média geral de desempenho",
    icon: "⭐",
    category: "performance",
    difficulty: "hard",
    points: 100,
    criteria: {
      type: "custom",
      target: 100,
      description: "Estar acima da média em múltiplos critérios",
    },
    sourceField: "totais.percentualConclusaoGeral",
    ordem: 12,
  },

  // ==================== CONSISTÊNCIA ====================
  {
    achievementId: "consistencia",
    title: "Consistência",
    description: "Manteve 75% ou mais de conclusão",
    icon: "📈",
    category: "consistency",
    difficulty: "medium",
    points: 25,
    criteria: {
      type: "percentage",
      target: 75,
      description: "Manter 75% de conclusão",
    },
    sourceField: "totais.percentualConclusaoGeral",
    ordem: 13,
  },
  {
    achievementId: "consistent-auditor",
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
    sourceField: "tendencias.currentStreak",
    ordem: 14,
  },
  {
    achievementId: "weekly-warrior",
    title: "Guerreiro Semanal",
    description: "Realizou 5 auditorias em uma semana",
    icon: "🔥",
    category: "consistency",
    difficulty: "medium",
    points: 20,
    criteria: {
      type: "count",
      target: 5,
      period: 7,
      description: "Realizar 5 auditorias em uma semana",
    },
    sourceField: "tendencias.weeklyAudits",
    ordem: 15,
  },
  {
    achievementId: "o-invencivel",
    title: "O Invencível",
    description: "Manteve 4 semanas consecutivas como Top Performer",
    icon: "💪",
    category: "consistency",
    difficulty: "hard",
    points: 500,
    criteria: {
      type: "custom",
      target: 4,
      description: "Manter 4 semanas consecutivas como Top Performer",
    },
    sourceField: "tendencias.currentStreak",
    ordem: 16,
  },

  // ==================== PARTICIPAÇÃO ====================
  {
    achievementId: "explorador",
    title: "Explorador",
    description: "Cobriu 5 ou mais setores diferentes",
    icon: "🗺️",
    category: "participation",
    difficulty: "easy",
    points: 25,
    criteria: {
      type: "count",
      target: 5,
      description: "Cobrir 5 setores diferentes",
    },
    sourceField: "ContadorLocais",
    ordem: 17,
  },
  {
    achievementId: "corredor-mestre",
    title: "Corredor Mestre",
    description: "Cobriu 10 ou mais setores diferentes",
    icon: "🏆",
    category: "participation",
    difficulty: "medium",
    points: 50,
    criteria: {
      type: "count",
      target: 10,
      description: "Cobrir 10 setores diferentes",
    },
    sourceField: "ContadorLocais",
    ordem: 18,
  },
  {
    achievementId: "team-player",
    title: "Jogador de Equipe",
    description: "Trabalhou em 3 setores diferentes",
    icon: "🤝",
    category: "participation",
    difficulty: "easy",
    points: 20,
    criteria: {
      type: "count",
      target: 3,
      description: "Trabalhar em 3 setores diferentes",
    },
    sourceField: "ContadorLocais",
    ordem: 19,
  },
  {
    achievementId: "mestre-corredores",
    title: "Mestre dos Corredores",
    description: "Domínio total - cobriu todos os corredores da loja",
    icon: "🏆",
    category: "participation",
    difficulty: "hard",
    points: 500,
    criteria: {
      type: "custom",
      target: 100,
      description: "Cobrir todos os corredores disponíveis na loja",
    },
    sourceField: "ContadorLocais",
    ordem: 20,
  },
  {
    achievementId: "pioneiro-dia",
    title: "Pioneiro do Dia",
    description: "Primeira leitura do dia na auditoria",
    icon: "🌅",
    category: "participation",
    difficulty: "medium",
    points: 25,
    criteria: {
      type: "custom",
      target: 1,
      description: "Ser o primeiro a fazer leitura no dia",
    },
    sourceField: "contadoresAuditorias.totalGeral",
    repeticao: "diaria",
    ordem: 21,
  },

  // ==================== CONQUISTAS PROGRESSIVAS ====================
  {
    achievementId: "lenda-viva-iniciante",
    title: "Iniciante Dedicado",
    description: "Realizou auditorias em 5 dias diferentes",
    icon: "🌱",
    category: "consistency",
    difficulty: "easy",
    points: 25,
    criteria: {
      type: "count",
      target: 5,
      description: "Auditar em 5 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 22,
  },
  {
    achievementId: "lenda-viva-ativo",
    title: "Auditor Ativo",
    description: "Realizou auditorias em 10 dias diferentes",
    icon: "🚀",
    category: "consistency",
    difficulty: "easy",
    points: 50,
    criteria: {
      type: "count",
      target: 10,
      description: "Auditar em 10 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 23,
  },
  {
    achievementId: "lenda-viva-veterano",
    title: "Veterano",
    description: "Realizou auditorias em 25 dias diferentes",
    icon: "🛡️",
    category: "consistency",
    difficulty: "medium",
    points: 100,
    criteria: {
      type: "count",
      target: 25,
      description: "Auditar em 25 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 24,
  },
  {
    achievementId: "lenda-viva",
    title: "Lenda Viva",
    description: "Realizou auditorias em 50 dias diferentes",
    icon: "🏛️",
    category: "consistency",
    difficulty: "hard",
    points: 250,
    criteria: {
      type: "count",
      target: 50,
      description: "Auditar em 50 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 25,
  },
  {
    achievementId: "lenda-viva-mestre",
    title: "Mestre Lendário",
    description: "Realizou auditorias em 75 dias diferentes",
    icon: "👑",
    category: "consistency",
    difficulty: "hard",
    points: 400,
    criteria: {
      type: "count",
      target: 75,
      description: "Auditar em 75 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 26,
  },
  {
    achievementId: "lenda-viva-icone",
    title: "Ícone dos Auditores",
    description: "Realizou auditorias em 100 dias diferentes",
    icon: "🌟",
    category: "consistency",
    difficulty: "hard",
    points: 600,
    criteria: {
      type: "count",
      target: 100,
      description: "Auditar em 100 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 27,
  },
  {
    achievementId: "lenda-imortal",
    title: "Lenda Imortal",
    description: "Realizou auditorias em 200 dias diferentes",
    icon: "💫",
    category: "consistency",
    difficulty: "hard",
    points: 1000,
    criteria: {
      type: "count",
      target: 200,
      description: "Auditar em 200 dias diferentes",
    },
    sourceField: "tendencias.diasAtivos",
    ordem: 28,
  },

  // ==================== CONQUISTAS ESPECIAIS DE RANKING ====================
  {
    achievementId: "lider-podio-ouro",
    title: "🥇 Líder do Pódio",
    description: "1º lugar no ranking - Maior número de itens lidos!",
    icon: "🥇",
    category: "performance",
    difficulty: "hard",
    points: 100,
    criteria: {
      type: "custom",
      target: 1,
      description: "Alcançar 1º lugar no ranking",
    },
    sourceField: "ranking.posicaoGeral",
    repeticao: "diaria",
    ordem: 29,
  },
  {
    achievementId: "lider-podio-prata",
    title: "🥈 Vice-Líder",
    description: "2º lugar no ranking - Excelente desempenho!",
    icon: "🥈",
    category: "performance",
    difficulty: "medium",
    points: 50,
    criteria: {
      type: "custom",
      target: 2,
      description: "Alcançar 2º lugar no ranking",
    },
    sourceField: "ranking.posicaoGeral",
    repeticao: "diaria",
    ordem: 30,
  },
  {
    achievementId: "lider-podio-bronze",
    title: "🥉 Top 3",
    description: "3º lugar no ranking - Entre os melhores!",
    icon: "🥉",
    category: "performance",
    difficulty: "medium",
    points: 25,
    criteria: {
      type: "custom",
      target: 3,
      description: "Alcançar 3º lugar no ranking",
    },
    sourceField: "ranking.posicaoGeral",
    repeticao: "diaria",
    ordem: 31,
  },
];

/**
 * Função principal de migração
 */
async function popularConquistas() {
  try {
    console.log("🚀 Iniciando população COMPLETA de conquistas...\n");

    // Conectar ao banco
    await conectarBanco();

    // Verificar conquistas existentes
    const countExistentes = await Conquista.countDocuments();
    console.log(`📊 Conquistas existentes no banco: ${countExistentes}\n`);

    if (countExistentes > 0) {
      console.log("⚠️  ATENÇÃO: Já existem conquistas no banco!");
      console.log("   Todas as conquistas antigas serão removidas e substituídas.\n");

      // Limpar conquistas existentes
      await Conquista.deleteMany({});
      console.log("🗑️  Conquistas antigas removidas\n");
    }

    // Inserir novas conquistas
    console.log("📝 Inserindo conquistas...\n");

    let sucessos = 0;
    let erros = 0;

    for (const conquistaData of conquistas) {
      try {
        const conquista = new Conquista(conquistaData);
        await conquista.save();
        console.log(
          `  ✅ ${conquista.icon} ${conquista.title} (${conquista.points} XP) - ${conquista.category}`
        );
        sucessos++;
      } catch (error) {
        console.error(
          `  ❌ Erro ao criar ${conquistaData.title}:`,
          error.message
        );
        erros++;
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log(`📊 RESUMO:`);
    console.log(`  Total de conquistas: ${conquistas.length}`);
    console.log(`  Sucessos: ${sucessos}`);
    console.log(`  Erros: ${erros}`);
    console.log("=".repeat(70));

    // Exibir estatísticas por categoria
    console.log("\n📈 ESTATÍSTICAS POR CATEGORIA:");

    const stats = await Conquista.aggregate([
      { $match: { ativo: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalXP: { $sum: "$points" },
        },
      },
      { $sort: { totalXP: -1 } },
    ]);

    stats.forEach((stat) => {
      const emoji = {
        audits: "📋",
        performance: "⚡",
        consistency: "📅",
        participation: "🤝",
      };
      console.log(
        `  ${emoji[stat._id] || "🏆"} ${stat._id}: ${stat.count} conquistas (${stat.totalXP} XP total)`
      );
    });

    // Estatísticas por dificuldade
    console.log("\n📈 ESTATÍSTICAS POR DIFICULDADE:");

    const statsDiff = await Conquista.aggregate([
      { $match: { ativo: true } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
          totalXP: { $sum: "$points" },
        },
      },
      { $sort: { totalXP: -1 } },
    ]);

    statsDiff.forEach((stat) => {
      const emoji = {
        easy: "🟢",
        medium: "🟡",
        hard: "🔴",
      };
      console.log(
        `  ${emoji[stat._id] || "⚪"} ${stat._id}: ${stat.count} conquistas (${stat.totalXP} XP total)`
      );
    });

    // Total de XP disponível
    const totalXP = conquistas.reduce((sum, c) => sum + c.points, 0);
    console.log(`\n💰 XP Total Disponível: ${totalXP} XP`);

    console.log("\n✅ População concluída com sucesso!");
    console.log("\n📋 Próximos passos:");
    console.log("  1. As conquistas estão salvas no MongoDB");
    console.log("  2. Acesse /achievements para gerenciar");
    console.log("  3. Acesse perfis de usuários para ver conquistas");
    console.log("  4. (Opcional) Delete a pasta frontend/src/components/conquistas/\n");
  } catch (error) {
    console.error("❌ Erro ao popular conquistas:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Conexão com banco fechada");
    process.exit(0);
  }
}

// Executar script
popularConquistas();
