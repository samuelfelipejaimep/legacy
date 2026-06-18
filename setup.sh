#!/bin/bash
set -e

echo ""
echo "⬡ LEGACY — Setup"
echo "═════════════════════════════════"
echo ""

# Check .env exists
if [ ! -f ".env.local" ]; then
  echo "⚠  Copia .env.example a .env.local y configura tus variables antes de continuar."
  echo "   cp .env.example .env.local"
  exit 1
fi

echo "📦 Instalando dependencias..."
npm install

echo ""
echo "🔧 Generando Prisma client..."
npx prisma generate

echo ""
echo "🗃  Creando tablas en la base de datos..."
npx prisma db push

echo ""
echo "🌱 Sembrando categorías..."
npx ts-node --project tsconfig.json prisma/seed.ts

echo ""
echo "═════════════════════════════════"
echo "✅ LEGACY está listo."
echo ""
echo "Inicia el servidor:"
echo "  npm run dev"
echo ""
echo "Abre: http://localhost:3000"
echo ""
