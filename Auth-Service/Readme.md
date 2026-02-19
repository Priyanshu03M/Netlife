# Auth-Service

Authentication service for Netlife. Handles user registration, login, token refresh, and logout.

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0
- Spring Security
- PostgreSQL
- Flyway
- JJWT (`io.jsonwebtoken`)

## Current Configuration
- `spring.application.name=AuthService`
- `server.port=8080`
- `eureka.client.register-with-eureka=true`
- `eureka.client.fetch-registry=true`
- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL}`
- `spring.jpa.hibernate.ddl-auto=none`
- `spring.flyway.enabled=true`

## Required Environment Variables
- `DB_URL`
  - Example: `jdbc:postgresql://localhost:5432/netlife`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `EUREKA_SERVER_URL`
  - Example: `http://localhost:8761/eureka`

## Token Configuration
- Access token: `jwt.expiration-ms=600000` (10 minutes)
- Refresh token: `refresh-token-expiration=3600000` (60 minutes)

## Current Endpoints
Base path: `/auth`

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/pages`
- `GET /auth/pages1`

## Notes
- Current security config in this service permits all requests (`anyRequest().permitAll()`).
- Access control is primarily enforced at `Api-Gateway-Service`.

## Run Locally
From `Auth-Service`:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

## Local URL
- `http://localhost:8080`
