# Build stage
FROM node:20-slim as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Running vite build without TypeScript checks
RUN npm run build

# Production stage
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]