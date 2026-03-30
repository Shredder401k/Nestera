# Nestera API Documentation

## Overview

Nestera API provides comprehensive endpoints for managing savings accounts, goals, and blockchain interactions on the Stellar network.

## API Versions

- **v1** (Deprecated): Sunset date 2026-09-01
- **v2** (Current): Stable production version

## Base URL

```
https://api.nestera.io/api/v2
```

## Authentication

All endpoints (except public ones) require Bearer token authentication:

```bash
Authorization: Bearer <JWT_TOKEN>
```

### Obtaining a Token

```bash
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "BadRequestException",
  "timestamp": "2026-03-30T04:57:29.140Z",
  "path": "/api/v2/savings/goals"
}
```

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Correlation IDs

Every request includes a unique correlation ID for tracing:

```
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

This ID is included in all responses and logs for debugging purposes.

## Rate Limiting

Rate limits are applied per endpoint:

- **Default**: 100 requests/minute
- **Auth**: 5 requests/15 minutes
- **RPC**: 10 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648627200
```

## Endpoints

### Savings Goals

#### Create Goal

```bash
POST /api/v2/savings/goals
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "goalName": "Emergency Fund",
  "targetAmount": 10000,
  "targetDate": "2026-12-31T00:00:00.000Z",
  "metadata": {
    "imageUrl": "https://cdn.nestera.io/goals/emergency.jpg",
    "iconRef": "shield-icon",
    "color": "#EF4444"
  }
}
```

Response (201):
```json
{
  "id": "goal_123abc",
  "userId": "user_456def",
  "goalName": "Emergency Fund",
  "targetAmount": 10000,
  "currentAmount": 0,
  "targetDate": "2026-12-31T00:00:00.000Z",
  "status": "active",
  "createdAt": "2026-03-30T04:57:29.140Z",
  "updatedAt": "2026-03-30T04:57:29.140Z"
}
```

#### Get Goals

```bash
GET /api/v2/savings/goals
Authorization: Bearer <TOKEN>
```

Response (200):
```json
{
  "data": [
    {
      "id": "goal_123abc",
      "goalName": "Emergency Fund",
      "targetAmount": 10000,
      "currentAmount": 2500,
      "progress": 25,
      "targetDate": "2026-12-31T00:00:00.000Z",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### Health Checks

#### Full Health Check

```bash
GET /api/v2/health
```

Response (200):
```json
{
  "status": "ok",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": "45ms"
    },
    "database_pool": {
      "status": "up",
      "metrics": {
        "activeConnections": 5,
        "idleConnections": 15,
        "utilizationPercentage": 25
      }
    },
    "rpc": {
      "status": "up",
      "responseTime": "120ms"
    }
  }
}
```

#### Liveness Probe

```bash
GET /api/v2/health/live
```

Response (200):
```json
{
  "status": "ok",
  "timestamp": "2026-03-30T04:57:29.140Z",
  "uptime": 3600.5
}
```

### Admin - Circuit Breaker

#### Get All Metrics

```bash
GET /api/v2/admin/circuit-breaker/metrics
Authorization: Bearer <ADMIN_TOKEN>
```

Response (200):
```json
{
  "RPC-soroban-testnet.stellar.org": {
    "state": "CLOSED",
    "failureCount": 0,
    "successCount": 150,
    "totalRequests": 150,
    "failureRate": 0
  }
}
```

#### Manually Open Circuit Breaker

```bash
POST /api/v2/admin/circuit-breaker/RPC-soroban-testnet.stellar.org/open
Authorization: Bearer <ADMIN_TOKEN>
```

Response (200):
```json
{
  "message": "Circuit breaker RPC-soroban-testnet.stellar.org manually opened"
}
```

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.nestera.io/api/v2',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Correlation-ID': generateUUID(),
  },
});

// Create a goal
const response = await client.post('/savings/goals', {
  goalName: 'Emergency Fund',
  targetAmount: 10000,
  targetDate: '2026-12-31T00:00:00.000Z',
});

console.log(response.data);
```

### Python

```python
import requests
import uuid

headers = {
    'Authorization': f'Bearer {token}',
    'X-Correlation-ID': str(uuid.uuid4()),
}

response = requests.post(
    'https://api.nestera.io/api/v2/savings/goals',
    json={
        'goalName': 'Emergency Fund',
        'targetAmount': 10000,
        'targetDate': '2026-12-31T00:00:00.000Z',
    },
    headers=headers,
)

print(response.json())
```

### cURL

```bash
curl -X POST https://api.nestera.io/api/v2/savings/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "goalName": "Emergency Fund",
    "targetAmount": 10000,
    "targetDate": "2026-12-31T00:00:00.000Z"
  }'
```

## Postman Collection

Download the Postman collection:

```bash
GET /api/postman/collection/v2
```

This endpoint returns a JSON file that can be imported into Postman for interactive API testing.

## Logging and Debugging

### Request/Response Logging

All requests and responses are logged with correlation IDs. Access logs via:

```bash
# View recent logs
docker logs nestera-api | grep "CORRELATION_ID"

# Filter by correlation ID
docker logs nestera-api | grep "550e8400-e29b-41d4-a716-446655440000"
```

### Connection Pool Metrics

Monitor database connection pool health:

```bash
GET /api/v2/admin/connection-pool/metrics
Authorization: Bearer <ADMIN_TOKEN>
```

Response:
```json
{
  "activeConnections": 5,
  "idleConnections": 15,
  "waitingRequests": 0,
  "totalConnections": 20,
  "utilizationPercentage": 25,
  "timestamp": "2026-03-30T04:57:29.140Z"
}
```

## Support

For API support, contact: api-support@nestera.io

## Changelog

### v2.0.0 (Current)
- Added comprehensive API documentation
- Implemented connection pooling optimization
- Added request/response logging with correlation IDs
- Implemented circuit breaker for RPC calls
- Added Postman collection export

### v1.0.0 (Deprecated)
- Initial API release
- Sunset: 2026-09-01
