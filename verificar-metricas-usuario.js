// Script para verificar MetricasUsuario no MongoDB
import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/auditorias";

async function verificarMetricasUsuario() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    const db = mongoose.connection.db;

    // Verificar coleção MetricasUsuario
    try {
      const metricas = await db.collection("metricasusuarios").find({}).limit(5).toArray();
      console.log(`📊 Encontrados registros MetricasUsuario:`);

      metricas.forEach((metric, index) => {
        console.log(`\n--- Registro ${index + 1} ---`);
        console.log(`Usuario: ${metric.usuarioNome} (${metric.usuarioId})`);
        console.log(`Loja: ${metric.loja}`);
        console.log(`Período: ${metric.periodo}`);

        // Verificar se tem campos legados
        const hasLegacyFields = !!(metric.contadorClasses ||
                                   metric.contadorLocais ||
                                   metric.contadoresAuditorias ||
                                   metric.ranking ||
                                   metric.tendencias);

        console.log(`Tem campos legados: ${hasLegacyFields}`);

        if (hasLegacyFields) {
          console.log("Campos legados encontrados:");
          if (metric.contadorClasses) console.log("  - contadorClasses (root)");
          if (metric.contadorLocais) console.log("  - contadorLocais (root)");
          if (metric.contadoresAuditorias) console.log("  - contadoresAuditorias");
          if (metric.ranking) console.log("  - ranking");
          if (metric.tendencias) console.log("  - tendencias");
        }

        console.log(`Data: ${metric.dataInicio} - ${metric.dataFim}`);
        console.log(`Última atualização: ${metric.ultimaAtualizacao}`);
      });

      // Verificar o total
      const total = await db.collection("metricasusuarios").countDocuments({});
      console.log(`\n📈 Total de registros MetricasUsuario: ${total}`);

    } catch (error) {
      console.log("Erro ao verificar MetricasUsuario:", error.message);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão fechada");
  }
}

verificarMetricasUsuario();