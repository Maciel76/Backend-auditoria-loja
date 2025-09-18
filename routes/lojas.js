// routes/lojas.js
import express from "express";
const router = express.Router();

const lojas = [
  { codigo: "056", nome: "Loja 056 - Goiania Burits" },
  { codigo: "084", nome: "Loja 084 - Goiania Independência " },
  { codigo: "105", nome: "Loja 105 - T9" },
  { codigo: "111", nome: "Loja 111 - Rio Verde" },
  { codigo: "140", nome: "Loja 140 - Perimetral" },
  { codigo: "214", nome: "Loja 214 - Caldas Novas" },
  { codigo: "176", nome: "Loja 176 - Palmas Teotônio" },
  { codigo: "194", nome: "Loja 194 - Anápolis" },
  { codigo: "310", nome: "Loja 310 - Portugal " },
  { codigo: "320", nome: "Loja 320 - Palmas cesamar " },
  // ... outras lojas
];

router.get("/lojas", (req, res) => {
  res.json(lojas);
});

router.post("/selecionar-loja", (req, res) => {
  const { codigo } = req.body;
  req.session.loja = codigo;
  res.json({ success: true, loja: codigo });
});

export default router;
