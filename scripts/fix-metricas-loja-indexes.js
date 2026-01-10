// Script para corrigir índices do MetricasLoja
import mongoose from "mongoose";
import dotenv from "dotenv";
import MetricasLoja from "../models/MetricasLoja.js";

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

async function fixIndexes() {
  try {
    console.log("🔌 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    console.log("📋 Listando índices existentes...");
    const indexes = await MetricasLoja.collection.getIndexes();
    console.log("Índices atuais:", Object.keys(indexes));

    // Remover índice antigo problemático se existir
    const oldIndexName = "loja_1_dataInicio_1";
    if (indexes[oldIndexName]) {
      console.log(`🗑️ Removendo índice antigo: ${oldIndexName}`);
      await MetricasLoja.collection.dropIndex(oldIndexName);
      console.log("✅ Índice antigo removido");
    } else {
      console.log(
        "ℹ️ Índice antigo não encontrado (pode já ter sido removido)"
      );
    }

    console.log("🔨 Sincronizando índices do modelo...");
    await MetricasLoja.syncIndexes();
    console.log("✅ Índices sincronizados");

    console.log("📋 Listando novos índices...");
    const newIndexes = await MetricasLoja.collection.getIndexes();
    console.log("Novos índices:", Object.keys(newIndexes));

    // Verificar se há duplicatas
    console.log("\n🔍 Verificando duplicatas...");
    const duplicatas = await MetricasLoja.aggregate([
      {
        $group: {
          _id: "$loja",
          count: { $sum: 1 },
          docs: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    if (duplicatas.length > 0) {
      console.log(
        `⚠️ Encontradas ${duplicatas.length} lojas com registros duplicados`
      );

      for (const dup of duplicatas) {
        console.log(`\n📍 Loja ID: ${dup._id} - ${dup.count} registros`);

        // Manter apenas o mais recente
        const docs = dup.docs.sort(
          (a, b) =>
            new Date(b.ultimaAtualizacao) - new Date(a.ultimaAtualizacao)
        );

        const maisRecente = docs[0];
        const paraRemover = docs.slice(1);

        console.log(
          `  ✅ Mantendo registro: ${maisRecente._id} (atualizado em ${maisRecente.ultimaAtualizacao})`
        );

        for (const doc of paraRemover) {
          console.log(`  🗑️ Removendo registro duplicado: ${doc._id}`);
          await MetricasLoja.deleteOne({ _id: doc._id });
        }
      }

      console.log("\n✅ Duplicatas removidas");
    } else {
      console.log("✅ Nenhuma duplicata encontrada");
    }

    // Estatísticas finais
    const total = await MetricasLoja.countDocuments();
    console.log(`\n📊 Total de registros: ${total}`);

    console.log("\n✅ Correção de índices concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao corrigir índices:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar
fixIndexes()
  .then(() => {
    console.log("\n✅ Script finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script falhou:", error);
    process.exit(1);
  });
