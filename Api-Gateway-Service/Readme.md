# API Gateway Service

A lightweight API Gateway built with Spring Cloud Gateway (MVC) for routing requests to microservices with JWT-based authentication.

## Tech Stack
- Java 17
- Spring Boot 4
- Spring Cloud Gateway Server WebMVC
- Spring Security
- Eureka Client + Spring Cloud LoadBalancer
- JJWT (`io.jsonwebtoken`)
- Maven

## Key Features
- Centralized routing for `auth` and `videos` services
- Service discovery with Eureka
- Load-balanced service calls (`lb://`)
- JWT authentication filter for protected APIs
- CORS enabled for frontend integration

## Routes

### Public Routes
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /videos/fetch`

### Private Routes
- `POST /videos/upload`
- Any non-public route requires authentication

## Basic Setup

### 1. Set environment variables
```bash
EUREKA_SERVER_URL=http://localhost:8761/eureka
JWT_SECRET=your-secret-key
```

### 2. Run the gateway
```bash
./mvnw spring-boot:run
```

PowerShell:
```powershell
.\mvnw.cmd spring-boot:run
```

### 3. Default URL
```text
http://localhost:8765
```

## Security (JWT)
- Send token in header: `Authorization: Bearer <token>`
- Public endpoints are accessible without token
- Protected endpoints require a valid JWT
- Invalid/expired token returns `401 Unauthorized`
