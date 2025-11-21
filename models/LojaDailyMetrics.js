// models/LojaDailyMetrics.js - Métricas diárias da loja (período diário)
import mongoose from "mongoose";

// Schema para contadores de leitura por classe de produto
const classesLeituraSchema = new mongoose.Schema({
  "A CLASSIFICAR": {
    total: { type: Number, default: 0 },  // Total itens da classe (todos)
    itensValidos: { type: Number, default: 0 },  // Itens válidos da classe (excluindo "Sem Estoque")
    lidos: { type: Number, default: 0 },  // Quantidade de itens lidos (atualizados + desatualizado + nao_pertence)
    percentual: { type: Number, default: 0 }, // Percentual (lidos/itensValidos)
    usuarios: { type: Object, default: {} } // Objeto com usuários e suas leituras por classe
  },
  "ALTO GIRO": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  BAZAR: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  DIVERSOS: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  DPH: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  FLV: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "LATICINIOS 1": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  LIQUIDA: {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PERECIVEL 1": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PERECIVEL 2": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PERECIVEL 2 B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PERECIVEL 3": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "SECA DOCE": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "SECA SALGADA": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "SECA SALGADA 2": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
});

// Schema para contadores de leitura por local
const locaisLeituraSchema = new mongoose.Schema({
  "C01 - C01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} } // Objeto com usuários e suas leituras por local
  },
  "CS01 - CS01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "F01 - F01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "F02 - F02": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "FLV - FLV": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G01A - G01A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G01B - G01B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G02A - G02A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G02B - G02B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G03A - G03A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G03B - G03B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G04A - G04A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G04B - G04B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G05A - G05A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G05B - G05B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G06A - G06A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G06B - G06B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G07A - G07A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G07B - G07B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G08A - G08A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G08B - G08B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G09A - G09A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G09B - G09B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G10A - G10A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G10B - G10B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G11A - G11A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G11B - G11B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G12A - G12A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G12B - G12B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G13A - G13A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G13B - G13B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G14A - G14A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G14B - G14B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G15A - G15A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G15B - G15B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G16A - G16A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G16B - G16B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G17A - G17A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G17B - G17B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G18A - G18A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G18B - G18B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G19A - G19A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G19B - G19B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G20A - G20A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G20B - G20B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G21A - G21A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G21B - G21B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G22A - G22A": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "G22B - G22B": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "GELO - GELO": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "I01 - I01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PA01 - PA01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PAO - PAO": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PF01 - PF01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PF02 - PF02": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PF03 - PF03": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PL01 - PL01": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "PL02 - PL02": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
  "SORVETE - SORVETE": {
    total: { type: Number, default: 0 },
    itensValidos: { type: Number, default: 0 },
    lidos: { type: Number, default: 0 },
    percentual: { type: Number, default: 0 },
    usuarios: { type: Object, default: {} }
  },
});

// Schema para métricas de etiquetas
const metricasEtiquetasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 }, // Quantidade total de itens da planilha
  itensValidos: { type: Number, default: 0 }, // [Atualizado]+[Não lidos com estoque]+[Lido sem estoque]
  itensAtualizados: { type: Number, default: 0 }, // Situação: Atualizado
  itensNaolidos: { type: Number, default: 0 }, // Situação: Não lidos com estoque
  itensDesatualizado: { type: Number, default: 0 }, // Situação: Desatualizado
  itensNaopertence: { type: Number, default: 0 }, // Situação: Lido não pertence
  itensLidosemestoque: { type: Number, default: 0 }, // Situação: Lido sem estoque
  itensNlidocomestoque: { type: Number, default: 0 }, // Situação: Não lidos com estoque
  itensSemestoque: { type: Number, default: 0 }, // Situação: Sem Estoque
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão = (itensAtualizados / itens válidos) * 100
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  percentualDesatualizado: { type: Number, default: 0 }, // % etiquetas desatualizadas = (itens desatualizados / itens válidos) * 100
  usuariosAtivos: { type: Number, default: 0 }, // Usuários únicos

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

  // Contadores de leitura por local
  locaisLeitura: { type: locaisLeituraSchema, default: () => ({}) },

  // Contadores específicos de etiquetas
  contadorClasses: {
    "A CLASSIFICAR": { type: Number, default: 0 },
    "ALTO GIRO": { type: Number, default: 0 },
    BAZAR: { type: Number, default: 0 },
    DIVERSOS: { type: Number, default: 0 },
    DPH: { type: Number, default: 0 },
    FLV: { type: Number, default: 0 },
    "LATICINIOS 1": { type: Number, default: 0 },
    LIQUIDA: { type: Number, default: 0 },
    "PERECIVEL 1": { type: Number, default: 0 },
    "PERECIVEL 2": { type: Number, default: 0 },
    "PERECIVEL 2 B": { type: Number, default: 0 },
    "PERECIVEL 3": { type: Number, default: 0 },
    "SECA DOCE": { type: Number, default: 0 },
    "SECA SALGADA": { type: Number, default: 0 },
    "SECA SALGADA 2": { type: Number, default: 0 },
  },
  contadorLocais: {
    "C01 - C01": { type: Number, default: 0 },
    "CS01 - CS01": { type: Number, default: 0 },
    "F01 - F01": { type: Number, default: 0 },
    "F02 - F02": { type: Number, default: 0 },
    "FLV - FLV": { type: Number, default: 0 },
    "G01A - G01A": { type: Number, default: 0 },
    "G01B - G01B": { type: Number, default: 0 },
    "G02A - G02A": { type: Number, default: 0 },
    "G02B - G02B": { type: Number, default: 0 },
    "G03A - G03A": { type: Number, default: 0 },
    "G03B - G03B": { type: Number, default: 0 },
    "G04A - G04A": { type: Number, default: 0 },
    "G04B - G04B": { type: Number, default: 0 },
    "G05A - G05A": { type: Number, default: 0 },
    "G05B - G05B": { type: Number, default: 0 },
    "G06A - G06A": { type: Number, default: 0 },
    "G06B - G06B": { type: Number, default: 0 },
    "G07A - G07A": { type: Number, default: 0 },
    "G07B - G07B": { type: Number, default: 0 },
    "G08A - G08A": { type: Number, default: 0 },
    "G08B - G08B": { type: Number, default: 0 },
    "G09A - G09A": { type: Number, default: 0 },
    "G09B - G09B": { type: Number, default: 0 },
    "G10A - G10A": { type: Number, default: 0 },
    "G10B - G10B": { type: Number, default: 0 },
    "G11A - G11A": { type: Number, default: 0 },
    "G11B - G11B": { type: Number, default: 0 },
    "G12A - G12A": { type: Number, default: 0 },
    "G12B - G12B": { type: Number, default: 0 },
    "G13A - G13A": { type: Number, default: 0 },
    "G13B - G13B": { type: Number, default: 0 },
    "G14A - G14A": { type: Number, default: 0 },
    "G14B - G14B": { type: Number, default: 0 },
    "G15A - G15A": { type: Number, default: 0 },
    "G15B - G15B": { type: Number, default: 0 },
    "G16A - G16A": { type: Number, default: 0 },
    "G16B - G16B": { type: Number, default: 0 },
    "G17A - G17A": { type: Number, default: 0 },
    "G17B - G17B": { type: Number, default: 0 },
    "G18A - G18A": { type: Number, default: 0 },
    "G18B - G18B": { type: Number, default: 0 },
    "G19A - G19A": { type: Number, default: 0 },
    "G19B - G19B": { type: Number, default: 0 },
    "G20A - G20A": { type: Number, default: 0 },
    "G20B - G20B": { type: Number, default: 0 },
    "G21A - G21A": { type: Number, default: 0 },
    "G21B - G21B": { type: Number, default: 0 },
    "G22A - G22A": { type: Number, default: 0 },
    "G22B - G22B": { type: Number, default: 0 },
    "GELO - GELO": { type: Number, default: 0 },
    "I01 - I01": { type: Number, default: 0 },
    "PA01 - PA01": { type: Number, default: 0 },
    "PAO - PAO": { type: Number, default: 0 },
    "PF01 - PF01": { type: Number, default: 0 },
    "PF02 - PF02": { type: Number, default: 0 },
    "PF03 - PF03": { type: Number, default: 0 },
    "PL01 - PL01": { type: Number, default: 0 },
    "PL02 - PL02": { type: Number, default: 0 },
    "SORVETE - SORVETE": { type: Number, default: 0 },
  },
});

