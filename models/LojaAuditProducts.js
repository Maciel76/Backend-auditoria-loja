/**
 * MODELO: LojaAuditProducts
 * ENDPOINTS ASSOCIADOS:
 * - GET /api/audit-products/produtos-auditorias/:lojaId - Buscar produtos do modelo LojaAuditProducts
 * - GET /api/audit-products/produtos/:lojaId/:tipo - Obter produtos por tipo de auditoria
 * - GET /api/audit-products/produtos/:lojaId - Obter todos os produtos de uma loja
 * - DELETE /api/audit-products/produtos/:lojaId/:tipo - Limpar produtos de auditoria de um tipo específico
 * - DELETE /api/audit-products/produtos/:lojaId - Limpar todos os produtos de auditoria de uma loja
 * - POST /api/audit-products/produtos/extrair/:lojaId/:tipo - Extrair produtos de auditorias existentes
 */
// models/LojaAuditProducts.js - Modelo para armazenar nomes de produtos por tipo de auditoria
import mongoose from "mongoose";

// Schema para armazenar informações detalhadas de um produto
const produtoSchema = new mongoose.Schema({
  codigo: { type: String, required: true },
  nome: { type: String, required: true },
  classe: { type: String, default: "" },
  local: { type: String, default: "" },
  situacao: { type: String, default: "" },
  estoque: { type: String, default: "0" },
  ultimaCompra: { type: String, default: "" },
  auditadoDia: { type: String, default: "" },
  auditadoHora: { type: String, default: "" },
  fornecedor: { type: String, default: "" },
  setor: { type: String, default: "" },
  custoRuptura: { type: Number, default: 0 },
  presenca: { type: Boolean, default: false },
  presencaConfirmada: { type: String, default: "" },
  diasSemVenda: { type: Number, default: 0 },
  residuo: { type: String, default: "" },
  classeProdutoRaiz: { type: String, default: "" },
  classeProduto: { type: String, default: "" },
  situacaoAuditoria: { type: String, default: "" },
  estoqueAtual: { type: String, default: "0" },
  estoqueLeitura: { type: String, default: "0" },
  // Campo para armazenar o nome do usuário que realizou a leitura do item
  usuarioLeitura: { type: String, default: "" },
  usuarioId: { type: String, default: "" }
});

// Schema para armazenar produtos por tipo de auditoria
const auditProductsSchema = new mongoose.Schema({
  etiqueta: {
    type: [produtoSchema],
    default: [],
    description: "Produtos detalhados para auditoria de etiquetas"
  },
  presenca: {
    type: [produtoSchema],
    default: [],
    description: "Produtos detalhados para auditoria de presença"
  },
  ruptura: {
    type: [produtoSchema],
    default: [],
    description: "Produtos detalhados para auditoria de ruptura"
  }
});

