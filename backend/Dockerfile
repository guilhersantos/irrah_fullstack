FROM node:22-slim

# Criar diretórios e definir permissões
RUN mkdir -p /home/node /home/node/.cache /home/node/.yarn /home/node/app/node_modules \
    && chown -R node:node /home/node && chown -R node:node /home/node/app/node_modules

USER node

WORKDIR /home/node/app

COPY --chown=node:node . /home/node/

RUN chmod +x /home/node/app/start-dev.sh

# Ajustar permissões e criar diretório de trabalho
#COPY --chown=node:node start-dev.sh /home/node/app/start-dev.sh


# Comando para desenvolvimento
CMD ["/home/node/app/start-dev.sh"]