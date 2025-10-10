// Script para verificar collections no MongoDB
import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/auditorias";

async function verificarCollections() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Listar todas as collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log("📋 Collections encontradas:");
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documentos`);
    }

    // Verificar especificamente UserDailyMetrics
    const userDailyCollections = collections.filter(c =>
      c.name.toLowerCase().includes('user') ||
      c.name.toLowerCase().includes('daily') ||
      c.name.toLowerCase().includes('metric')
    );

    console.log("\n🎯 Collections relacionadas a UserDailyMetrics:");
    for (const collection of userDailyCollections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documentos`);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão fechada");
  }
}

verificarCollections();