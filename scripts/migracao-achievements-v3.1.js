/**
 * Script de Migração: Atualizar MetricasUsuario para versão 3.1
 *
 * Adiciona campos novos de tendências para suportar conquistas de consistência
 *
 * Novos campos:
 * - tendencias.currentStreak
 * - tendencias.weeklyAudits
 * - tendencias.lastAuditDate
 *
 * Como executar:
 * node backend/scripts/migracao-achievements-v3.1.js
 */

import mongoose from 'mongoose';
import MetricasUsuario from '../models/MetricasUsuario.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const conectarDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auditoria';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função principal de migração
const executarMigracao = async () => {
  console.log('\n🚀 Iniciando migração para versão 3.1...\n');

  try {
    // 1. Contar documentos que precisam de atualização
    const totalDocumentos = await MetricasUsuario.countDocuments({
      $or: [
        { 'tendencias.currentStreak': { $exists: false } },
        { 'tendencias.weeklyAudits': { $exists: false } }
      ]
    });

    console.log(`📊 Documentos encontrados para atualização: ${totalDocumentos}`);

    if (totalDocumentos === 0) {
      console.log('✅ Todos os documentos já estão atualizados!');
      return;
    }

    // 2. Atualizar documentos com os novos campos
    const resultado = await MetricasUsuario.updateMany(
      {
        $or: [
          { 'tendencias.currentStreak': { $exists: false } },
          { 'tendencias.weeklyAudits': { $exists: false } }
        ]
      },
      {
        $set: {
          'tendencias.currentStreak': 0,
          'tendencias.weeklyAudits': 0,
          'versaoCalculo': '3.1'
        }
      }
    );

    console.log(`\n✅ Migração concluída!`);
    console.log(`   - Documentos correspondentes: ${resultado.matchedCount}`);
    console.log(`   - Documentos modificados: ${resultado.modifiedCount}`);

    // 3. Verificar se há documentos para recalcular achievements
    console.log('\n🔄 Recalculando achievements para documentos atualizados...');

    const documentos = await MetricasUsuario.find({
      versaoCalculo: '3.1'
    }).limit(100); // Processar em lotes de 100

    let recalculados = 0;
    for (const doc of documentos) {
      try {
        // Recalcular achievements com as novas fontes de dados
        doc.calcularAchievements();
        await doc.save();
        recalculados++;
      } catch (error) {
        console.error(`❌ Erro ao recalcular achievements para documento ${doc._id}:`, error.message);
      }
    }

    console.log(`✅ Achievements recalculados: ${recalculados} documentos`);

    // 4. Relatório final
    console.log('\n📈 Relatório de Migração:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total de documentos atualizados: ${resultado.modifiedCount}`);
    console.log(`   Documentos com achievements recalculados: ${recalculados}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 5. Estatísticas adicionais
    const stats = await MetricasUsuario.aggregate([
      {
        $group: {
          _id: '$versaoCalculo',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Distribuição por versão:');
    stats.forEach(stat => {
      console.log(`   Versão ${stat._id}: ${stat.count} documentos`);
    });

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    throw error;
  }
};

// Função para verificar integridade após migração
const verificarIntegridade = async () => {
  console.log('\n🔍 Verificando integridade dos dados...');

  try {
    // Verificar se todos os documentos têm os novos campos
    const semCurrentStreak = await MetricasUsuario.countDocuments({
      'tendencias.currentStreak': { $exists: false }
    });

    const semWeeklyAudits = await MetricasUsuario.countDocuments({
      'tendencias.weeklyAudits': { $exists: false }
    });

    if (semCurrentStreak > 0 || semWeeklyAudits > 0) {
      console.log('⚠️  Atenção: Alguns documentos ainda não têm os novos campos!');
      console.log(`   - Sem currentStreak: ${semCurrentStreak}`);
      console.log(`   - Sem weeklyAudits: ${semWeeklyAudits}`);
    } else {
      console.log('✅ Todos os documentos têm os novos campos!');
    }

    // Verificar se há conquistas desbloqueadas
    const comConquistas = await MetricasUsuario.countDocuments({
      'achievements.achievements.unlocked': true
    });

    console.log(`\n🏆 Documentos com conquistas desbloqueadas: ${comConquistas}`);

    // Estatísticas de XP
    const xpStats = await MetricasUsuario.aggregate([
      {
        $group: {
          _id: null,
          xpMedio: { $avg: '$achievements.xp.total' },
          xpMaximo: { $max: '$achievements.xp.total' },
          nivelMedio: { $avg: '$achievements.level.current' }
        }
      }
    ]);

    if (xpStats.length > 0) {
      console.log('\n📊 Estatísticas de XP:');
      console.log(`   XP médio: ${Math.round(xpStats[0].xpMedio)}`);
      console.log(`   XP máximo: ${xpStats[0].xpMaximo}`);
      console.log(`   Nível médio: ${Math.round(xpStats[0].nivelMedio * 10) / 10}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar integridade:', error);
  }
};

// Executar migração
const main = async () => {
  try {
    await conectarDB();
    await executarMigracao();
    await verificarIntegridade();

    console.log('\n✅ Migração concluída com sucesso!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }
};

// Executar apenas se for o arquivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { executarMigracao, verificarIntegridade };
