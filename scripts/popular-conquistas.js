// scripts/popular-conquistas.js
import mongoose from "mongoose";
import Conquista from "../models/Conquista.js";
import conectarBanco from "../config/db.js";

/**
 * Script para popular o banco de dados com as conquistas do sistema
 * Baseado nas conquistas existentes em frontend/src/components/conquistas/
 */

const conquistas = [
  // ==================== AUDITORIAS ====================
  {
    achievementId: "first-audit",
    title: "Primeira Auditoria",
    description: "Concluiu sua primeira auditoria com sucesso",
    icon: "🔍",
    category: "audits",
    difficulty: "easy",
    points: 10,
    criteria: {
      type: "count",
      target: 1,
      description: "Realizar 1 auditoria atualizada",
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
    ordem: 4,
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
    ordem: 5,
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
    ordem: 6,
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
    ordem: 7,
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
    ordem: 8,
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
    ordem: 9,
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
    ordem: 10,
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
    ordem: 11,
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
    ordem: 12,
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
    ordem: 13,
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
    ordem: 14,
  },

  // ==================== CONQUISTAS ESPECIAIS ====================
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
    ordem: 15,
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
    ordem: 16,
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
    ordem: 17,
  },
];

/**
 * Função principal de migração
 */
async function popularConquistas() {
  try {
    console.log("🚀 Iniciando população de conquistas...\n");

    // Conectar ao banco
    await conectarBanco();

    // Limpar conquistas existentes (opcional - comentar se não quiser limpar)
    const countExistentes = await Conquista.countDocuments();
    console.log(`📊 Conquistas existentes no banco: ${countExistentes}`);

    const resposta = "s"; // Pode alterar para "n" se não quiser limpar
    if (resposta.toLowerCase() === "s") {
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
        console.log(`  ✅ ${conquista.icon} ${conquista.title} (${conquista.points} XP)`);
        sucessos++;
      } catch (error) {
        console.error(`  ❌ Erro ao criar ${conquistaData.title}:`, error.message);
        erros++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`📊 RESUMO:`);
    console.log(`  Total: ${conquistas.length}`);
    console.log(`  Sucessos: ${sucessos}`);
    console.log(`  Erros: ${erros}`);
    console.log("=".repeat(50));

    // Exibir estatísticas
    console.log("\n📈 ESTATÍSTICAS:");

    const stats = await Conquista.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalXP: { $sum: "$points" },
        },
      },
    ]);

    stats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} conquistas (${stat.totalXP} XP total)`);
    });

    console.log("\n✅ População concluída com sucesso!");
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