// Schema principal
const lojaAuditProductsSchema = new mongoose.Schema({
  // Referência à loja
  loja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loja",
    required: true,
    index: true
  },
  
  // Nome da loja (para facilitar consultas)
  lojaNome: {
    type: String,
    required: true
  },
  
  // Data de referência (pode ser a data da última atualização)
  dataReferencia: {
    type: Date,
    default: Date.now
  },
  
  // Produtos por tipo de auditoria
  produtos: {
    type: auditProductsSchema,
    default: () => ({})
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para otimizar consultas
lojaAuditProductsSchema.index({ loja: 1 });
lojaAuditProductsSchema.index({ lojaNome: 1 });
lojaAuditProductsSchema.index({ dataReferencia: -1 });

// Índice único para garantir que exista apenas um documento por loja
lojaAuditProductsSchema.index({ loja: 1 }, { unique: true });

// Métodos estáticos
lojaAuditProductsSchema.statics.obterProdutosPorLoja = function (lojaId) {
  return this.findOne({ loja: lojaId });
};

lojaAuditProductsSchema.statics.obterProdutosPorTipo = function (lojaId, tipo) {
  return this.findOne({ loja: lojaId }, { [`produtos.${tipo}`]: 1 });
};

lojaAuditProductsSchema.statics.adicionarProduto = async function (lojaId, lojaNome, tipo, produto) {
  if (!['etiqueta', 'presenca', 'ruptura'].includes(tipo)) {
    throw new Error('Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura');
  }

  // Verificar se o produto já existe no array
  const lojaProdutos = await this.findOne({ loja: lojaId });

  if (lojaProdutos) {
    // Verificar se o produto já existe no tipo específico
    const produtosExistentes = lojaProdutos.produtos[tipo] || [];

    // Verificar se é um objeto de produto ou string
    let produtoJaExiste = false;
    if (typeof produto === 'object' && produto.codigo) {
      // É um objeto de produto, verificar duplicata por código
      produtoJaExiste = produtosExistentes.some(p => p.codigo === produto.codigo);
    } else if (typeof produto === 'string') {
      // É uma string, verificar duplicata por nome
      produtoJaExiste = produtosExistentes.includes(produto);
    }

    if (!produtoJaExiste) {
      // Se for um objeto de produto, garantir que tenha os campos de usuário
      let produtoFinal = produto;
      if (typeof produto === 'object' && produto.codigo) {
        produtoFinal = {
          codigo: produto.codigo || "",
          nome: produto.nome || "",
          classe: produto.classe || "",
          local: produto.local || "",
          situacao: produto.situacao || "",
          estoque: produto.estoque || "0",
          ultimaCompra: produto.ultimaCompra || "",
          auditadoDia: produto.auditadoDia || "",
          auditadoHora: produto.auditadoHora || "",
          fornecedor: produto.fornecedor || "",
          setor: produto.setor || "",
          custoRuptura: produto.custoRuptura || 0,
          presenca: produto.presenca || false,
          presencaConfirmada: produto.presencaConfirmada || "",
          diasSemVenda: produto.diasSemVenda || 0,
          residuo: produto.residuo || "",
          classeProdutoRaiz: produto.classeProdutoRaiz || "",
          classeProduto: produto.classeProduto || "",
          situacaoAuditoria: produto.situacaoAuditoria || "",
          estoqueAtual: produto.estoqueAtual || "0",
          estoqueLeitura: produto.estoqueLeitura || "0",
          // Campos para armazenar informações do usuário que realizou a leitura
          usuarioLeitura: produto.usuarioLeitura || "",
          usuarioId: produto.usuarioId || "",
          ...produto // Manter quaisquer outros campos que possam ter sido passados
        };
      }

      // Adicionar o produto ao array do tipo específico
      lojaProdutos.produtos[tipo] = [...produtosExistentes, produtoFinal];
      await lojaProdutos.save();
      return lojaProdutos;
    }
    return lojaProdutos; // Produto já existe
  } else {
    // Criar novo documento
    // Se for um objeto de produto, garantir que tenha os campos de usuário
    let produtoFinal = produto;
    if (typeof produto === 'object' && produto.codigo) {
      produtoFinal = {
        codigo: produto.codigo || "",
        nome: produto.nome || "",
        classe: produto.classe || "",
        local: produto.local || "",
        situacao: produto.situacao || "",
        estoque: produto.estoque || "0",
        ultimaCompra: produto.ultimaCompra || "",
        auditadoDia: produto.auditadoDia || "",
        auditadoHora: produto.auditadoHora || "",
        fornecedor: produto.fornecedor || "",
        setor: produto.setor || "",
        custoRuptura: produto.custoRuptura || 0,
        presenca: produto.presenca || false,
        presencaConfirmada: produto.presencaConfirmada || "",
        diasSemVenda: produto.diasSemVenda || 0,
        residuo: produto.residuo || "",
        classeProdutoRaiz: produto.classeProdutoRaiz || "",
        classeProduto: produto.classeProduto || "",
        situacaoAuditoria: produto.situacaoAuditoria || "",
        estoqueAtual: produto.estoqueAtual || "0",
        estoqueLeitura: produto.estoqueLeitura || "0",
        // Campos para armazenar informações do usuário que realizou a leitura
        usuarioLeitura: produto.usuarioLeitura || "",
        usuarioId: produto.usuarioId || "",
        ...produto // Manter quaisquer outros campos que possam ter sido passados
      };
    }

    const novoDocumento = new this({
      loja: lojaId,
      lojaNome,
      produtos: {
        [tipo]: [produtoFinal]
      }
    });
    return await novoDocumento.save();
  }
};

lojaAuditProductsSchema.statics.adicionarVariosProdutos = async function (lojaId, lojaNome, tipo, produtos) {
  if (!['etiqueta', 'presenca', 'ruptura'].includes(tipo)) {
    throw new Error('Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura');
  }

  // Remover duplicatas dos produtos a serem adicionados
  // Para objetos, precisamos comparar por código ou nome
  let produtosUnicos = [];
  const codigosVistos = new Set();
  const nomesVistos = new Set();

  for (const produto of produtos) {
    if (typeof produto === 'object' && produto.codigo) {
      // É um objeto de produto, verificar duplicata por código
      if (!codigosVistos.has(produto.codigo)) {
        codigosVistos.add(produto.codigo);
        produtosUnicos.push(produto);
      }
    } else if (typeof produto === 'string') {
      // É uma string, verificar duplicata por nome
      if (!nomesVistos.has(produto)) {
        nomesVistos.add(produto);
        produtosUnicos.push(produto);
      }
    } else if (typeof produto === 'object' && produto.nome) {
      // É um objeto sem código mas com nome
      if (!nomesVistos.has(produto.nome)) {
        nomesVistos.add(produto.nome);
        produtosUnicos.push(produto);
      }
    }
  }

  const lojaProdutos = await this.findOne({ loja: lojaId });

  if (lojaProdutos) {
    // Obter produtos existentes do tipo específico
    const produtosExistentes = lojaProdutos.produtos[tipo] || [];

    // Filtrar produtos que ainda não existem
    const produtosParaAdicionar = produtosUnicos.filter(produto => {
      if (typeof produto === 'object' && produto.codigo) {
        // Comparar por código se for objeto com código
        return !produtosExistentes.some(p => p.codigo === produto.codigo);
      } else if (typeof produto === 'string') {
        // Comparar por nome se for string
        return !produtosExistentes.includes(produto);
      } else if (typeof produto === 'object' && produto.nome) {
        // Comparar por nome se for objeto sem código
        return !produtosExistentes.some(p => p.nome === produto.nome);
      }
      return true; // Caso padrão
    });

    if (produtosParaAdicionar.length > 0) {
      // Adicionar os produtos que não existem
      lojaProdutos.produtos[tipo] = [...produtosExistentes, ...produtosParaAdicionar];
      await lojaProdutos.save();
    }

    return lojaProdutos;
  } else {
    // Criar novo documento com os produtos
    const novoDocumento = new this({
      loja: lojaId,
      lojaNome,
      produtos: {
        [tipo]: produtosUnicos
      }
    });
    return await novoDocumento.save();
  }
};

// Método para adicionar vários produtos detalhados (objetos completos)
lojaAuditProductsSchema.statics.adicionarVariosProdutosDetalhados = async function (lojaId, lojaNome, tipo, produtosDetalhados) {
  if (!['etiqueta', 'presenca', 'ruptura'].includes(tipo)) {
    throw new Error('Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura');
  }

  // Garantir que todos os produtos tenham os campos obrigatórios
  const produtosFormatados = produtosDetalhados.map(produto => ({
    codigo: produto.codigo || "",
    nome: produto.nome || "",
    classe: produto.classe || "",
    local: produto.local || "",
    situacao: produto.situacao || "",
    estoque: produto.estoque || "0",
    ultimaCompra: produto.ultimaCompra || "",
    auditadoDia: produto.auditadoDia || "",
    auditadoHora: produto.auditadoHora || "",
    fornecedor: produto.fornecedor || "",
    setor: produto.setor || "",
    custoRuptura: produto.custoRuptura || 0,
    presenca: produto.presenca || false,
    presencaConfirmada: produto.presencaConfirmada || "",
    diasSemVenda: produto.diasSemVenda || 0,
    residuo: produto.residuo || "",
    classeProdutoRaiz: produto.classeProdutoRaiz || "",
    classeProduto: produto.classeProduto || "",
    situacaoAuditoria: produto.situacaoAuditoria || "",
    estoqueAtual: produto.estoqueAtual || "0",
    estoqueLeitura: produto.estoqueLeitura || "0",
    // Campos para armazenar informações do usuário que realizou a leitura
    usuarioLeitura: produto.usuarioLeitura || "",
    usuarioId: produto.usuarioId || ""
  }));

  const lojaProdutos = await this.findOne({ loja: lojaId });

  if (lojaProdutos) {
    // Obter produtos existentes do tipo específico
    const produtosExistentes = lojaProdutos.produtos[tipo] || [];

    // Criar mapas para verificação rápida de duplicatas (por código ou nome)
    const codigosExistentes = new Set(produtosExistentes.map(p => p.codigo).filter(c => c));
    const nomesExistentes = new Set(produtosExistentes.map(p => p.nome).filter(n => n));

    // Filtrar produtos que ainda não existem (comparando por código ou nome)
    const produtosParaAdicionar = produtosFormatados.filter(produto => {
      // Se tiver código, verificar duplicata por código
      if (produto.codigo) {
        return !codigosExistentes.has(produto.codigo);
      }
      // Senão, verificar duplicata por nome
      return !nomesExistentes.has(produto.nome);
    });

    if (produtosParaAdicionar.length > 0) {
      // Adicionar os produtos que não existem
      lojaProdutos.produtos[tipo] = [...produtosExistentes, ...produtosParaAdicionar];
      await lojaProdutos.save();
    }

    return lojaProdutos;
  } else {
    // Criar novo documento com os produtos detalhados
    const novoDocumento = new this({
      loja: lojaId,
      lojaNome,
      produtos: {
        [tipo]: produtosFormatados
      }
    });
    return await novoDocumento.save();
  }
};

// Método para limpar produtos de um tipo específico
lojaAuditProductsSchema.statics.limparProdutosPorTipo = async function (lojaId, tipo) {
  if (!['etiqueta', 'presenca', 'ruptura'].includes(tipo)) {
    throw new Error('Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura');
  }

  const lojaProdutos = await this.findOne({ loja: lojaId });
  if (lojaProdutos) {
    lojaProdutos.produtos[tipo] = [];
    await lojaProdutos.save();
    return lojaProdutos;
  }
  return null;
};

// Método para limpar todos os produtos de uma loja (usado na limpeza de dados)
lojaAuditProductsSchema.statics.limparTodosProdutos = async function (lojaId) {
  const lojaProdutos = await this.findOne({ loja: lojaId });
  if (lojaProdutos) {
    lojaProdutos.produtos.etiqueta = [];
    lojaProdutos.produtos.presenca = [];
    lojaProdutos.produtos.ruptura = [];
    await lojaProdutos.save();
    return lojaProdutos;
  }
  return null;
};

// Middleware para atualizar o campo updatedAt
lojaAuditProductsSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("LojaAuditProducts", lojaAuditProductsSchema);