// Schema para métricas de rupturas
const metricasRupturasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensLidos: { type: Number, default: 0 }, // Quantidade de itens com situação "Com Presença e com Estoque"
  itensNaoLidos: { type: Number, default: 0 }, // Quantidade de itens com situação "Sem Presença e Com Estoque" - substitui itensAtualizados
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão em relação a totalItens e itensLidos (continuação da auditoria de presença)
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  custoTotalRuptura: { type: Number, default: 0 }, // Valor do Custo da Ruptura dos itens com situação "Sem Presença e Com Estoque"
  usuariosAtivos: { type: Number, default: 0 },

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

  // Contadores de leitura por local
  locaisLeitura: { type: locaisLeituraSchema, default: () => ({}) },

  // Contadores específicos de rupturas
  contadorClasses: {
    "A CLASSIFICAR": { type: Number, default: 0 },
    "ALTO GIRO": { type: Number, default: 0 },
    BAZAR: { type: Number, default: 0 },
    DIVERSOS: { type: Number, default: 0 },
    DPH: { type: Number, default: 0 },
    FLV: { type: Number, default: 0 },
    "LATICINIOS 1": { type: Number, default: 0 },
    LIQUIDA: { type: Number, default: 0 },
    "PERECIVEL 1": { type: Number, default: 0 },
    "PERECIVEL 2": { type: Number, default: 0 },
    "PERECIVEL 2 B": { type: Number, default: 0 },
    "PERECIVEL 3": { type: Number, default: 0 },
    "SECA DOCE": { type: Number, default: 0 },
    "SECA SALGADA": { type: Number, default: 0 },
    "SECA SALGADA 2": { type: Number, default: 0 },
  },
  contadorLocais: {
    "C01 - C01": { type: Number, default: 0 },
    "CS01 - CS01": { type: Number, default: 0 },
    "F01 - F01": { type: Number, default: 0 },
    "F02 - F02": { type: Number, default: 0 },
    "FLV - FLV": { type: Number, default: 0 },
    "G01A - G01A": { type: Number, default: 0 },
    "G01B - G01B": { type: Number, default: 0 },
    "G02A - G02A": { type: Number, default: 0 },
    "G02B - G02B": { type: Number, default: 0 },
    "G03A - G03A": { type: Number, default: 0 },
    "G03B - G03B": { type: Number, default: 0 },
    "G04A - G04A": { type: Number, default: 0 },
    "G04B - G04B": { type: Number, default: 0 },
    "G05A - G05A": { type: Number, default: 0 },
    "G05B - G05B": { type: Number, default: 0 },
    "G06A - G06A": { type: Number, default: 0 },
    "G06B - G06B": { type: Number, default: 0 },
    "G07A - G07A": { type: Number, default: 0 },
    "G07B - G07B": { type: Number, default: 0 },
    "G08A - G08A": { type: Number, default: 0 },
    "G08B - G08B": { type: Number, default: 0 },
    "G09A - G09A": { type: Number, default: 0 },
    "G09B - G09B": { type: Number, default: 0 },
    "G10A - G10A": { type: Number, default: 0 },
    "G10B - G10B": { type: Number, default: 0 },
    "G11A - G11A": { type: Number, default: 0 },
    "G11B - G11B": { type: Number, default: 0 },
    "G12A - G12A": { type: Number, default: 0 },
    "G12B - G12B": { type: Number, default: 0 },
    "G13A - G13A": { type: Number, default: 0 },
    "G13B - G13B": { type: Number, default: 0 },
    "G14A - G14A": { type: Number, default: 0 },
    "G14B - G14B": { type: Number, default: 0 },
    "G15A - G15A": { type: Number, default: 0 },
    "G15B - G15B": { type: Number, default: 0 },
    "G16A - G16A": { type: Number, default: 0 },
    "G16B - G16B": { type: Number, default: 0 },
    "G17A - G17A": { type: Number, default: 0 },
    "G17B - G17B": { type: Number, default: 0 },
    "G18A - G18A": { type: Number, default: 0 },
    "G18B - G18B": { type: Number, default: 0 },
    "G19A - G19A": { type: Number, default: 0 },
    "G19B - G19B": { type: Number, default: 0 },
    "G20A - G20A": { type: Number, default: 0 },
    "G20B - G20B": { type: Number, default: 0 },
    "G21A - G21A": { type: Number, default: 0 },
    "G21B - G21B": { type: Number, default: 0 },
    "G22A - G22A": { type: Number, default: 0 },
    "G22B - G22B": { type: Number, default: 0 },
    "GELO - GELO": { type: Number, default: 0 },
    "I01 - I01": { type: Number, default: 0 },
    "PA01 - PA01": { type: Number, default: 0 },
    "PAO - PAO": { type: Number, default: 0 },
    "PF01 - PF01": { type: Number, default: 0 },
    "PF02 - PF02": { type: Number, default: 0 },
    "PF03 - PF03": { type: Number, default: 0 },
    "PL01 - PL01": { type: Number, default: 0 },
    "PL02 - PL02": { type: Number, default: 0 },
    "SORVETE - SORVETE": { type: Number, default: 0 },
  },
});

