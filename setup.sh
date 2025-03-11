#!/bin/bash

# Smart Contract Audit Platform Setup Script
echo "Setting up Smart Contract Audit Platform..."

# Check for Node.js and npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Node.js and npm are required but not installed. Please install them first."
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install it first."
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is required but not installed. Please install it first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Create shared directories
mkdir -p sample-contracts
mkdir -p shared-config

# Copy sample contract
cp SampleToken.sol sample-contracts/ 2>/dev/null || echo "Sample contract already exists"

# Configure each component
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Setting up backend..."
cd backend
npm install
cd ..

echo "Setting up analysis-engine..."
cd analysis-engine
npm install
cd ..

echo "Setting up compliance-checker..."
cd compliance-checker
npm install
cd ..

echo "Setting up reports-service..."
cd reports-service
npm install
cd ..

# Set up Python virtual environment for AI module
echo "Setting up Python environment for AI module..."
cd ai-detector
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Set up environment variables for each component
echo "Setting up environment variables..."
for dir in backend frontend analysis-engine compliance-checker reports-service ai-detector; do
    if [ ! -f "$dir/.env" ]; then
        echo "Creating .env file for $dir..."
        cp shared-config/.env.example $dir/.env 2>/dev/null || 
        echo "PORT=500$RANDOM\nMONGODB_URI=mongodb://localhost:27017/smart-contract-audit\nJWT_SECRET=your_jwt_secret_key_here\nNODE_ENV=development" > $dir/.env
    fi
done

# Set up MongoDB (optional)
read -p "Do you want to set up a local MongoDB instance using Docker? (y/n) " setup_mongo
if [ "$setup_mongo" = "y" ]; then
    echo "Setting up MongoDB with Docker..."
    docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=securepassword mongo:latest
    echo "MongoDB is running at mongodb://root:securepassword@localhost:27017"
    echo "Update your .env files with this connection string if needed."
fi

# Set up Docker networks
read -p "Do you want to create a Docker network for component communication? (y/n) " setup_network
if [ "$setup_network" = "y" ]; then
    echo "Creating Docker network..."
    docker network create smart-contract-audit-network
    echo "Docker network created. Make sure to connect your containers to this network."
fi

# Install Solidity compiler and development tools
read -p "Do you want to install Ethereum development tools (solc, truffle, etc.)? (y/n) " install_eth_tools
if [ "$install_eth_tools" = "y" ]; then
    echo "Installing Ethereum development tools..."
    npm install -g solc truffle hardhat ganache-cli
    echo "Ethereum development tools installed."
fi

echo "Environment setup completed successfully!"
echo
echo "To start individual components:"
echo "- Frontend: cd frontend && npm start"
echo "- Backend: cd backend && npm start"
echo "- Analysis Engine: cd analysis-engine && npm start"
echo "- Compliance Checker: cd compliance-checker && npm start"
echo "- Reports Service: cd reports-service && npm start"
echo "- AI Detector: cd ai-detector && source venv/bin/activate && python src/main.py"
echo
echo "Happy coding!"