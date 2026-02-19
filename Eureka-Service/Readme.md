# Eureka-Service

Service registry for Netlife using Spring Cloud Netflix Eureka server.

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0

## Current Configuration
- `spring.application.name=eureka-server`
- `server.port=8761`
- `eureka.client.register-with-eureka=false`
- `eureka.client.fetch-registry=false`

## Run Locally
From `Eureka-Service`:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

## Local URL
- Dashboard: `http://localhost:8761`
- Registry endpoint: `http://localhost:8761/eureka`
