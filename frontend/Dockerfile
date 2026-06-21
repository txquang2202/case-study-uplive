# 1. Upgrade to a modern, actively patched Node LTS version
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apk update && apk upgrade --no-cache

COPY . .

RUN npm run build

EXPOSE 3000

# 4. Use production runtime if deploying (reduces devDependency vulnerability surface)
CMD ["npm", "run", "start"]