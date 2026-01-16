FROM node:25-alpine AS deps
WORKDIR /app
RUN npm i -g pnpm@10.13.1
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile=false

FROM node:25-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm@10.13.1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
