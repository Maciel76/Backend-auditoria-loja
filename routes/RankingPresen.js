// routes/ranking.js ou similar
import express from "express";
import UserAudit from "../models/UserAudit.js";

const router = express.Router();

// Nova rota para buscar ranking da coleção UserAudit
router.get("/ranking-useraudit", async (req, res) => {
  try {
    const { tipo, periodo } = req.query;
    
    // Construir query baseada nos filtros
    let query = {};
    
    // Aqui você pode adicionar lógica de filtro por tipo e período
    // se necessário, baseado na estrutura do UserAudit
    
    const usuarios = await UserAudit.find(query)
      .select("userId nome contadorTotal auditorias")
      .lean();
    
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;