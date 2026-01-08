// scripts/popular-lojas-do-store.js - Script para adicionar todas as lojas do store ao banco
import mongoose from "mongoose";
import Loja from "../models/Loja.js";

// Configuração do banco de dados
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

// Dados das lojas baseadas no lojaStore.js
const lojasDoStore = [
  {
    codigo: "056",
    nome: "Loja 056 - Goiania Burits",
    cidade: "Goiânia",
    imagem: "/images/lojas/056.jpg",
  },
  {
    codigo: "084",
    nome: "Loja 084 - Goiania Independência",
    cidade: "Goiânia",
    imagem: "/images/lojas/084.jpg",
  },
  {
    codigo: "105",
    nome: "Loja 105 - T9",
    cidade: "Goiânia",
    imagem: "/images/lojas/105.jpg",
  },
  {
    codigo: "111",
    nome: "Loja 111 - Rio Verde",
    cidade: "Rio Verde",
    imagem: "/images/lojas/111.jpg",
  },
  {
    codigo: "140",
    nome: "Loja 140 - Perimetral",
    cidade: "Goiânia",
    imagem: "/images/lojas/140.jpg",
  },
  {
    codigo: "214",
    nome: "Loja 214 - Caldas Novas",
    cidade: "Caldas Novas",
    imagem: "/images/lojas/214.jpg",
  },
  {
    codigo: "176",
    nome: "Loja 176 - Palmas Teotônio",
    cidade: "Palmas",
    imagem: "/images/lojas/176.jpg",
  },
  {
    codigo: "194",
    nome: "Loja 194 - Anápolis",
    cidade: "Anápolis",
    imagem: "/images/lojas/194.jpg",
  },
  {
    codigo: "310",
    nome: "Loja 310 - Portugal",
    cidade: "Goiânia",
    imagem: "/images/lojas/310.jpg",
  },
  {
    codigo: "320",
    nome: "Loja 320 - Palmas cesamar",
    cidade: "Palmas",
    imagem: "/images/lojas/320.jpg",
  },
  {
    codigo: "347",
    nome: "Loja 347 - Araguaina",
    cidade: "Araguaina",
    imagem: "/images/lojas/347.jpeg",
  },
];

async function popularLojas() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    let adicionadas = 0;
    let existentes = 0;

    for (const lojaData of lojasDoStore) {
      // Verificar se a loja já existe
      const lojaExistente = await Loja.findOne({ codigo: lojaData.codigo });

      if (lojaExistente) {
        console.log(`⚠️ Loja ${lojaData.codigo} já existe`);
        existentes++;
        continue;
      }

      // Criar nova loja
      const novaLoja = new Loja({
        ...lojaData,
        endereco: `Endereço da ${lojaData.nome}`, // Placeholder
        regiao: lojaData.cidade, // Usar cidade como região
        ativa: true,
        metadata: {
          telefone: "(62) 99999-9999", // Placeholder
          email: `contato@loja${lojaData.codigo}.com`,
          gerente: "Nome do Gerente", // Placeholder
        },
      });

      await novaLoja.save();
      console.log(`✅ Loja ${lojaData.codigo} adicionada`);
      adicionadas++;
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   Adicionadas: ${adicionadas}`);
    console.log(`   Já existiam: ${existentes}`);
  } catch (error) {
    console.error("❌ Erro ao popular lojas:", error);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log("🔌 Conexão fechada");
  }
}

// Executar o script
popularLojas();
