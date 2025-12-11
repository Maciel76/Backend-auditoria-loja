// routes/rankingPresenca.js
import express from "express";
import User from "../models/User.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

router.get("/api/ranking-presenca", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { tipo, periodo } = req.query;

    // Buscar todos os usuários da loja selecionada
    const usuarios = await User.find({ loja: req.loja._id });

    // Calcular contador para cada usuário baseado no período e tipo
    const ranking = usuarios
      .map((usuario) => {
        let contador = 0;

        // Não temos mais histórico por data no modelo de usuário
        // Usaremos o contadorTotal como proxy para todos os períodos
        contador = usuario.contadorTotal;

        return {
          id: usuario.id,
          nome: usuario.nome,
          foto: usuario.foto,
          contador: contador,
          loja: req.loja.codigo,
        };
      })
      .filter((user) => user.contador > 0)
      .sort((a, b) => b.contador - a.contador);

    res.json(ranking);
  } catch (error) {
    console.error("Erro ao buscar ranking de presença:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
