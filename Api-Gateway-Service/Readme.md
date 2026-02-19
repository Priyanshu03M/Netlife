# Api-Gateway-Service

API Gateway for Netlife using Spring Cloud Gateway (MVC) and Eureka discovery.

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0
- Spring Security
- JJWT (`io.jsonwebtoken`)

## Current Configuration
- `spring.application.name=ApiGatewayService`
- `server.port=8765`
- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL}`
- `jwt.secret=${JWT_SECRET}`

## Route Configuration
- Route ID: `auth-service`
- URI: `lb://AUTHSERVICE`
- Predicate: `Path=/auth/**`

## Security Behavior
Public paths:
- `/auth/login`
- `/auth/register`
- `/auth/pages`

Protected:
- Any other path requires a valid bearer token.

Header format:
- `Authorization: Bearer <jwt>`

## Required Environment Variables
- `EUREKA_SERVER_URL`
  - Example: `http://localhost:8761/eureka`
- `JWT_SECRET`

## Run Locally
From `Api-Gateway-Service`:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

## Local URL
- `http://localhost:8765`
