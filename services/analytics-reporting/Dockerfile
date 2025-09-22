FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN chown -R node:node /app

EXPOSE 3004

USER node

CMD ["npm", "start"]