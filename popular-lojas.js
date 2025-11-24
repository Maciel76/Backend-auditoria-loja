// popular-lojas.js - Script para popular o banco de dados com as lojas
import mongoose from 'mongoose';
import Loja from './models/Loja.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/auditoria';

const lojas = [
  {
    codigo: '056',
    nome: 'Loja 056 - Goiania Burits',
    cidade: 'Goiânia',
    endereco: 'Buriti Shopping',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/056.jpg',
    ativa: true
  },
  {
    codigo: '084',
    nome: 'Loja 084 - Goiania Independência',
    cidade: 'Goiânia',
    endereco: 'Av. Independência',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/084.jpg',
    ativa: true
  },
  {
    codigo: '105',
    nome: 'Loja 105 - T9',
    cidade: 'Goiânia',
    endereco: 'Setor T-9',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/105.jpg',
    ativa: true
  },
  {
    codigo: '111',
    nome: 'Loja 111 - Rio Verde',
    cidade: 'Rio Verde',
    endereco: 'Centro',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/111.jpg',
    ativa: true
  },
  {
    codigo: '140',
    nome: 'Loja 140 - Perimetral',
    cidade: 'Goiânia',
    endereco: 'Av. Perimetral',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/140.jpg',
    ativa: true
  },
  {
    codigo: '214',
    nome: 'Loja 214 - Caldas Novas',
    cidade: 'Caldas Novas',
    endereco: 'Centro',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/214.jpg',
    ativa: true
  },
  {
    codigo: '176',
    nome: 'Loja 176 - Palmas Teotônio',
    cidade: 'Palmas',
    endereco: 'Av. Teotônio Segurado',
    regiao: 'Norte',
    imagem: '/images/lojas/176.jpg',
    ativa: true
  },
  {
    codigo: '194',
    nome: 'Loja 194 - Anápolis',
    cidade: 'Anápolis',
    endereco: 'Centro',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/194.jpg',
    ativa: true
  },
  {
    codigo: '310',
    nome: 'Loja 310 - Portugal',
    cidade: 'Goiânia',
    endereco: 'Setor Portugal',
    regiao: 'Centro-Oeste',
    imagem: '/images/lojas/310.jpg',
    ativa: true
  },
  {
    codigo: '320',
    nome: 'Loja 320 - Palmas cesamar',
    cidade: 'Palmas',
    endereco: 'Cesamar',
    regiao: 'Norte',
    imagem: '/images/lojas/320.jpg',
    ativa: true
  }
];

async function popularLojas() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    console.log('🔄 Limpando lojas existentes...');
    await Loja.deleteMany({});
    console.log('✅ Lojas existentes removidas');

    console.log('🔄 Inserindo lojas...');
    const resultado = await Loja.insertMany(lojas);
    console.log(`✅ ${resultado.length} lojas inseridas com sucesso!`);

    console.log('\n📋 Lojas cadastradas:');
    resultado.forEach(loja => {
      console.log(`   - ${loja.codigo}: ${loja.nome} (${loja.cidade})`);
    });

    console.log('\n🎉 Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular lojas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

popularLojas();
