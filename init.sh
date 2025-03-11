#!/bin/bash

# Initialize Smart Contract Audit Platform Project
echo "Initializing Smart Contract Audit Platform project structure..."

# Create shared directories
mkdir -p sample-contracts
mkdir -p shared-config

# Create component directories if they don't exist
for dir in frontend backend analysis-engine compliance-checker reports-service ai-detector; do
    if [ ! -d "$dir" ]; then
        echo "Creating $dir directory..."
        mkdir -p $dir
    fi
done

# Copy sample contract to sample-contracts
echo "Setting up sample contract..."
cp SampleToken.sol sample-contracts/ 2>/dev/null || echo "Sample contract already exists"

# Create individual Dockerfiles for each component
echo "Creating Docker configurations..."

# Backend Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
EOF

# Frontend Dockerfile
cat > frontend/Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Analysis Engine Dockerfile
cat > analysis-engine/Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
EOF

# Compliance Checker Dockerfile
cat > compliance-checker/Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5002
CMD ["npm", "start"]
EOF

# Reports Service Dockerfile
cat > reports-service/Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5003
CMD ["npm", "start"]
EOF

# AI Detector Dockerfile
cat > ai-detector/Dockerfile << 'EOF'
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5004
CMD ["python", "src/main.py"]
EOF

# Create a docker-compose.yml file for orchestration
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - smart-contract-audit-network

  backend:
    build: ./backend
    container_name: backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    networks:
      - smart-contract-audit-network

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - smart-contract-audit-network

  analysis-engine:
    build: ./analysis-engine
    container_name: analysis-engine
    ports:
      - "5001:5001"
    depends_on:
      - backend
    networks:
      - smart-contract-audit-network

  compliance-checker:
    build: ./compliance-checker
    container_name: compliance-checker
    ports:
      - "5002:5002"
    depends_on:
      - backend
    networks:
      - smart-contract-audit-network

  reports-service:
    build: ./reports-service
    container_name: reports-service
    ports:
      - "5003:5003"
    depends_on:
      - backend
    networks:
      - smart-contract-audit-network

  ai-detector:
    build: ./ai-detector
    container_name: ai-detector
    ports:
      - "5004:5004"
    depends_on:
      - backend
    networks:
      - smart-contract-audit-network

networks:
  smart-contract-audit-network:
    driver: bridge

volumes:
  mongodb_data:
EOF

# Create sample .env file for shared config
cat > shared-config/.env.example << 'EOF'
# API Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smart-contract-audit

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Blockchain
INFURA_API_KEY=your_infura_api_key
ALCHEMY_API_KEY=your_alchemy_api_key

# Service Endpoints
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
ANALYSIS_ENGINE_URL=http://localhost:5001
COMPLIANCE_CHECKER_URL=http://localhost:5002
REPORTS_SERVICE_URL=http://localhost:5003
AI_DETECTOR_URL=http://localhost:5004
EOF

# Make setup scripts executable
chmod +x setup.sh
chmod +x init.sh

echo "Project structure initialized successfully!"
echo "Next steps:"
echo "1. Run './setup.sh' to set up your development environment"
echo "2. Start developing individual components or use docker-compose to start all services"