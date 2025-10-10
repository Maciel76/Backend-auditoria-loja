// Script para verificar UserDailyMetrics no MongoDB
import mongoose from "mongoose";
import UserDailyMetrics from "./models/UserDailyMetrics.js";

const MONGODB_URI = "mongodb://localhost:27017/auditorias";

async function verificarUserDailyMetrics() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Buscar registros UserDailyMetrics
    const records = await UserDailyMetrics.find({ loja: "60f8e2b8d4a4f1234567890a" }); // ObjectId para loja 105

    console.log(`📋 Encontrados ${records.length} registros UserDailyMetrics:`);

    records.forEach((record, index) => {
      console.log(`\n--- Registro ${index + 1} ---`);
      console.log(`Usuario: ${record.usuarioNome} (${record.usuarioId})`);
      console.log(`Loja: ${record.lojaNome}`);

      // Verificar se tem campos legados
      const hasLegacyFields = !!(record.metricas?.contadorClasses ||
                                 record.metricas?.contadorLocais ||
                                 record.metricas?.contadoresAuditorias ||
                                 record.metricas?.ranking ||
                                 record.metricas?.tendencias);

      console.log(`Tem campos legados: ${hasLegacyFields}`);

      if (hasLegacyFields) {
        console.log("Campos legados encontrados:");
        if (record.metricas?.contadorClasses) console.log("  - contadorClasses (root)");
        if (record.metricas?.contadorLocais) console.log("  - contadorLocais (root)");
        if (record.metricas?.contadoresAuditorias) console.log("  - contadoresAuditorias");
        if (record.metricas?.ranking) console.log("  - ranking");
        if (record.metricas?.tendencias) console.log("  - tendencias");
      }

      // Verificar estrutura correta
      const hasCorrectStructure = !!(record.metricas?.etiquetas?.contadorClasses ||
                                     record.metricas?.rupturas?.contadorClasses ||
                                     record.metricas?.presencas?.contadorClasses);

      console.log(`Tem estrutura correta: ${hasCorrectStructure}`);
      console.log(`Data ultima atualização: ${record.metricas?.ultimaAtualizacao}`);
    });

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão fechada");
  }
}

verificarUserDailyMetrics();