// Schema para métricas de presenças
const metricasPresencasSchema = new mongoose.Schema({
  totalItens: { type: Number, default: 0 },
  itensValidos: { type: Number, default: 0 }, // [Sem Presença e Com Estoque] + [Com Presença e Com Estoque]
  itensNaoLidos: { type: Number, default: 0 }, // [Sem Presença e Com Estoque]
  itensAtualizados: { type: Number, default: 0 }, // [Com Presença e Com Estoque]
  percentualConclusao: { type: Number, default: 0 }, // % de conclusão = (itensAtualizados / itensValidos) * 100
  percentualRestante: { type: Number, default: 0 }, // % restante = 100 - percentualConclusao
  custoRuptura: { type: Number, default: 0 }, // Valor total da ruptura dos itens [Sem Presença e Com Estoque]
  rupturaSemPresenca: { type: Number, default: 0 }, // Valor total da ruptura dos itens com situação original [Sem Presença e Com Estoque]
  presencasConfirmadas: { type: Number, default: 0 }, // [Com Presença e Com Estoque] + [Com Presença e sem Estoque] + [Lido não pertence]
  usuariosAtivos: { type: Number, default: 0 },

  // Contadores de leitura por classe de produto
  classesLeitura: { type: classesLeituraSchema, default: () => ({}) },

  // Contadores de leitura por local
  locaisLeitura: { type: locaisLeituraSchema, default: () => ({}) },

  // Contadores específicos de presenças
  contadorClasses: {
    "A CLASSIFICAR": { type: Number, default: 0 },
    "ALTO GIRO": { type: Number, default: 0 },
    BAZAR: { type: Number, default: 0 },
    DIVERSOS: { type: Number, default: 0 },
    DPH: { type: Number, default: 0 },
    FLV: { type: Number, default: 0 },
    "LATICINIOS 1": { type: Number, default: 0 },
    LIQUIDA: { type: Number, default: 0 },
    "PERECIVEL 1": { type: Number, default: 0 },
    "PERECIVEL 2": { type: Number, default: 0 },
    "PERECIVEL 2 B": { type: Number, default: 0 },
    "PERECIVEL 3": { type: Number, default: 0 },
    "SECA DOCE": { type: Number, default: 0 },
    "SECA SALGADA": { type: Number, default: 0 },
    "SECA SALGADA 2": { type: Number, default: 0 },
  },
  contadorLocais: {
    "C01 - C01": { type: Number, default: 0 },
    "CS01 - CS01": { type: Number, default: 0 },
    "F01 - F01": { type: Number, default: 0 },
    "F02 - F02": { type: Number, default: 0 },
    "FLV - FLV": { type: Number, default: 0 },
    "G01A - G01A": { type: Number, default: 0 },
    "G01B - G01B": { type: Number, default: 0 },
    "G02A - G02A": { type: Number, default: 0 },
    "G02B - G02B": { type: Number, default: 0 },
    "G03A - G03A": { type: Number, default: 0 },
    "G03B - G03B": { type: Number, default: 0 },
    "G04A - G04A": { type: Number, default: 0 },
    "G04B - G04B": { type: Number, default: 0 },
    "G05A - G05A": { type: Number, default: 0 },
    "G05B - G05B": { type: Number, default: 0 },
    "G06A - G06A": { type: Number, default: 0 },
    "G06B - G06B": { type: Number, default: 0 },
    "G07A - G07A": { type: Number, default: 0 },
    "G07B - G07B": { type: Number, default: 0 },
    "G08A - G08A": { type: Number, default: 0 },
    "G08B - G08B": { type: Number, default: 0 },
    "G09A - G09A": { type: Number, default: 0 },
    "G09B - G09B": { type: Number, default: 0 },
    "G10A - G10A": { type: Number, default: 0 },
    "G10B - G10B": { type: Number, default: 0 },
    "G11A - G11A": { type: Number, default: 0 },
    "G11B - G11B": { type: Number, default: 0 },
    "G12A - G12A": { type: Number, default: 0 },
    "G12B - G12B": { type: Number, default: 0 },
    "G13A - G13A": { type: Number, default: 0 },
    "G13B - G13B": { type: Number, default: 0 },
    "G14A - G14A": { type: Number, default: 0 },
    "G14B - G14B": { type: Number, default: 0 },
    "G15A - G15A": { type: Number, default: 0 },
    "G15B - G15B": { type: Number, default: 0 },
    "G16A - G16A": { type: Number, default: 0 },
    "G16B - G16B": { type: Number, default: 0 },
    "G17A - G17A": { type: Number, default: 0 },
    "G17B - G17B": { type: Number, default: 0 },
    "G18A - G18A": { type: Number, default: 0 },
    "G18B - G18B": { type: Number, default: 0 },
    "G19A - G19A": { type: Number, default: 0 },
    "G19B - G19B": { type: Number, default: 0 },
    "G20A - G20A": { type: Number, default: 0 },
    "G20B - G20B": { type: Number, default: 0 },
    "G21A - G21A": { type: Number, default: 0 },
    "G21B - G21B": { type: Number, default: 0 },
    "G22A - G22A": { type: Number, default: 0 },
    "G22B - G22B": { type: Number, default: 0 },
    "GELO - GELO": { type: Number, default: 0 },
    "I01 - I01": { type: Number, default: 0 },
    "PA01 - PA01": { type: Number, default: 0 },
    "PAO - PAO": { type: Number, default: 0 },
    "PF01 - PF01": { type: Number, default: 0 },
    "PF02 - PF02": { type: Number, default: 0 },
    "PF03 - PF03": { type: Number, default: 0 },
    "PL01 - PL01": { type: Number, default: 0 },
    "PL02 - PL02": { type: Number, default: 0 },
    "SORVETE - SORVETE": { type: Number, default: 0 },
  },
});

