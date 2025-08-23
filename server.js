import express from "express";
import cors from "cors";
import conectarBanco from "./config/db.js";
import uploadRouter from "./routes/upload.js";
import relatoriosRouter from "./routes/relatorios.js";

const app = express();

// Conectar ao MongoDB
conectarBanco();

// Middleware
app.use(express.json());
app.use(cors()); // Adicione esta linha

// Rotas
app.use("/", uploadRouter);
app.use("/relatorios", relatoriosRouter);

// Start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
