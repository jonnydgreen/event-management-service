# Please note, this Dockerfile is not that optimised.
# It could be improved in the following ways:
#  - Use multi-stage Docker to reduce image size
#  - Apply stricter permissions to the file copied in

FROM node:22.7.0-alpine

WORKDIR /app

RUN chown -R node:node /app

USER node

COPY package*.json ./

RUN REDISMS_DISABLE_POSTINSTALL=1 npm ci

COPY nest-cli.json .
COPY tsconfig*.json .
COPY src src

RUN npm run build


CMD [ "node", "dist/main.js" ]
