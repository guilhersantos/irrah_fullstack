FROM node:22-slim

# Criar diretórios e definir permissões
RUN mkdir -p /home/node /home/node/.cache /home/node/.yarn /home/node/node_modules \
    && chown -R node:node /home/node && chown -R node:node /home/node/node_modules

USER node

WORKDIR /home/node/

# Ajustar permissões e criar diretório de trabalho
COPY --chown=node:node start-dev.sh /home/node/start-dev.sh

RUN chmod +x /home/node/start-dev.sh

# Comando para desenvolvimento
CMD ["/home/node/start-dev.sh"]