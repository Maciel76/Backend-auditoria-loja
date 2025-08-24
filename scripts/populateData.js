// scripts/populateData.js
import mongoose from "mongoose";
import User from "../models/User.js";
import conectarBanco from "../config/db.js";

const populateData = async () => {
  try {
    await conectarBanco();

    // Limpar dados existentes
    await User.deleteMany({});

    // Datas para teste
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const semanaPassada = new Date(hoje);
    semanaPassada.setDate(semanaPassada.getDate() - 7);

    // Dados de exemplo
    const usuarios = [
      {
        id: "001",
        nome: "João Silva",
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        contadorTotal: 356,
        auditorias: [
          {
            data: hoje,
            contador: 45,
            detalhes: Array.from({ length: 45 }, (_, i) => ({
              codigo: `PROD${i + 1000}`,
              produto: `Produto ${i + 1}`,
              local: `Corredor ${Math.floor(i / 10) + 1}`,
              situacao: "Atualizado",
              estoque: Math.floor(Math.random() * 50).toString(),
            })),
          },
          {
            data: ontem,
            contador: 38,
            detalhes: Array.from({ length: 38 }, (_, i) => ({
              codigo: `PROD${i + 2000}`,
              produto: `Produto ${i + 1}`,
              local: `Corredor ${Math.floor(i / 10) + 1}`,
              situacao: "Atualizado",
              estoque: Math.floor(Math.random() * 50).toString(),
            })),
          },
          {
            data: semanaPassada,
            contador: 52,
            detalhes: Array.from({ length: 52 }, (_, i) => ({
              codigo: `PROD${i + 3000}`,
              produto: `Produto ${i + 1}`,
              local: `Corredor ${Math.floor(i / 10) + 1}`,
              situacao: "Atualizado",
              estoque: Math.floor(Math.random() * 50).toString(),
            })),
          },
        ],
      },
      {
        id: "002",
        nome: "Maria Santos",
        foto: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop&crop=face",
        contadorTotal: 403,
        auditorias: [
          {
            data: hoje,
            contador: 62,
            detalhes: Array.from({ length: 62 }, (_, i) => ({
              codigo: `PROD${i + 4000}`,
              produto: `Produto ${i + 1}`,
              local: `Corredor ${Math.floor(i / 10) + 1}`,
              situacao: "Atualizado",
              estoque: Math.floor(Math.random() * 50).toString(),
            })),
          },
          {
            data: ontem,
            contador: 41,
            detalhes: Array.from({ length: 41 }, (_, i) => ({
              codigo: `PROD${i + 5000}`,
              produto: `Produto ${i + 1}`,
              local: `Corredor ${Math.floor(i / 10) + 1}`,
              situacao: "Atualizado",
              estoque: Math.floor(Math.random() * 50).toString(),
            })),
          },
        ],
      },
      {
        id: "003",
        nome: "Pedro Oliveira",
        foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        contadorTotal: 278,
        auditorias: [
          {
            data: hoje,
            contador: 51,
            detalhes: Array.from({ length: 51 }, (_, i) => ({
              codigo: `PROD${i + 6000}`,
              produto: `Produto ${i + 1}`,
              local: `Corredor ${Math.floor(i / 10) + 1}`,
              situacao: "Atualizado",
              estoque: Math.floor(Math.random() * 50).toString(),
            })),
          },
        ],
      },
    ];

    await User.insertMany(usuarios);
    console.log("✅ Dados de teste populados com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao popular dados:", error);
    process.exit(1);
  }
};

populateData();
