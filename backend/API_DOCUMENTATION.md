# Smart Contract Audit Platform API Documentation

## Overview

The Smart Contract Audit Platform API provides endpoints for uploading, analyzing, and generating reports for smart contracts. This document outlines the available endpoints, request/response formats, and authentication requirements.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT (JSON Web Token).

To authenticate requests, include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### Health Check

#### GET /health

Check if the API is running.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2023-12-15T12:34:56.789Z",
  "service": "smart-contract-audit-api",
  "database": "connected"
}
```

#### GET /health/services

Check the health of all services in the platform.

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2023-12-15T12:34:56.789Z",
  "services": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 0
    },
    {
      "name": "analysis-engine",
      "status": "healthy",
      "responseTime": 42
    },
    {
      "name": "ai-detector",
      "status": "healthy",
      "responseTime": 78
    },
    {
      "name": "reports-service",
      "status": "healthy",
      "responseTime": 35
    }
  ]
}
```

### User Management

#### POST /users/register

Register a new user.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "company": "Acme Inc"
}
```

**Response**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Inc"
  }
}
```

#### POST /users/login

Authenticate user and get a JWT token.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Inc"
  }
}
```

#### GET /users/profile

Get the current user's profile.

**Response**:

```json
{
  "success": true,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Inc",
    "createdAt": "2023-12-01T10:22:34.567Z"
  }
}
```

#### PUT /users/profile

Update the current user's profile.

**Request Body**:

```json
{
  "name": "John Smith",
  "company": "New Company Ltd"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "name": "John Smith",
    "company": "New Company Ltd"
  }
}
```

#### POST /users/logout

Logout the current user (client-side token invalidation).

**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Contract Management

#### POST /contracts/upload

Upload a new smart contract for auditing.

**Request**:

- Content-Type: multipart/form-data
- Fields:
  - contract: (file) The Solidity contract file
  - name: (optional) Contract name
  - version: (optional) Contract version
  - description: (optional) Contract description

**Response**:

```json
{
  "success": true,
  "message": "Contract uploaded successfully",
  "contract": {
    "id": "60d21b4667d0d8992e610c86",
    "name": "TokenContract",
    "version": "1.0.0",
    "description": "A sample ERC20 token",
    "uploadedAt": "2023-12-15T13:45:22.123Z"
  }
}
```

#### GET /contracts

Get all contracts for the authenticated user.

**Query Parameters**:

- page: Page number (default: 1)
- limit: Results per page (default: 10)

**Response**:

```json
{
  "success": true,
  "contracts": [
    {
      "id": "60d21b4667d0d8992e610c86",
      "name": "TokenContract",
      "version": "1.0.0",
      "description": "A sample ERC20 token",
      "status": "analyzed",
      "uploadedAt": "2023-12-15T13:45:22.123Z"
    },
    {
      "id": "60d21b4667d0d8992e610c87",
      "name": "NFTContract",
      "version": "0.9.0",
      "description": "A sample ERC721 NFT",
      "status": "uploaded",
      "uploadedAt": "2023-12-15T14:30:10.456Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

#### GET /contracts/:id

Get a specific contract by ID.

**Response**:

```json
{
  "success": true,
  "contract": {
    "id": "60d21b4667d0d8992e610c86",
    "name": "TokenContract",
    "version": "1.0.0",
    "description": "A sample ERC20 token",
    "status": "analyzed",
    "sourceCode": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract TokenContract { ... }",
    "uploadedAt": "2023-12-15T13:45:22.123Z",
    "lastAnalyzed": "2023-12-15T13:50:45.678Z"
  }
}
```
