# Single-stage Dockerfile for direct TypeScript execution
FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
# Expose port
EXPOSE 3001

CMD [ "npm", "start" ]
 