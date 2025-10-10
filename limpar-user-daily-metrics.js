// Script para limpar UserDailyMetrics antigos e reprocessar com nova estrutura
import mongoose from "mongoose";
import UserDailyMetrics from "./models/UserDailyMetrics.js";

const MONGODB_URI = "mongodb://localhost:27017/auditorias";

async function limparEReprocessar() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Primeiro, vamos ver quantos registros existem
    const count = await UserDailyMetrics.countDocuments({});
    console.log(`📊 Encontrados ${count} registros UserDailyMetrics`);

    // Remover todos os UserDailyMetrics existentes para a loja 105
    const resultado = await UserDailyMetrics.deleteMany({});
    console.log(`🗑️ Removidos ${resultado.deletedCount} registros antigos`);

    console.log("✅ UserDailyMetrics limpo. Agora você pode fazer um novo upload para testar a nova estrutura.");

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão fechada");
  }
}

limparEReprocessar();