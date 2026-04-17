FROM node:20-alpine

WORKDIR /app

# Copy package files (will exist after project init)
COPY package*.json ./

RUN npm install 2>/dev/null || true

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
