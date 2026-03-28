#!/bin/bash
# Script para iniciar o Sistema Barbearia Biehl
echo "======================================"
echo " Iniciando Sistema Barbearia Biehl..."
echo "======================================"

# Iniciar banco de dados PostgreSQL
echo "▶ Iniciando banco de dados..."
service postgresql start 2>/dev/null || pg_ctlcluster 16 main start 2>/dev/null
sleep 2

# Iniciar servidor Next.js
echo "▶ Iniciando servidor..."
cd "$(dirname "$0")"
DATABASE_URL="postgresql://barbearia:barbearia123@localhost:5432/barbearia_biehl" npm run dev &

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "Acesse no navegador: http://localhost:3000"
echo ""
echo "Login:"
echo "  E-mail: admin@barbearia.com"
echo "  Senha:  Admin@123"
echo ""
echo "(Aguarde alguns segundos antes de abrir o navegador)"
echo ""
