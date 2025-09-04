// routes/rankingPresenca.js
import express from "express";
import UserAudit from "../models/UserAudit.js";

const router = express.Router();

router.get("/api/ranking-presenca", async (req, res) => {
  try {
    const { tipo, periodo } = req.query;

    // Buscar todos os usuários do modelo UserAudit
    const usuarios = await UserAudit.find({});

    // Calcular contador para cada usuário baseado no período e tipo
    const ranking = usuarios
      .map((usuario) => {
        let contador = 0;

        // Filtrar auditorias por período
        let auditoriasFiltradas = usuario.auditorias;

        // Aplicar filtro de período
        if (periodo === "hoje") {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const amanha = new Date(hoje);
          amanha.setDate(amanha.getDate() + 1);

          auditoriasFiltradas = auditoriasFiltradas.filter(
            (auditoria) => auditoria.data >= hoje && auditoria.data < amanha
          );
        } else if (periodo === "semana") {
          const hoje = new Date();
          const inicioSemana = new Date(hoje);
          inicioSemana.setDate(hoje.getDate() - hoje.getDay());
          inicioSemana.setHours(0, 0, 0, 0);

          auditoriasFiltradas = auditoriasFiltradas.filter(
            (auditoria) => auditoria.data >= inicioSemana
          );
        } else if (periodo === "mes") {
          const hoje = new Date();
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

          auditoriasFiltradas = auditoriasFiltradas.filter(
            (auditoria) => auditoria.data >= inicioMes
          );
        }

        // Calcular contador considerando o tipo de auditoria
        contador = auditoriasFiltradas.reduce((total, auditoria) => {
          // Se não há filtro de tipo ou é "todos", contar tudo
          if (!tipo || tipo === "todos") {
            return total + auditoria.contador;
          }

          // Filtrar por tipo de auditoria nos detalhes
          const detalhesFiltrados = auditoria.detalhes.filter(
            (detalhe) => detalhe.tipoAuditoria === tipo
          );

          // Contar apenas os itens com situação "Atualizado" do tipo especificado
          const contadorTipo = detalhesFiltrados.filter(
            (detalhe) => detalhe.situacao === "Atualizado"
          ).length;

          return total + contadorTipo;
        }, 0);

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
    console.error("Erro ao buscar ranking de presença:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
