// routes/ranking.js ou similar
import express from "express";
import User from "../models/User.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

// Nova rota para buscar ranking da coleção User
router.get("/ranking-useraudit", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { tipo, periodo } = req.query;

    // Construir query baseada nos filtros
    let query = { loja: req.loja._id };

    // Aqui você pode adicionar lógica de filtro por tipo e período
    // se necessário, baseado na estrutura do User

    const usuarios = await User.find(query)
      .select("id nome contadorTotal auditorias")
      .lean();
    
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;