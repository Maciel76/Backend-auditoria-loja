import express from "express";
import cors from "cors";
import conectarBanco from "./config/db.js";
import uploadRouter from "./routes/upload.js";
import relatoriosRouter from "./routes/relatorios.js";
import rankingRouter from "./routes/ranking.js";
import rankingPresencaRouter from "./routes/rankingPresenca.js";
import rankingRupturaRouter from "./routes/rankingRuptura.js";
import setoresRouter from "./routes/setores.js";
import relatoriosAvancadosRouter from "./routes/relatorios-avancados.js";
import estatiscas from "./routes/estatisticas.js";
import lojaRouter from "./routes/lojas.js";
import metricasRouter from "./routes/metricas.js";
import debugMetricasRouter from "./routes/debug-metricas.js";
import endpointsListRouter from "./routes/endpoints-list.js";
import sugestoesRouter from "./routes/sugestoes.js";
import avisosRouter from "./routes/avisos.js";
import votacoesRouter from "./routes/votacoes.js";
import articlesRouter from "./routes/articles.js";
import achievementsRouter from "./routes/achievements.js";
import conquistasRoutes from "./routes/conquistasRoutes.js";
import metricasUsuariosRoutes from "./routes/metricasUsuarios.js";
import metricasLojasRoutes from "./routes/metricasLojas.js";
import lojaDailyMetricsRoutes from "./routes/lojaDailyMetrics.js";
import performanceMapRoutes from "./routes/performanceMap.js";
import perfilLojaRoutes from "./routes/perfilLoja.js";
import auditProductsRouter from "./routes/auditProducts.js";
import storesRouter from "./routes/stores.js";
import usuariosRouter from "./routes/usuarios.js";
import "./utils/planilhaHelpers.js";

const app = express();

// Conectar ao MongoDB
conectarBanco();

// Middleware ANTES das rotas
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "x-loja"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));

// Servir arquivos estáticos do frontend (incluindo imagens das lojas)
app.use(express.static("../frontend/public"));

// Middleware global de CORS como fallback
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-loja");
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rota simples para testar
app.get("/test", (req, res) => {
  res.json({
    message: "Servidor funcionando",
    loja: req.headers["x-loja"] || "não especificada",
  });
});

// Suas rotas originais (ATENÇÃO: uma delas pode ter problema)
try {
  app.use("/", lojaRouter);
  console.log("✅ Rotas de loja carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de loja:", error.message);
}

try {
  app.use("/", uploadRouter);
  console.log("✅ Rotas de upload carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de upload:", error.message);
}

try {
  app.use("/relatorios", relatoriosRouter);
  console.log("✅ Rotas de relatórios carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de relatórios:", error.message);
}

try {
  app.use("/", setoresRouter);
  console.log("✅ Rotas de setores carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de setores:", error.message);
}

try {
  app.use("/", estatiscas);
  console.log("✅ Rotas de estatísticas carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de estatísticas:", error.message);
}

try {
  app.use("/", rankingRouter);
  console.log("✅ Rotas de ranking carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de ranking:", error.message);
}

try {
  app.use("/", rankingPresencaRouter);
  console.log("✅ Rotas de ranking presença carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de ranking presença:", error.message);
}

try {
  app.use("/", rankingRupturaRouter);
  console.log("✅ Rotas de ranking ruptura carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de ranking ruptura:", error.message);
}

try {
  app.use("/api/avancado", relatoriosAvancadosRouter);
  console.log("✅ Rotas avançadas carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas avançadas:", error.message);
}

try {
  app.use("/api/metricas", metricasRouter);
  console.log("✅ Rotas de métricas carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de métricas:", error.message);
}

try {
  app.use("/api/debug", debugMetricasRouter);
  console.log("✅ Rotas de debug carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de debug:", error.message);
}

try {
  app.use("/api/endpoints", endpointsListRouter);
  console.log("✅ Lista de endpoints carregada");
} catch (error) {
  console.log("❌ Erro na lista de endpoints:", error.message);
}

try {
  app.use("/", sugestoesRouter);
  console.log("✅ Rotas de sugestões carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de sugestões:", error.message);
}

try {
  app.use("/", avisosRouter);
  console.log("✅ Rotas de avisos carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de avisos:", error.message);
}

try {
  app.use("/", votacoesRouter);
  console.log("✅ Rotas de votações carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de votações:", error.message);
}

try {
  app.use("/", articlesRouter);
  console.log("✅ Rotas de artigos carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de artigos:", error.message);
}

// ⚠️ ADICIONAR APENAS ESTA LINHA (não modificar nada mais!)
try {
  app.use("/api/achievements", achievementsRouter);
  console.log("✅ Rotas de achievements carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de achievements:", error.message);
}

// Adicionando rotas para /api/conquistas também
try {
  app.use("/api/conquistas", conquistasRoutes);
  console.log("✅ Rotas de conquistas (pt-br) carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de conquistas (pt-br):", error.message);
}

try {
  app.use("/", metricasUsuariosRoutes);
  console.log("✅ Rotas de métricas de usuários carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de métricas de usuários:", error.message);
}

try {
  app.use("/", metricasLojasRoutes);
  console.log("✅ Rotas de métricas de lojas carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de métricas de lojas:", error.message);
}
app.use("/api/loja-daily-metrics", lojaDailyMetricsRoutes);
app.use("/api/perfil-loja", perfilLojaRoutes);
app.use("/api/performance-map", performanceMapRoutes);
app.use("/api/audit-products", auditProductsRouter);
app.use("/api/stores", storesRouter);
app.use("/api/usuarios", usuariosRouter);


// Rota de sincronização removida - agora usa modelos unificados

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR DE AUDITORIAS COM MÉTRICAS RODANDO`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`\n📋 ENDPOINTS PRINCIPAIS:`);
  console.log(`   🧪 Teste básico: http://localhost:${PORT}/test`);
  console.log(
    `   📊 Lista completa de endpoints: http://localhost:${PORT}/api/endpoints`
  );
  console.log(
    `   🔍 Verificar métricas: http://localhost:${PORT}/api/debug/verificar-metricas (header x-loja necessário)`
  );
  console.log(
    `   📈 Dashboard executivo: http://localhost:${PORT}/api/metricas/dashboard`
  );
  console.log(`\n💡 COMO TESTAR O SISTEMA DE MÉTRICAS:`);
  console.log(
    `   0. Testar serviço: http://localhost:${PORT}/api/debug/testar-servico`
  );
  console.log(`   1. Faça upload: POST /upload com header 'x-loja: 001'`);
  console.log(
    `   2. Verifique métricas: http://localhost:${PORT}/api/debug/verificar-metricas (header x-loja: 001)`
  );
  console.log(
    `   3. Veja dashboard: http://localhost:${PORT}/api/metricas/dashboard`
  );
  console.log(`\n🔧 ENDPOINTS DE DEBUG:`);
  console.log(
    `   🧪 Testar serviço: http://localhost:${PORT}/api/debug/testar-servico`
  );
  console.log(
    `   🔍 Verificar métricas: http://localhost:${PORT}/api/debug/verificar-metricas`
  );
  console.log(
    `   🔄 Calcular agora: POST http://localhost:${PORT}/api/debug/calcular-agora`
  );
  console.log(
    `   🔌 Testar conexões: http://localhost:${PORT}/api/debug/testar-conexoes`
  );
  console.log(
    `\n📚 Documentação completa: http://localhost:${PORT}/api/endpoints\n`
  );
});
