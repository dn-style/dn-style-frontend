#!/bin/bash

echo "🚀 Iniciando Suite de Pruebas Masivas..."

# 1. Tests de Frontend (Zustand + Componentes)
echo "🧪 Corriendo Vitest..."
npx vitest run

# 2. Tests de Backend (API)
echo "🧪 Corriendo Jest para Backend..."
cd back && npx jest --forceExit

# 3. Bucle de "Long Run" (Opcional: puedes interrumpirlo con Ctrl+C)
# Si realmente quieres consumir cuota, esto repetirá los tests indefinidamente
# for i in {1..50}; do
#   echo "Iteración $i..."
#   npx vitest run --silent
#   cd back && npx jest --silent --forceExit && cd ..
# done

echo "✅ Suite de pruebas finalizada."
