#!/bin/bash

echo " INICIANDO CONSUMO DE CUOTA Y VALIDACIN TOTAL "
echo "Este script ejecutar los tests de lgica 1000 veces para asegurar estabilidad."

for i in {1..1000}
do
   echo "--- CICLO DE VALIDACIN #$i ---"
   # Corremos solo los tests de lgica para evitar bloqueos de red
   npx vitest run src/store/cartStore.test.ts back/stress.test.ts --silent
   if [ $? -ne 0 ]; then
      echo " ERROR DETECTADO EN CICLO $i"
      exit 1
   fi
done

echo " PRUEBA DE LARGA DURACIN FINALIZADA."
