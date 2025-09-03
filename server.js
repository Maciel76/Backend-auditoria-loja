import express from "express";
import conectarBanco from "./config/db.js";
import uploadRouter from "./routes/upload.js";
import relatoriosRouter from "./routes/relatorios.js";
import rankingRouter from "./routes/ranking.js"; // Para etiqueta
import rankingPresencaRouter from "./routes/rankingPresenca.js"; // Para presença
import rankingRupturaRouter from "./routes/rankingRuptura.js"; // Para ruptura
import setoresRouter from "./routes/setores.js";
import relatoriosAvancadosRouter from "./routes/relatorios-avancados.js";
import estatiscas from "./routes/estatisticas.js";
import { sincronizarSetoresParaAuditoria } from "./services/processador-auditoria.js";
import uploadRupturaRouter from "./routes/upload-ruptura.js";
import uploadPresencaRouter from "./routes/upload-presenca.js";
import "./utils/planilhaHelpers.js";

const app = express();

// Conectar ao MongoDB
conectarBanco();

// Middleware
app.use(express.json());
app.use(express.static("uploads"));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Rotas
app.use("/", uploadRouter);
app.use("/relatorios", relatoriosRouter); // Adicione esta linha
app.use("/", setoresRouter); // Adicione esta linha
app.use("/", estatiscas); // Adicione esta linha
app.use("/", uploadRupturaRouter);
app.use("/", uploadPresencaRouter);
app.use("/", rankingRouter); // Já existe - para etiqueta
app.use("/", rankingPresencaRouter); // Nova - para presença
app.use("/", rankingRupturaRouter); // Nova - para ruptura

// NOVAS ROTAS AVANÇADAS (adicionar no final)
app.use("/api/avancado", relatoriosAvancadosRouter); // NOVA LINHA

// NOVA ROTA PARA SINCRONIZAÇÃO MANUAL
app.get("/api/sincronizar-auditoria", async (req, res) => {
  try {
    const resultado = await sincronizarSetoresParaAuditoria();
    if (resultado.success) {
      res.json({
        mensagem: "Sincronização concluída",
        totalSetores: resultado.totalSetores,
      });
    } else {
      res
        .status(500)
        .json({ erro: "Falha na sincronização", detalhes: resultado.error });
    }
  } catch (error) {
    res
      .status(500)
      .json({ erro: "Erro na sincronização", detalhes: error.message });
  }
});

// Start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
