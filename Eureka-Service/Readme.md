# Eureka-Service

Service registry for the Netlife microservices setup using Spring Cloud Netflix Eureka.

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0

## Default Configuration
- `spring.application.name=eureka-server`
- `server.port=8761`
- `eureka.client.register-with-eureka=false`
- `eureka.client.fetch-registry=false`

## Run Locally
From `Eureka-Service`:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Eureka dashboard:
- `http://localhost:8761`
