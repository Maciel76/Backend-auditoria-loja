// routes/lojas.js
import express from "express";
import Loja from "../models/Loja.js"; // Importar o modelo Loja
const router = express.Router();

// Rota para buscar todas as lojas ativas do banco de dados
router.get("/lojas", async (req, res) => {
  try {
    const lojas = await Loja.find({ ativa: true }).sort({ codigo: 1 });
    res.json(lojas);
  } catch (error) {
    console.error("Erro ao buscar lojas:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor ao buscar lojas." });
  }
});

// Rota para adicionar uma nova loja
router.post("/lojas", async (req, res) => {
  try {
    const { codigo, nome, cidade, endereco, regiao, imagem, metadata } = req.body;

    // Validação básica
    if (!codigo || !nome) {
      return res.status(400).json({ mensagem: "Código e nome da loja são obrigatórios." });
    }

    // Verificar se a loja já existe
    const lojaExistente = await Loja.findOne({ codigo });
    if (lojaExistente) {
      return res.status(409).json({ mensagem: `A loja com o código ${codigo} já existe.` });
    }

    const novaLoja = new Loja({
      codigo,
      nome,
      cidade,
      endereco,
      regiao,
      imagem,
      metadata,
    });

    await novaLoja.save();

    res.status(201).json({ mensagem: "Loja adicionada com sucesso!", loja: novaLoja });
  } catch (error) {
    console.error("Erro ao adicionar nova loja:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor ao adicionar loja." });
  }
});


router.post("/selecionar-loja", (req, res) => {
  const { codigo } = req.body;
  // Esta rota parece usar sessão, o que pode não ser ideal para uma API stateless.
  // Mantendo a lógica original por enquanto, mas pode ser revisada.
  if (req.session) {
    req.session.loja = codigo;
    res.json({ success: true, loja: codigo });
  } else {
    // Fallback para ambientes sem sessão (ex: API pura)
    res.json({ success: true, message: "Seleção de loja recebida, mas a sessão não está ativa.", loja: codigo });
  }
});

export default router;
