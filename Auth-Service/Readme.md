# Auth-Service

Authentication and authorization service for Netlife, using JWT, PostgreSQL, Flyway, and Eureka client registration.

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0
- PostgreSQL
- Flyway
- Spring Security + JWT

## Default Configuration
- `spring.application.name=AuthService`
- `server.port=8080`
- `eureka.client.register-with-eureka=true`
- `eureka.client.fetch-registry=true`
- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL}`

## Required Environment Variables
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `EUREKA_SERVER_URL` (example: `http://localhost:8761/eureka`)

## Token Configuration
- Access token expiration: `jwt.expiration-ms=600000`
- Refresh token expiration: `refresh-token-expiration=3600000`

## Run Locally
From `Auth-Service`:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```
