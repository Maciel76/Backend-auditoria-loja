import mongoose from "mongoose";

const DadosPlanilhaSchema = new mongoose.Schema({}, { strict: false });

const DadosPlanilha = mongoose.model("DadosPlanilha", DadosPlanilhaSchema);

export default DadosPlanilha;
