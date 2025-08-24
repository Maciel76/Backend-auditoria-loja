import express from "express";
import conectarBanco from "./config/db.js";
import uploadRouter from "./routes/upload.js";
import relatoriosRouter from "./routes/relatorios.js"; // Adicione esta linha

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

// Start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
