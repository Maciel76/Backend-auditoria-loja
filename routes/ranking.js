// routes/ranking.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/api/ranking", async (req, res) => {
  try {
    const { tipo, periodo } = req.query;

    // Buscar todos os usuários
    const usuarios = await User.find({});

    // Calcular contador para cada usuário baseado no período
    const ranking = usuarios
      .map((usuario) => {
        let contador = 0;

        if (periodo === "hoje") {
          const hoje = new Date();
          // Não temos mais histórico por data, usar contadorTotal
          contador = usuario.contadorTotal;
        } else if (periodo === "semana") {
          // Não temos mais histórico por data, usar contadorTotal
          contador = usuario.contadorTotal;
        } else if (periodo === "mes") {
          // Não temos mais histórico por data, usar contadorTotal
          contador = usuario.contadorTotal;
        } else {
          // Todos os períodos - usar contadorTotal
          contador = usuario.contadorTotal;
        }

        return {
          id: usuario.id,
          nome: usuario.nome,
          foto: usuario.foto,
          contador: contador,
        };
      })
      .filter((user) => user.contador > 0)
      .sort((a, b) => b.contador - a.contador);

    res.json(ranking);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
