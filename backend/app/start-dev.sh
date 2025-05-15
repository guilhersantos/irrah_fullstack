#!/bin/bash

# Instalar dependências se necessário
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.yarn-integrity" ]; then
  echo "Instalando dependências..."
  yarn install
fi


# Iniciar o servidor em modo de desenvolvimento
echo "Iniciando servidor Backend no modo desenvolvimento..."
yarn start:dev
#tail -f /dev/null