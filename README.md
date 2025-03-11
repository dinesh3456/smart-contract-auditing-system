# Smart Contract Security Audit Platform

An automated platform for auditing and analyzing smart contracts for security vulnerabilities, standard compliance, and gas optimization.

## Features

- **Automated Security Scanner**: Detect vulnerabilities such as reentrancy attacks, integer overflows, access control flaws, and gas inefficiencies.
- **AI-Powered Anomaly Detection**: Identify suspicious contract behavior using machine learning.
- **Compliance Checker**: Ensure contracts adhere to ERC-20, ERC-721, and other blockchain standards.
- **Audit Report Generator**: Generate comprehensive reports outlining security risks, optimization suggestions, and compliance status.
- **User Dashboard**: Web-based platform to upload contracts, view audit results, and download reports.

## Architecture

The platform consists of several microservices:

- **Frontend**: React.js web application
- **Backend API**: Node.js/Express REST API
- **Analysis Engine**: Smart contract vulnerability scanner
- **Compliance Checker**: Standards compliance verification
- **AI Detector**: Machine learning-based anomaly detection
- **Reports Service**: Report generation and management

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Python 3.8+
- MongoDB
- Docker and Docker Compose (optional)

### Installation

Clone the repository:

```bash
git clone https://github.com/dinesh3456/smart-contract-auditing-system.git
cd smart-contract-auditing-system
```

Install dependencies:

```bash
npm run install:all
```

Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

Start all services in development mode:

```bash
npm run start
```

Or start individual services:

```bash
npm run dev:frontend
npm run dev:backend
```

### Docker Deployment

Build and start containers:

```bash
docker-compose up -d
```

Stop containers:

```bash
docker-compose down
```

## Usage

1. Access the web interface at `http://localhost:3000`
2. Upload a smart contract for analysis
3. Review the security scan results
4. Download the comprehensive audit report

## API Documentation

API endpoints are documented using Swagger and available at `http://localhost:5000/api-docs` when the backend is running.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
