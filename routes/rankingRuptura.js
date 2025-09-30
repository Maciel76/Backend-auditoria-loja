// routes/rankingRuptura.js
import express from "express";
import User from "../models/User.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

router.get("/api/ranking-ruptura", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { tipo, periodo } = req.query;

    // Buscar todos os usuários da loja selecionada
    const usuarios = await User.find({ loja: req.loja._id });

    // Calcular contador para cada usuário baseado no período
    const ranking = usuarios
      .map((usuario) => {
        let contador = 0;

        if (periodo === "hoje") {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const amanha = new Date(hoje);
          amanha.setDate(amanha.getDate() + 1);

          contador = usuario.auditorias
            .filter(
              (auditoria) => auditoria.data >= hoje && auditoria.data < amanha
            )
            .reduce((total, auditoria) => total + auditoria.contador, 0);
        } else if (periodo === "semana") {
          const hoje = new Date();
          const inicioSemana = new Date(hoje);
          inicioSemana.setDate(hoje.getDate() - hoje.getDay());
          inicioSemana.setHours(0, 0, 0, 0);

          contador = usuario.auditorias
            .filter((auditoria) => auditoria.data >= inicioSemana)
            .reduce((total, auditoria) => total + auditoria.contador, 0);
        } else if (periodo === "mes") {
          const hoje = new Date();
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

          contador = usuario.auditorias
            .filter((auditoria) => auditoria.data >= inicioMes)
            .reduce((total, auditoria) => total + auditoria.contador, 0);
        } else {
          // Todos os períodos - usar contadorTotal
          contador = usuario.contadorTotal;
        }

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
    console.error("Erro ao buscar ranking de ruptura:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
