import express from "express";
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
import uploadRupturaRouter from "./routes/upload-ruptura.js";
import uploadPresencaRouter from "./routes/upload-presenca.js";
import "./utils/planilhaHelpers.js";

const app = express();

// Conectar ao MongoDB
conectarBanco();

// Middleware ANTES das rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-loja"
  );
  next();
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
  app.use("/", uploadRupturaRouter);
  console.log("✅ Rotas de upload ruptura carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de upload ruptura:", error.message);
}

try {
  app.use("/", uploadPresencaRouter);
  console.log("✅ Rotas de upload presença carregadas");
} catch (error) {
  console.log("❌ Erro nas rotas de upload presença:", error.message);
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

// Rota de sincronização removida - agora usa modelos unificados

// Start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🧪 Teste: http://localhost:${PORT}/test`);
});
