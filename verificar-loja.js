// Script para verificar ID da loja 105
import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/auditorias";

async function verificarLoja() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Listar todas as collections
    const db = mongoose.connection.db;

    // Verificar collection de lojas
    try {
      const lojas = await db.collection("lojas").find({}).toArray();
      console.log(`📋 Encontradas ${lojas.length} lojas:`);

      for (const loja of lojas) {
        console.log(`  - ${loja.codigo}: ${loja.nome} (ID: ${loja._id})`);
      }
    } catch (error) {
      console.log("Não encontrou collection 'lojas', tentando outros nomes...");
    }

    // Verificar UserDailyMetrics para ver quais IDs de loja existem
    try {
      const userMetrics = await db.collection("userdailymetrics").find({}).toArray();
      console.log(`\n📊 Encontrados ${userMetrics.length} UserDailyMetrics:`);

      const lojasSet = new Set();
      for (const metric of userMetrics) {
        lojasSet.add(metric.loja?.toString());
        if (userMetrics.indexOf(metric) < 3) { // Mostrar só os primeiros 3
          console.log(`  - Usuario: ${metric.usuarioNome}, Loja: ${metric.lojaNome} (ID: ${metric.loja})`);
        }
      }

      console.log(`\nIDs de loja únicos encontrados: ${Array.from(lojasSet).join(', ')}`);
    } catch (error) {
      console.log("Erro ao verificar UserDailyMetrics:", error.message);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão fechada");
  }
}

verificarLoja();