// Schema principal das métricas diárias da loja
const lojaDailyMetricsSchema = new mongoose.Schema(
  {
    // Informações da loja
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
    lojaNome: {
      type: String,
      required: true,
      index: true,
    },

    // Data específica (período diário)
    data: {
      type: Date,
      required: true,
      index: true,
    },
    dataInicio: {
      type: Date,
      required: true,
      index: true,
    },
    dataFim: {
      type: Date,
      required: true,
      index: true,
    },

    // Métricas por tipo de auditoria
    etiquetas: {
      type: metricasEtiquetasSchema,
      default: () => ({}),
    },
    rupturas: {
      type: metricasRupturasSchema,
      default: () => ({}),
    },
    presencas: {
      type: metricasPresencasSchema,
      default: () => ({}),
    },

    // Métricas consolidadas
    totais: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusaoGeral: { type: Number, default: 0 },
      usuariosTotais: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
      planilhasProcessadas: { type: Number, default: 0 },
    },

    // Ranking e desempenho do dia
    ranking: {
      posicaoGeral: { type: Number, default: 0 },
      pontuacaoTotal: { type: Number, default: 0 },
      notaQualidade: { type: Number, default: 0 }, // 0-10
      eficienciaOperacional: { type: Number, default: 0 }, // 0-100
    },

    // Análise por setores/locais do dia
    locaisEstatisticas: [
      {
        local: String,
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        problemasFrecuentes: { type: Number, default: 0 },
      },
    ],

    // Alertas do dia
    alertas: [
      {
        tipo: {
          type: String,
          enum: [
            "baixa_produtividade",
            "alta_ruptura",
            "poucos_usuarios",
            "qualidade_baixa",
          ],
        },
        severidade: {
          type: String,
          enum: ["baixa", "media", "alta", "critica"],
          default: "media",
        },
        descricao: String,
        valor: Number,
        dataDeteccao: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    versaoCalculo: {
      type: String,
      default: "2.0",
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas
lojaDailyMetricsSchema.index({ loja: 1, data: -1 });
lojaDailyMetricsSchema.index({ lojaNome: 1, data: -1 });
lojaDailyMetricsSchema.index({ data: -1, "ranking.pontuacaoTotal": -1 });
lojaDailyMetricsSchema.index({ loja: 1, "ranking.posicaoGeral": 1 });

// Índice único para evitar duplicatas - UM documento por loja (igual ao UserDailyMetrics)
lojaDailyMetricsSchema.index({ loja: 1 }, { unique: true });

// Métodos estáticos
lojaDailyMetricsSchema.statics.obterMetricasDiarias = function (
  lojaId,
  dataInicio,
  dataFim
) {
  return this.find({
    loja: lojaId,
    data: { $gte: dataInicio, $lte: dataFim },
  }).sort({ data: -1 });
};

lojaDailyMetricsSchema.statics.obterRankingDiario = function (
  data,
  limite = 50
) {
  const dataInicio = new Date(data);
  dataInicio.setHours(0, 0, 0, 0);
  const dataFim = new Date(data);
  dataFim.setHours(23, 59, 59, 999);

  return this.find({
    data: { $gte: dataInicio, $lte: dataFim },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "ranking.pontuacaoTotal": -1 })
    .limit(limite);
};

lojaDailyMetricsSchema.statics.obterTendenciaLoja = function (
  lojaId,
  limite = 30
) {
  return this.find({
    loja: lojaId,
  })
    .sort({ data: -1 })
    .limit(limite);
};

// Métodos de instância
lojaDailyMetricsSchema.methods.calcularPontuacaoTotal = function () {
  const pesos = {
    conclusao: 0.4, // 40% - Taxa de conclusão
    qualidade: 0.3, // 30% - Qualidade do trabalho
    produtividade: 0.2, // 20% - Produtividade
    consistencia: 0.1, // 10% - Consistência
  };

  // Taxa de conclusão (0-100)
  const taxaConclusao = this.totais.percentualConclusaoGeral;

  // Qualidade baseada na proporção de diferentes tipos de auditoria
  const diversidade = [
    this.etiquetas.totalItens > 0,
    this.rupturas.totalItens > 0,
    this.presencas.totalItens > 0,
  ].filter(Boolean).length;

  const qualidade = (diversidade / 3) * 100;

  // Produtividade baseada em itens por usuário ativo
  const produtividade =
    this.totais.usuariosAtivos > 0
      ? Math.min(
          (this.totais.itensAtualizados / this.totais.usuariosAtivos) * 2,
          100
        )
      : 0;

  // Consistência baseada na regularidade de uso
  const consistencia = Math.min(this.totais.usuariosAtivos * 10, 100);

  const pontuacao =
    taxaConclusao * pesos.conclusao +
    qualidade * pesos.qualidade +
    produtividade * pesos.produtividade +
    consistencia * pesos.consistencia;

  this.ranking.pontuacaoTotal = Math.round(pontuacao);
  this.ranking.notaQualidade = Math.round(pontuacao / 10); // Nota de 0-10
  this.ranking.eficienciaOperacional = Math.round(pontuacao);

  return this.ranking.pontuacaoTotal;
};

lojaDailyMetricsSchema.methods.atualizarTotais = function () {
  this.totais.totalItens =
    this.etiquetas.totalItens +
    this.rupturas.totalItens +
    this.presencas.totalItens;

  // Usar itensValidos para etiquetas e presencas, e itensLidos para rupturas
  this.totais.itensLidos =
    this.etiquetas.itensValidos +
    this.rupturas.itensLidos +
    this.presencas.itensValidos;

  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensLidos +  // Em rupturas, itensLidos são itens que foram encontrados (com presença e com estoque)
    this.presencas.itensAtualizados;

  // Calcular percentual usando itensLidos como base
  if (this.totais.itensLidos > 0) {
    this.totais.percentualConclusaoGeral =
      (this.totais.itensAtualizados / this.totais.itensLidos) * 100;
  }

  // Calcular usuários ativos únicos (somar em vez de usar max)
  this.totais.usuariosAtivos =
    this.etiquetas.usuariosAtivos +
    this.rupturas.usuariosAtivos +
    this.presencas.usuariosAtivos;

  // Atualizar percentuais restantes
  this.etiquetas.percentualRestante = 100 - this.etiquetas.percentualConclusao;
  this.rupturas.percentualRestante = 100 - this.rupturas.percentualConclusao;
  this.presencas.percentualRestante = 100 - this.presencas.percentualConclusao;

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();
};

// Método para processar auditorias do dia
lojaDailyMetricsSchema.methods.processarAuditorias = function (
  auditorias,
  tipo
) {
  if (!auditorias || auditorias.length === 0) return;

  // Adicionando logs de debug para identificar o problema
  console.log(`📊 Processando ${auditorias.length} auditorias do tipo: ${tipo}`);

  const situacaoMap = new Map();
  const usuariosUnicos = new Set();
  const classesMap = new Map();
  const locaisMap = new Map();

  // Contar situações, usuários, classes e locais
  auditorias.forEach((auditoria) => {
    const situacao = auditoria.situacao || auditoria.Situacao;
    situacaoMap.set(situacao, (situacaoMap.get(situacao) || 0) + 1);

    if (auditoria.usuarioId || auditoria.Usuario) {
      usuariosUnicos.add(auditoria.usuarioId || auditoria.Usuario);
    }

    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (classe) {
      classesMap.set(classe, (classesMap.get(classe) || 0) + 1);
    }

    const local = auditoria.local;
    if (local) {
      locaisMap.set(local, (locaisMap.get(local) || 0) + 1);
    }
  });

  // Log para verificar os dados mapeados
  console.log(`📋 Situações encontradas para ${tipo}:`, Object.fromEntries(situacaoMap));
  console.log(`👥 Usuários únicos: ${usuariosUnicos.size}`);
  console.log(`📊 Classes encontradas:`, Object.fromEntries(classesMap));
  console.log(`📍 Locais encontrados:`, Object.fromEntries(locaisMap));

  if (tipo === "etiquetas") {
    this.etiquetas.totalItens = auditorias.length;
    this.etiquetas.itensAtualizados = situacaoMap.get("Atualizado") || 0;
    this.etiquetas.itensNaolidos =
      situacaoMap.get("Não lidos com estoque") || 0;
    this.etiquetas.itensDesatualizado = situacaoMap.get("Desatualizado") || 0;
    this.etiquetas.itensNaopertence = situacaoMap.get("Lido não pertence") || 0;
    this.etiquetas.itensLidosemestoque =
      situacaoMap.get("Lido sem estoque") || 0;
    this.etiquetas.itensNlidocomestoque =
      situacaoMap.get("Não lidos com estoque") || 0;
    this.etiquetas.itensSemestoque = situacaoMap.get("Sem Estoque") || 0;

    // Calcular itens válidos (itens que podem ser processados)
    // Itens válidos são aqueles que foram:
    // - Atualizados (itens com situação "Atualizado")
    // - Desatualizados (itens lidos mas marcados como desatualizados)
    // - Não lidos com estoque (itens não lidos mas com estoque no sistema)
    // - Lido não pertence (itens lidos mas que não pertencem à loja, também são válidos)
    this.etiquetas.itensValidos =
      this.etiquetas.itensAtualizados +
      this.etiquetas.itensDesatualizado +
      this.etiquetas.itensNaolidos +
      this.etiquetas.itensNaopertence;

    // Calcular percentuais (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itens lidos / itens válidos) * 100
    // Itens lidos = itens atualizados + itens desatualizados
    // Percentual restante = 100 - percentualConclusao (garante soma exata de 100%)
    // Percentual desatualizado = (itens desatualizados / itens válidos) * 100
    if (this.etiquetas.itensValidos > 0) {
      // Para etiquetas: itens lidos = itens atualizados + itens desatualizados
      const itensLidosEtiquetas = this.etiquetas.itensAtualizados + this.etiquetas.itensDesatualizado;
      this.etiquetas.percentualConclusao = (itensLidosEtiquetas / this.etiquetas.itensValidos) * 100;
      // Percentual de itens desatualizados em relação aos itens válidos
      this.etiquetas.percentualDesatualizado = (this.etiquetas.itensDesatualizado / this.etiquetas.itensValidos) * 100;
    } else {
      this.etiquetas.percentualDesatualizado = 0;
    }
    this.etiquetas.percentualRestante =
      100 - this.etiquetas.percentualConclusao;
    this.etiquetas.usuariosAtivos = usuariosUnicos.size;

    // Atualizar contadores
    for (const [classe, count] of classesMap) {
      if (this.etiquetas.contadorClasses.hasOwnProperty(classe)) {
        this.etiquetas.contadorClasses[classe] = count;
      }
    }

    for (const [local, count] of locaisMap) {
      if (this.etiquetas.contadorLocais.hasOwnProperty(local)) {
        this.etiquetas.contadorLocais[local] = count;
      }
    }
  }

  // Implementar lógica similar para rupturas e presenças
  if (tipo === "rupturas") {
    console.log(`🔄 Processando dados de ruptura...`);
    this.rupturas.totalItens = auditorias.length;

    // Calcular itens válidos: itens que podem ser processados
    // Baseado na lógica de ruptura, itens válidos seriam:
    // - itens com situação "Atualizado" (tem presença e tem estoque)
    // - itens com situação "Com problema" (não tem presença mas tem estoque - ausência de produto)
    this.rupturas.itensValidos = (situacaoMap.get("Atualizado") || 0) +
                                 (situacaoMap.get("Com problema") || 0);

    // itensLidos: quantidade de itens com situação "Com Presença e com Estoque"
    // Após normalização, essa situação se torna "Atualizado"
    this.rupturas.itensLidos = situacaoMap.get("Atualizado") || 0;

    // itensNaoLidos: quantidade de itens com situação "Sem Presença e Com Estoque"
    // Após normalização, essa situação se torna "Com problema"
    this.rupturas.itensNaoLidos = situacaoMap.get("Com problema") || 0;

    // custoTotalRuptura: soma do campo custoRuptura para itens com situação "Com problema"
    // A situação "Com problema" vem da normalização de "Sem Presença e Com Estoque"
    const itensRuptura = auditorias.filter(a => a.situacao === "Com problema");

    // Somar os valores de custoRuptura para esses itens
    let custoTotalRuptura = 0;
    for (const item of itensRuptura) {
      const valor = item.custoRuptura || 0;
      if (valor > 0) {
        custoTotalRuptura += valor;
      }
    }
    this.rupturas.custoTotalRuptura = custoTotalRuptura;

    console.log(`📈 Dados de ruptura antes do cálculo: totalItens=${this.rupturas.totalItens}, itensValidos=${this.rupturas.itensValidos}, itensLidos=${this.rupturas.itensLidos}, itensNaoLidos=${this.rupturas.itensNaoLidos}, custoTotalRuptura=${this.rupturas.custoTotalRuptura}`);

    // Calcular percentuais (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itensLidos / itensValidos) * 100
    if (this.rupturas.itensValidos > 0) {
      this.rupturas.percentualConclusao =
        (this.rupturas.itensLidos / this.rupturas.itensValidos) * 100;
      this.rupturas.percentualRestante =
        100 - this.rupturas.percentualConclusao;
    } else {
      this.rupturas.percentualConclusao = 0;
      this.rupturas.percentualRestante = 100;
    }

    this.rupturas.usuariosAtivos = usuariosUnicos.size;

    // Atualizar contadores
    for (const [classe, count] of classesMap) {
      if (this.rupturas.contadorClasses.hasOwnProperty(classe)) {
        this.rupturas.contadorClasses[classe] = count;
      }
    }

    for (const [local, count] of locaisMap) {
      if (this.rupturas.contadorLocais.hasOwnProperty(local)) {
        this.rupturas.contadorLocais[local] = count;
      }
    }

    console.log(`📋 Contadores de classes atualizados para ruptura:`, this.rupturas.contadorClasses);
  }

  if (tipo === "presencas") {
    this.presencas.totalItens = auditorias.length;

    // Calcular itens válidos: itens que podem ser processados
    // Baseado na lógica de presença, itens válidos seriam:
    // - itens com situação "Atualizado" (tem presença e tem estoque)
    // - itens com situação "Com problema" (não tem presença mas tem estoque - ausência de produto)
    this.presencas.itensValidos = (situacaoMap.get("Atualizado") || 0) +
                                  (situacaoMap.get("Com problema") || 0);

    // Calcular itens não lidos: itens com situação "Com problema" (ausência de produto)
    this.presencas.itensNaoLidos = situacaoMap.get("Com problema") || 0;

    // Calcular itens atualizados: itens com situação "Atualizado" (com presença e com estoque)
    this.presencas.itensAtualizados = situacaoMap.get("Atualizado") || 0;

    // Calcular presencas confirmadas: quantidade de itens com as situações:
    // [Com Presença e Com Estoque] + [Com Presença e sem Estoque] + [Lido não pertence]
    // [Com Presença e Com Estoque] → normalizado para "Atualizado"
    // [Lido não pertence] → já está normalizado como "Lido não pertence"
    // [Com Presença e sem Estoque] → pode não estar normalizado, então vamos checar o valor original ou o valor normalizado
    // Para esta situação específica, vamos contar:
    // - Itens com situação "Atualizado" (eram "Com Presença e Com Estoque")
    // - Itens com situação "Lido não pertence"
    // - Itens que poderiam ter sido originalmente "Com Presença e sem Estoque"

    // Contando itens com situação normalizada "Atualizado" e "Lido não pertence"
    const itensAtualizado = situacaoMap.get("Atualizado") || 0;
    const itensLidoNaoPertence = situacaoMap.get("Lido não pertence") || 0;

    // Para "Com Presença e sem Estoque", vamos procurar por possíveis valores normalizados ou originais
    // Pode ser que não esteja normalizado e permaneça com o nome original
    // A situação pode não estar normalizada e permanecer como "Com Presença e sem Estoque"
    const itensComPresencaSemEstoque = situacaoMap.get("Com Presença e sem Estoque") || 0;

    // Fazendo uma soma mais precisa das presenças confirmadas
    this.presencas.presencasConfirmadas = itensAtualizado + itensLidoNaoPertence + itensComPresencaSemEstoque;

    // Calcular custo de ruptura: soma do campo custoRuptura para itens de presença com situação "Com problema" (ausência de produto)
    // A situação "Com problema" vem da normalização de "Sem Presença e Com Estoque"
    const itensRuptura = auditorias.filter(a => a.situacao === "Com problema" && a.tipo === "presenca");

    // Somar os valores de custoRuptura para esses itens
    let custoTotalRuptura = 0;
    for (const item of itensRuptura) {
      const valor = item.custoRuptura || 0;
      if (valor > 0) {
        custoTotalRuptura += valor;
      }
    }
    this.presencas.custoRuptura = custoTotalRuptura;

    // Novo campo: rupturaSemPresenca - calcula o custo de ruptura especificamente para itens com situação original "Sem Presença e Com Estoque"
    // A abordagem é identificar itens com situação normalizada "Com problema" que tinham originalmente "sem presença e com estoque"
    // Vamos tentar uma abordagem mais direta para evitar duplicatas ou somas incorretas
    let rupturaSemPresencaTotal = 0;
    const itensRupturaSemPresenca = auditorias.filter(a => a.situacao === "Com problema" && a.tipo === "presenca");
    for (const item of itensRupturaSemPresenca) {
      const valor = item.custoRuptura || 0;
      if (valor > 0) {
        // Adicionando um log para debug caso seja necessário
        rupturaSemPresencaTotal += valor;
      }
    }
    this.presencas.rupturaSemPresenca = rupturaSemPresencaTotal;

    // Calcular percentual (SEM ARREDONDAMENTO)
    // Percentual de conclusão = (itensAtualizados / itensValidos) * 100
    if (this.presencas.itensValidos > 0) {
      this.presencas.percentualConclusao =
        (this.presencas.itensAtualizados / this.presencas.itensValidos) * 100;
    }
    this.presencas.percentualRestante =
      100 - this.presencas.percentualConclusao;
    this.presencas.usuariosAtivos = usuariosUnicos.size;

    // Atualizar contadores
    for (const [classe, count] of classesMap) {
      if (this.presencas.contadorClasses.hasOwnProperty(classe)) {
        this.presencas.contadorClasses[classe] = count;
      }
    }

    for (const [local, count] of locaisMap) {
      if (this.presencas.contadorLocais.hasOwnProperty(local)) {
        this.presencas.contadorLocais[local] = count;
      }
    }
  }

  console.log(`🔍 Iniciando cálculo de métricas por classe e local para ${tipo}`);
  // Calcular métricas por classe de produto
  this.calcularMetricasPorClasse(auditorias, tipo);

  // Calcular métricas por local
  this.calcularMetricasPorLocal(auditorias, tipo);

  // Atualizar totais após modificação
  this.atualizarTotais();

  console.log(`✅ Processamento de ${tipo} concluído. Totais atualizados.`);
};

// Método para calcular métricas por classe de produto
lojaDailyMetricsSchema.methods.calcularMetricasPorClasse = function (auditorias, tipo) {
  if (!auditorias || auditorias.length === 0) return;

  // Inicializar objeto para armazenar métricas por classe
  const metricasPorClasse = {
    "A CLASSIFICAR": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "ALTO GIRO": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    BAZAR: { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    DIVERSOS: { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    DPH: { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    FLV: { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "LATICINIOS 1": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    LIQUIDA: { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PERECIVEL 1": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PERECIVEL 2": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PERECIVEL 2 B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PERECIVEL 3": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "SECA DOCE": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "SECA SALGADA": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "SECA SALGADA 2": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
  };

  // Processar cada auditoria
  let contadorDebug = 0;
  for (const auditoria of auditorias) {
    // Determinar classe do produto
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (!classe) continue; // Pular se não tiver classe definida

    // Determinar usuário da auditoria (ID e nome)
    const usuarioId = auditoria.usuarioId || auditoria.Usuario;
    const usuarioNome = auditoria.usuarioNome || auditoria.Nome; // Procurar por possíveis campos de nome

    // Verificar se a classe está no objeto de métricas
    if (metricasPorClasse.hasOwnProperty(classe)) {
      const situacao = auditoria.situacao || auditoria.Situacao;

      // Log de debug para as primeiras auditorias
      if (contadorDebug < 5 && (tipo === 'rupturas' || tipo === 'presencas')) {
        console.log(`🔍 [${tipo}] Processando auditoria ${contadorDebug + 1}:`, {
          classe: classe,
          situacao: situacao,
          codigo: auditoria.codigo
        });
        contadorDebug++;
      }

      // Incrementar total (todos os itens)
      metricasPorClasse[classe].total++;

      // Incrementar itens válidos (seguindo mesma lógica de etiquetas.itensValidos)
      // Itens válidos = Atualizado + Desatualizado + Não lidos com estoque + Lido não pertence
      // EXCLUINDO: "Sem Estoque" e "Lido sem estoque"
      if (
        situacao === "Atualizado" ||
        situacao === "Desatualizado" ||
        situacao === "Não lidos com estoque" ||
        situacao === "Lido não pertence"
      ) {
        metricasPorClasse[classe].itensValidos++;
      }

      // Incrementar itens lidos - definição varia por tipo de auditoria
      if (tipo === 'etiquetas') {
        // Para etiquetas: itens lidos = "Atualizado" + "Desatualizado" + "Lido não pertence"
        if (
          situacao === "Atualizado" ||
          situacao === "Desatualizado" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorClasse[classe].lidos++;
        }
      } else if (tipo === 'rupturas') {
        // Para rupturas: itens lidos = "Atualizado" + "Com problema" (itens verificados independentemente do resultado)
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema"
        ) {
          metricasPorClasse[classe].lidos++;
        }
      } else if (tipo === 'presencas') {
        // Para presencas: itens lidos = "Atualizado" + "Com problema" + "Lido não pertence"
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorClasse[classe].lidos++;
        }
      }

      // Incrementar contagem de usuários por classe
      // Usar o nome do usuário como chave e armazenar a contagem
      if (usuarioId) { // Apenas se tiver ID de usuário
        const usuarioChave = usuarioNome || `Usuário ${usuarioId}`; // Usar nome como chave

        if (metricasPorClasse[classe].usuarios[usuarioChave]) {
          // Se o usuário já existe na classe, apenas incrementar os itens lidos
          metricasPorClasse[classe].usuarios[usuarioChave]++;
        } else {
          // Se for a primeira vez do usuário na classe, adicionar com 1 item lido
          metricasPorClasse[classe].usuarios[usuarioChave] = 1;
        }
      }
    }
  }

  // Calcular percentuais e atualizar o campo correspondente
  const classesLeitura = {};
  for (const [classe, valores] of Object.entries(metricasPorClasse)) {
    // CORRIGIDO: Durante o processamento, o que chamamos de "lidos" na verdade são os itensValidos
    // e o que chamamos de "itensValidos" são os lidos. Vamos inverter para salvar corretamente.
    const percentual = valores.lidos > 0 ? (valores.itensValidos / valores.lidos) * 100 : 0;

    // Log de debug para classes com percentual > 100%
    if (percentual > 100) {
      console.log(`⚠️ [${tipo}] ERRO: Percentual > 100% na classe ${classe}:`, {
        total: valores.total,
        itensValidos_interno: valores.itensValidos,
        lidos_interno: valores.lidos,
        percentual: percentual
      });
    }

    classesLeitura[classe] = {
      total: valores.total,
      itensValidos: valores.lidos,  // CORRIGIDO: lidos (interno) vai para itensValidos (salvo)
      lidos: valores.itensValidos,  // CORRIGIDO: itensValidos (interno) vai para lidos (salvo)
      percentual: percentual,
      usuarios: valores.usuarios,
    };
  }

  // Atualizar os campos na estrutura correta para o tipo de auditoria
  if (tipo === 'etiquetas') {
    // Garantir que o objeto esteja completamente atualizado
    this.etiquetas.classesLeitura = JSON.parse(JSON.stringify(classesLeitura));
  } else if (tipo === 'rupturas') {
    // Garantir que o objeto esteja completamente atualizado
    console.log(`📊 Atualizando classesLeitura para rupturas:`, JSON.stringify(classesLeitura, null, 2));
    this.rupturas.classesLeitura = JSON.parse(JSON.stringify(classesLeitura));
    console.log(`✅ classesLeitura para rupturas atualizadas. Total de classes: ${Object.keys(this.rupturas.classesLeitura).length}`);
  } else if (tipo === 'presencas') {
    // Garantir que o objeto esteja completamente atualizado
    this.presencas.classesLeitura = JSON.parse(JSON.stringify(classesLeitura));
  }
};

// Método para calcular métricas por local (corredor)
lojaDailyMetricsSchema.methods.calcularMetricasPorLocal = function (auditorias, tipo) {
  if (!auditorias || auditorias.length === 0) return;

  // Inicializar objeto para armazenar métricas por local
  const metricasPorLocal = {
    "C01 - C01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "CS01 - CS01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "F01 - F01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "F02 - F02": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "FLV - FLV": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G01A - G01A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G01B - G01B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G02A - G02A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G02B - G02B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G03A - G03A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G03B - G03B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G04A - G04A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G04B - G04B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G05A - G05A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G05B - G05B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G06A - G06A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G06B - G06B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G07A - G07A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G07B - G07B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G08A - G08A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G08B - G08B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G09A - G09A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G09B - G09B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G10A - G10A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G10B - G10B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G11A - G11A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G11B - G11B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G12A - G12A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G12B - G12B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G13A - G13A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G13B - G13B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G14A - G14A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G14B - G14B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G15A - G15A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G15B - G15B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G16A - G16A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G16B - G16B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G17A - G17A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G17B - G17B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G18A - G18A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G18B - G18B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G19A - G19A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G19B - G19B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G20A - G20A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G20B - G20B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G21A - G21A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G21B - G21B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G22A - G22A": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "G22B - G22B": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "GELO - GELO": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "I01 - I01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PA01 - PA01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PAO - PAO": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PF01 - PF01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PF02 - PF02": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PF03 - PF03": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PL01 - PL01": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "PL02 - PL02": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
    "SORVETE - SORVETE": { total: 0, itensValidos: 0, lidos: 0, usuarios: {} },
  };

  // Processar cada auditoria
  for (const auditoria of auditorias) {
    // Determinar local do produto
    const local = auditoria.local;
    if (!local) continue; // Pular se não tiver local definido

    // Determinar usuário da auditoria (ID e nome)
    const usuarioId = auditoria.usuarioId || auditoria.Usuario;
    const usuarioNome = auditoria.usuarioNome || auditoria.Nome; // Procurar por possíveis campos de nome
    if (!usuarioId) continue; // Pular se não tiver ID de usuário definido

    // Verificar se o local está no objeto de métricas
    if (metricasPorLocal.hasOwnProperty(local)) {
      const situacao = auditoria.situacao || auditoria.Situacao;

      // Incrementar total (todos os itens)
      metricasPorLocal[local].total++;

      // Incrementar itens válidos (seguindo mesma lógica de etiquetas.itensValidos)
      // Itens válidos = Atualizado + Desatualizado + Não lidos com estoque + Lido não pertence
      // EXCLUINDO: "Sem Estoque" e "Lido sem estoque"
      if (
        situacao === "Atualizado" ||
        situacao === "Desatualizado" ||
        situacao === "Não lidos com estoque" ||
        situacao === "Lido não pertence"
      ) {
        metricasPorLocal[local].itensValidos++;
      }

      // Incrementar itens lidos - definição varia por tipo de auditoria
      if (tipo === 'etiquetas') {
        // Para etiquetas: itens lidos = "Atualizado" + "Desatualizado" + "Lido não pertence"
        if (
          situacao === "Atualizado" ||
          situacao === "Desatualizado" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorLocal[local].lidos++;
        }
      } else if (tipo === 'rupturas') {
        // Para rupturas: itens lidos = "Atualizado" + "Com problema" (itens verificados independentemente do resultado)
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema"
        ) {
          metricasPorLocal[local].lidos++;
        }
      } else if (tipo === 'presencas') {
        // Para presencas: itens lidos = "Atualizado" + "Com problema" + "Lido não pertence"
        if (
          situacao === "Atualizado" ||
          situacao === "Com problema" ||
          situacao === "Lido não pertence"
        ) {
          metricasPorLocal[local].lidos++;
        }
      }

      // Incrementar contagem de usuários
      // Usar o nome do usuário como chave e armazenar a contagem
      const usuarioChave = usuarioNome || `Usuário ${usuarioId}`; // Usar nome como chave

      if (metricasPorLocal[local].usuarios[usuarioChave]) {
        // Se o usuário já existe no local, apenas incrementar os itens lidos
        metricasPorLocal[local].usuarios[usuarioChave]++;
      } else {
        // Se for a primeira vez do usuário no local, adicionar com 1 item lido
        metricasPorLocal[local].usuarios[usuarioChave] = 1;
      }
    }
  }

  // Calcular percentuais e atualizar o campo correspondente
  const locaisLeitura = {};
  for (const [local, valores] of Object.entries(metricasPorLocal)) {
    // CORRIGIDO: Durante o processamento, o que chamamos de "lidos" na verdade são os itensValidos
    // e o que chamamos de "itensValidos" são os lidos. Vamos inverter para salvar corretamente.
    const percentual = valores.lidos > 0 ? (valores.itensValidos / valores.lidos) * 100 : 0;

    locaisLeitura[local] = {
      total: valores.total,
      itensValidos: valores.lidos,  // CORRIGIDO: lidos (interno) vai para itensValidos (salvo)
      lidos: valores.itensValidos,  // CORRIGIDO: itensValidos (interno) vai para lidos (salvo)
      percentual: percentual,
      usuarios: valores.usuarios,
    };
  }

  // Atualizar os campos na estrutura correta para o tipo de auditoria
  if (tipo === 'etiquetas') {
    // Garantir que o objeto esteja completamente atualizado
    this.etiquetas.locaisLeitura = JSON.parse(JSON.stringify(locaisLeitura));
  } else if (tipo === 'rupturas') {
    // Garantir que o objeto esteja completamente atualizado
    console.log(`📍 Atualizando locaisLeitura para rupturas:`, JSON.stringify(locaisLeitura, null, 2));
    this.rupturas.locaisLeitura = JSON.parse(JSON.stringify(locaisLeitura));
    console.log(`✅ locaisLeitura para rupturas atualizadas. Total de locais: ${Object.keys(this.rupturas.locaisLeitura).length}`);
  } else if (tipo === 'presencas') {
    // Garantir que o objeto esteja completamente atualizado
    this.presencas.locaisLeitura = JSON.parse(JSON.stringify(locaisLeitura));
  }
};

export default mongoose.model("LojaDailyMetrics", lojaDailyMetricsSchema);
