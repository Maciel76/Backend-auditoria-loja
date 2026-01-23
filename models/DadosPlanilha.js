/**
 * MODELO: DadosPlanilha
 * OBSERVAÇÃO: Este modelo é um esquema genérico (strict: false) usado internamente
 * para armazenar dados de planilhas sem um formato fixo. Não possui endpoints próprios.
 */

import mongoose from "mongoose";

const DadosPlanilhaSchema = new mongoose.Schema({}, { strict: false });

const DadosPlanilha = mongoose.model("DadosPlanilha", DadosPlanilhaSchema);

export default DadosPlanilha;
