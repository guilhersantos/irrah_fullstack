#!/bin/bash

# Instalar dependências se necessário
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.yarn-integrity" ]; then
    echo "Instalando dependências..."
    cd app
    yarn install
fi


# Iniciar o servidor em modo de desenvolvimento
echo "Iniciando Frontend no modo desenvolvimento"
yarn dev
#tail -f /dev/null