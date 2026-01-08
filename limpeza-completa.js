// Script para limpeza completa de dados legados
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/auditorias";

async function limpezaCompleta() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    const db = mongoose.connection.db;

    // 1. Encontrar todos os UserDailyMetrics
    console.log("\n🔍 Verificando UserDailyMetrics...");
    const userDailyCount = await db.collection("userdailymetrics").countDocuments({});
    console.log(`📊 Encontrados ${userDailyCount} registros em UserDailyMetrics`);

    if (userDailyCount > 0) {
      // Encontrar alguns exemplos para ver a estrutura
      const exemplos = await db.collection("userdailymetrics").find({}).limit(2).toArray();
      exemplos.forEach((exemplo, index) => {
        console.log(`\n--- Exemplo ${index + 1} ---`);
        console.log(`Usuario: ${exemplo.usuarioNome}`);
        console.log(`Loja: ${exemplo.lojaNome}`);
        console.log(`Tem campos legados: ${!!(exemplo.metricas?.contadorClasses || exemplo.metricas?.contadoresAuditorias || exemplo.metricas?.ranking || exemplo.metricas?.tendencias)}`);
      });

      // Deletar TODOS os registros
      console.log("\n🗑️ Removendo TODOS os registros UserDailyMetrics...");
      const resultado = await db.collection("userdailymetrics").deleteMany({});
      console.log(`✅ Removidos ${resultado.deletedCount} registros`);
    }

    // 2. Verificar MetricasUsuario
    console.log("\n🔍 Verificando MetricasUsuario...");
    const metricasCount = await db.collection("metricasusuarios").countDocuments({});
    console.log(`📊 Encontrados ${metricasCount} registros em MetricasUsuario`);

    if (metricasCount > 0) {
      console.log("🗑️ Removendo TODOS os registros MetricasUsuario...");
      const resultado2 = await db.collection("metricasusuarios").deleteMany({});
      console.log(`✅ Removidos ${resultado2.deletedCount} registros`);
    }

    // 3. Verificar outras collections possíveis
    console.log("\n🔍 Verificando outras collections...");
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      if (collection.name.toLowerCase().includes('metric') ||
          collection.name.toLowerCase().includes('user') ||
          collection.name.toLowerCase().includes('daily')) {
        const count = await db.collection(collection.name).countDocuments({});
        console.log(`📋 ${collection.name}: ${count} documentos`);

        if (count > 0) {
          // Verificar se tem estrutura de métricas
          const sample = await db.collection(collection.name).findOne({});
          if (sample && (sample.metricas || sample.contadorClasses || sample.ranking)) {
            console.log(`🗑️ Limpando ${collection.name}...`);
            const resultado = await db.collection(collection.name).deleteMany({});
            console.log(`✅ Removidos ${resultado.deletedCount} registros de ${collection.name}`);
          }
        }
      }
    }

    console.log("\n✅ Limpeza completa finalizada!");

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão fechada");
  }
}

limpezaCompleta();