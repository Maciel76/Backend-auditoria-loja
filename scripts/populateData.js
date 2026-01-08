// scripts/populateData.js - Script para popular dados de teste com modelos unificados
import mongoose from "mongoose";
import Loja from "../models/Loja.js";
import User from "../models/User.js";
import Auditoria from "../models/Auditoria.js";
import Planilha from "../models/Planilha.js";

// Configura��o do banco de dados
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

// Dados de exemplo para lojas
const lojasData = [
  {
    codigo: "001",
    nome: "Loja Centro",
    cidade: "S�o Paulo",
    endereco: "Rua das Flores, 123",
    regiao: "Centro",
    imagem: "/images/lojas/loja-001.jpg",
    ativa: true,
    metadata: {
      telefone: "(11) 1234-5678",
      email: "centro@empresa.com",
      gerente: "Jo�o Silva",
    },
  },
  {
    codigo: "002",
    nome: "Loja Shopping",
    cidade: "S�o Paulo",
    endereco: "Shopping Center, Loja 45",
    regiao: "Zona Sul",
    imagem: "/images/lojas/loja-002.jpg",
    ativa: true,
    metadata: {
      telefone: "(11) 2345-6789",
      email: "shopping@empresa.com",
      gerente: "Maria Santos",
    },
  },
  {
    codigo: "003",
    nome: "Loja Bairro",
    cidade: "Rio de Janeiro",
    endereco: "Av. Principal, 456",
    regiao: "Zona Norte",
    imagem: "/images/lojas/loja-003.jpg",
    ativa: true,
    metadata: {
      telefone: "(21) 3456-7890",
      email: "bairro@empresa.com",
      gerente: "Carlos Oliveira",
    },
  },
];

// Dados de exemplo para usu�rios
const usuariosData = [
  {
    id: "123456",
    nome: "Ana Silva",
    email: "ana.silva@empresa.com",
    telefone: "(11) 9876-5432",
    cargo: "Auditor",
    foto: "/images/usuarios/ana.jpg",
  },
  {
    id: "789012",
    nome: "Pedro Santos",
    email: "pedro.santos@empresa.com",
    telefone: "(11) 8765-4321",
    cargo: "Supervisor",
    foto: "/images/usuarios/pedro.jpg",
  },
  {
    id: "345678",
    nome: "Maria Costa",
    email: "maria.costa@empresa.com",
    telefone: "(21) 7654-3210",
    cargo: "Auditor",
    foto: "/images/usuarios/maria.jpg",
  },
];

