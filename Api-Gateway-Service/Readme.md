# Api-Gateway-Service

API Gateway for the Netlife microservices setup using Spring Cloud Gateway (MVC) with Eureka service discovery.

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0

## Default Configuration
- `spring.application.name=ApiGatewayService`
- `server.port=8765`
- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL}`

## Route Configuration
- Route ID: `auth-service`
- Target URI: `lb://AUTHSERVICE`
- Predicate: `Path=/auth/**`

## Required Environment Variables
- `EUREKA_SERVER_URL` (example: `http://localhost:8761/eureka`)

## Run Locally
From `Api-Gateway-Service`:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```
