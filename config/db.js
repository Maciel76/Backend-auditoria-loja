import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const conectarBanco = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/meubanco"
    );
    console.log("Conectado ao MongoDB Atlas");
  } catch (error) {
    console.error("Erro ao conectar com MongoDB:", error);
    process.exit(1);
  }
};

export default conectarBanco;