// Dados de exemplo para auditorias
const gerarAuditorias = (lojas, usuarios) => {
  const auditorias = [];
  const tipos = ["etiqueta", "presenca", "ruptura"];
  const situacoes = ["N�o lido", "Atualizado", "Pendente"];
  const locais = ["Setor A", "Setor B", "Setor C", "Estoque", "G�ndola"];
  const produtos = [
    "Produto A",
    "Produto B",
    "Produto C",
    "Shampoo Dove",
    "Sabonete Protex",
    "Detergente Yp�"
  ];

  for (let i = 0; i < 50; i++) {
    const loja = lojas[Math.floor(Math.random() * lojas.length)];
    const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];

    const auditoria = {
      loja: loja._id,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      tipo: tipo,
      data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // �ltimos 30 dias
      codigo: `COD${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      produto: produtos[Math.floor(Math.random() * produtos.length)],
      local: locais[Math.floor(Math.random() * locais.length)],
      situacao: situacoes[Math.floor(Math.random() * situacoes.length)],
      estoque: String(Math.floor(Math.random() * 100)),
      contador: Math.floor(Math.random() * 10),
    };

    // Adicionar campos espec�ficos por tipo
    if (tipo === "etiqueta") {
      auditoria.ultimaCompra = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR");
    } else if (tipo === "presenca") {
      auditoria.presenca = Math.random() > 0.5;
      auditoria.presencaConfirmada = auditoria.presenca ? "Sim" : "N�o";
      auditoria.auditadoEm = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      auditoria.classeProdutoRaiz = "Higiene e Beleza";
      auditoria.classeProduto = "Cabelos";
      auditoria.setor = auditoria.local;
    } else if (tipo === "ruptura") {
      auditoria.classeProdutoRaiz = "Limpeza";
      auditoria.classeProduto = "Detergentes";
      auditoria.setor = auditoria.local;
      auditoria.situacaoAuditoria = "Em an�lise";
      auditoria.estoqueAtual = String(Math.floor(Math.random() * 50));
      auditoria.estoqueLeitura = String(Math.floor(Math.random() * 50));
      auditoria.residuo = "0";
      auditoria.fornecedor = "Fornecedor ABC";
      auditoria.diasSemVenda = Math.floor(Math.random() * 30);
      auditoria.custoRuptura = Math.random() * 100;
    }

    auditorias.push(auditoria);
  }

  return auditorias;
};

// Fun��o principal
async function populateData() {
  try {
    console.log("= Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log(" Conectado ao MongoDB");

    // Limpar dados existentes
    console.log(">� Limpando dados existentes...");
    await Promise.all([
      Loja.deleteMany({}),
      User.deleteMany({}),
      Auditoria.deleteMany({}),
      Planilha.deleteMany({}),
    ]);
    console.log(" Dados antigos removidos");

    // Criar lojas
    console.log("<� Criando lojas...");
    const lojas = await Loja.insertMany(lojasData);
    console.log(` ${lojas.length} lojas criadas`);

    // Criar usu�rios para cada loja
    console.log("=e Criando usu�rios...");
    const usuarios = [];
    for (const loja of lojas) {
      for (const userData of usuariosData) {
        const usuario = new User({
          ...userData,
          loja: loja._id,
          contadorTotal: Math.floor(Math.random() * 50),
          auditorias: [{
            data: new Date(),
            contador: Math.floor(Math.random() * 10),
            detalhes: [{
              codigo: `COD${Math.floor(Math.random() * 1000)}`,
              produto: "Produto Teste",
              local: "Setor A",
              situacao: "Atualizado",
              estoque: "10",
              tipoAuditoria: "etiqueta",
              loja: loja._id,
            }]
          }]
        });
        usuarios.push(usuario);
      }
    }
    await User.insertMany(usuarios);
    console.log(` ${usuarios.length} usu�rios criados`);

    // Criar auditorias
    console.log("=� Criando auditorias...");
    const auditorias = gerarAuditorias(lojas, usuariosData);
    await Auditoria.insertMany(auditorias);
    console.log(` ${auditorias.length} auditorias criadas`);

    // Criar planilhas de exemplo
    console.log("=� Criando planilhas...");
    const planilhas = [];
    const tipos = ["etiqueta", "presenca", "ruptura"];

    for (const loja of lojas) {
      for (const tipo of tipos) {
        const planilha = {
          loja: loja._id,
          nomeArquivo: `planilha_${tipo}_${loja.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`,
          tipoAuditoria: tipo,
          dataUpload: new Date(),
          dataAuditoria: new Date(),
          totalItens: Math.floor(Math.random() * 100) + 10,
          totalItensLidos: Math.floor(Math.random() * 50),
          usuariosEnvolvidos: usuariosData.map(u => `${u.id} (${u.nome})`),
          metadata: {
            tamanhoArquivo: Math.floor(Math.random() * 1000000) + 50000,
            formato: "xlsx",
            totalLinhas: Math.floor(Math.random() * 100) + 10,
            processamentoCompleto: true,
            tempoProcessamento: Math.floor(Math.random() * 5000) + 1000,
            erros: [],
          },
        };
        planilhas.push(planilha);
      }
    }
    await Planilha.insertMany(planilhas);
    console.log(` ${planilhas.length} planilhas criadas`);

    // Relat�rio final
    console.log("\n=� Relat�rio Final:");
    console.log(`<� Lojas: ${lojas.length}`);
    console.log(`=e Usu�rios: ${usuarios.length}`);
    console.log(`=� Auditorias: ${auditorias.length}`);
    console.log(`=� Planilhas: ${planilhas.length}`);

    console.log("\n<� Dados populados com sucesso!");
    console.log("\n=� Para testar:");
    console.log("1. Acesse o sistema e selecione uma loja (001, 002 ou 003)");
    console.log("2. Fa�a upload de uma planilha de teste");
    console.log("3. Verifique os rankings e relat�rios");

  } catch (error) {
    console.error("L Erro ao popular dados:", error);
  } finally {
    await mongoose.disconnect();
    console.log("= Desconectado do MongoDB");
    process.exit(0);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  populateData();
}

export default populateData;