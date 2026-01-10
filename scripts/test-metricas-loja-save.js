// Script para testar salvamento do MetricasLoja
import mongoose from "mongoose";
import dotenv from "dotenv";
import MetricasLoja from "../models/MetricasLoja.js";
import Loja from "../models/Loja.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

async function testSave() {
  try {
    console.log("🔌 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado");

    // Buscar primeira loja ativa
    const loja = await Loja.findOne({ ativa: true });
    if (!loja) {
      console.log("❌ Nenhuma loja ativa encontrada");
      return;
    }

    console.log(`\n📍 Testando com loja: ${loja.nome} (${loja.codigo})`);

    // Tentar buscar métricas existentes
    let metricas = await MetricasLoja.findOne({ loja: loja._id });

    if (metricas) {
      console.log(`✅ Métricas existentes encontradas: ${metricas._id}`);
      console.log(`   - dataInicio: ${metricas.dataInicio}`);
      console.log(`   - dataFim: ${metricas.dataFim}`);
      console.log(`   - periodo: ${metricas.periodo}`);

      // Atualizar
      console.log(`\n🔄 Atualizando métricas...`);
      metricas.dataFim = new Date();
      metricas.totais.planilhasProcessadas =
        (metricas.totais.planilhasProcessadas || 0) + 1;
    } else {
      console.log(`📝 Criando novas métricas...`);
      metricas = new MetricasLoja({
        loja: loja._id,
        lojaNome: loja.nome,
        periodo: "periodo_completo",
        dataInicio: new Date("2020-01-01"),
        dataFim: new Date(),
        versaoCalculo: "2.0",
      });
    }

    // Atualizar totais
    metricas.atualizarTotais();
    metricas.detectarAlertas();

    console.log(`\n💾 Tentando salvar...`);
    const salvo = await metricas.save();
    console.log(`✅ SUCESSO! Métricas salvas com ID: ${salvo._id}`);

    // Verificar se realmente salvou
    const verificar = await MetricasLoja.findById(salvo._id);
    console.log(`\n✅ Verificação: Registro encontrado no banco`);
    console.log(`   - _id: ${verificar._id}`);
    console.log(`   - lojaNome: ${verificar.lojaNome}`);
    console.log(`   - periodo: ${verificar.periodo}`);
    console.log(`   - dataInicio: ${verificar.dataInicio}`);
    console.log(`   - dataFim: ${verificar.dataFim}`);
    console.log(
      `   - totais.planilhasProcessadas: ${verificar.totais.planilhasProcessadas}`
    );
  } catch (error) {
    console.error("\n❌ ERRO:", error.message);
    console.error("📋 Detalhes:", {
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
    });
    if (error.errors) {
      console.error("📋 Erros de validação:");
      Object.keys(error.errors).forEach((key) => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado");
  }
}

testSave()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script falhou:", error);
    process.exit(1);
  });
