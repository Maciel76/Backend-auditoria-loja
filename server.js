import express from "express";
import cors from "cors";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do upload
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Aceitar apenas planilhas
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.match(/\.(xlsx|xls|csv)$/)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de planilha são permitidos!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Rota de teste
app.get("/", (req, res) => {
  res.send("API de Auditoria funcionando 🚀");
});

// Rota para upload da planilha
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      erro: "Nenhum arquivo enviado",
      detalhes: "Selecione um arquivo de planilha válido",
    });
  }

  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({
        erro: "Erro no processamento do arquivo",
        detalhes: "Arquivo temporário não encontrado",
      });
    }

    // Ler planilha
    const workbook = xlsx.readFile(req.file.path);

    if (workbook.SheetNames.length === 0) {
      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        erro: "Planilha vazia",
        detalhes: "A planilha não contém abas",
      });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet || Object.keys(worksheet).length === 0) {
      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        erro: "Planilha vazia",
        detalhes: "A primeira aba da planilha está vazia",
      });
    }

    const data = xlsx.utils.sheet_to_json(worksheet);

    // Limpar arquivo temporário
    fs.unlinkSync(req.file.path);

    if (data.length === 0) {
      return res.status(400).json({
        erro: "Nenhum dado encontrado",
        detalhes: "A planilha não contém dados",
      });
    }

    // Devolver os dados com uma mensagem
    res.json({
      mensagem: "Planilha processada com sucesso!",
      dados: data,
      totalRegistros: data.length,
    });
  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Erro no processamento:", error);
    res.status(500).json({
      erro: "Falha ao processar a planilha",
      detalhes: error.message,
    });
  }
});

// Middleware para tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        erro: "Arquivo muito grande",
        detalhes: "O tamanho do arquivo não pode exceder 5MB",
      });
    }
  }

  res.status(500).json({
    erro: "Erro interno do servidor",
    detalhes: error.message,
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000 🚀 http://localhost:3000");
});
