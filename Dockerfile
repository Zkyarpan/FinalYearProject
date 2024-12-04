FROM node:20-alpine

RUN npm install -g pnpm

RUN mkdir -p /app
WORKDIR /app

COPY . .

RUN pnpm install

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
