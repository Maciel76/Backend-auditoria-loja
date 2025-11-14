#!/bin/bash

echo "🔄 Reiniciando servidor backend..."
echo ""

# Parar qualquer processo node rodando
echo "1️⃣ Parando processos node existentes..."
pkill -9 -f "node.*server" 2>/dev/null
pkill -9 node 2>/dev/null
sleep 2

# Verificar se a porta 3000 está livre
echo "2️⃣ Verificando porta 3000..."
PORT_CHECK=$(lsof -i:3000 2>/dev/null || true)
if [ -n "$PORT_CHECK" ]; then
  echo "⚠️  Porta 3000 ainda ocupada! Tentando liberar..."
  fuser -k 3000/tcp 2>/dev/null || true
  sleep 1
fi

# Navegar até o diretório do backend
cd "/mnt/c/Users/Maciel Ribeiro/Desktop/Projetos/backoff/backend"

echo "3️⃣ Iniciando servidor..."
echo ""
node server.js
